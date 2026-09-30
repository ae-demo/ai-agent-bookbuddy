import "./tracing.js"; // side effects: registers the OTel provider, if configured

import http from "node:http";
import { randomUUID } from "node:crypto";
import { config, missingRequiredConfig } from "./config.js";
import { callContext } from "./context.js";
import { ensureStore, isStoreReady, initStore, loadConversation, saveConversation } from "./store.js";
import { runTurn } from "./agent.js";
import { traceTurn } from "./tracing.js";

function sendJson(res: http.ServerResponse, status: number, body: unknown): void {
  const text = JSON.stringify(body);
  res.writeHead(status, { "content-type": "application/json" });
  res.end(text);
}

async function readBody(req: http.IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  const text = Buffer.concat(chunks).toString("utf8");
  if (!text) return {};
  return JSON.parse(text);
}

// Reads the AI SDK's APICallError body; returns null for anything else. The
// ONE upstream error shape this agent relays — a guardrail refusing the
// caller's message is a fact about their input, not a fault in this agent.
function guardrailBlock(err: unknown): { name: string; reason: string } | null {
  const body = (err as { responseBody?: string; data?: unknown })?.responseBody;
  if (!body) return null;
  try {
    const m = (JSON.parse(body) as { message?: { action?: string; actionReason?: string; interveningGuardrail?: string } })?.message;
    if (m?.action !== "GUARDRAIL_INTERVENED") return null;
    return { name: m.interveningGuardrail ?? "guardrail", reason: m.actionReason ?? "refused by policy" };
  } catch {
    return null;
  }
}

const genAiSystem = config.modelApiFormat === "openai-compatible" ? "openai" : "anthropic";

async function handleChat(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  // 1. gate: 401 without x-user-id. A header Node saw TWICE arrives as
  // string[]; accepting it would key rows by a joined value, so a non-string
  // is refused rather than coerced.
  const userId = req.headers["x-user-id"];
  if (typeof userId !== "string" || userId === "") {
    res.statusCode = 401;
    res.end();
    return;
  }

  const parsed = await readBody(req);
  const body = (parsed && typeof parsed === "object" ? parsed : {}) as {
    conversationId?: unknown;
    message?: unknown;
  };

  // 2. validate: a bad message is a bad REQUEST, not a server error.
  if (typeof body.message !== "string" || body.message.trim() === "") {
    sendJson(res, 400, { error: "expected { message: string }" });
    return;
  }
  if (body.conversationId !== undefined && typeof body.conversationId !== "string") {
    sendJson(res, 400, { error: "conversationId must be a string when present" });
    return;
  }

  // 3. the store must be ready before a conversation can be resolved.
  try {
    await ensureStore();
  } catch (err) {
    console.error("store not ready:", err);
    sendJson(res, 500, { error: "conversation store is not ready" });
    return;
  }

  let conversationId: string;
  let history: Awaited<ReturnType<typeof loadConversation>>;
  if (typeof body.conversationId === "string") {
    conversationId = body.conversationId;
    history = await loadConversation(conversationId, userId);
    if (history === null) {
      sendJson(res, 404, { error: "conversation not found" });
      return;
    }
  } else {
    conversationId = randomUUID();
    history = [];
  }

  const full = [...history, { role: "user" as const, content: body.message }];

  const authorization = req.headers.authorization;
  try {
    const turn = await callContext.run({ authorization }, () =>
      traceTurn(
        { conversationId, model: config.modelName ?? "", system: genAiSystem, message: body.message as string },
        (hooks) => runTurn(full, hooks),
      ),
    );

    // 6. save the FULL trail — tool calls and results included — never just
    // the reply. This upsert is the only place a row is created, so a turn
    // that threw above leaves nothing in the store to orphan.
    await saveConversation(conversationId, userId, [
      ...full,
      ...turn.steps.flatMap((s) => s.response.messages),
    ]);

    sendJson(res, 200, { conversationId, text: turn.text, toolCalls: turn.toolCalls });
  } catch (err) {
    const g = guardrailBlock(err);
    if (g) {
      sendJson(res, 422, { error: g.reason, guardrail: g.name });
      return;
    }
    console.error("chat turn failed:", err);
    sendJson(res, 500, { error: "internal error" });
  }
}

function handleHealthz(res: http.ServerResponse): void {
  const missing = missingRequiredConfig();
  const store = isStoreReady() ? "ready" : "initialising";
  if (missing.length > 0 || store !== "ready") {
    sendJson(res, 503, { ok: false, missing, store });
    return;
  }
  sendJson(res, 200, { ok: true });
}

async function handle(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  const url = new URL(req.url ?? "/", "http://localhost");
  if (req.method === "POST" && url.pathname === "/chat") {
    await handleChat(req, res);
    return;
  }
  if (req.method === "GET" && url.pathname === "/healthz") {
    handleHealthz(res);
    return;
  }
  res.statusCode = 404;
  res.end();
}

const server = http.createServer((req, res) => {
  void handle(req, res).catch((err) => {
    console.error("chat turn failed:", err);
    if (!res.headersSent) sendJson(res, 500, { error: "internal error" });
    else res.destroy();
  });
});

// Fire-and-forget: the schema init runs in the background so a database
// still provisioning never blocks the port from binding.
initStore();

server.listen(config.port, () => {
  console.log(`book-buddy listening on ${config.port}`);
});
