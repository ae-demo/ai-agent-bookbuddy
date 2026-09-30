// GENERATED from specs/design/components/library-service/openapi.yaml,
// restricted to the allow-list in agent.afm.md's `x-aep.tools.openapi[].allow`:
// exactly `searchBooks` and `getBook`. Never add a third operation here —
// the allow-list is the security boundary, not a suggestion.
import { tool } from "ai";
import { z } from "zod";
import { config } from "./config.js";
import { callContext } from "./context.js";

interface ToolResult {
  ok: boolean;
  status: number;
  body: unknown;
}

// Joins the injected base address with a path — never string concatenation,
// since LIBRARY_SERVICE_URL may or may not end in "/".
async function call(method: string, path: string, query?: Record<string, unknown>): Promise<ToolResult> {
  if (!config.libraryServiceUrl) {
    return { ok: false, status: 0, body: { error: "LIBRARY_SERVICE_URL is not configured" } };
  }
  const url = new URL(path.replace(/^\//, ""), config.libraryServiceUrl.endsWith("/") ? config.libraryServiceUrl : `${config.libraryServiceUrl}/`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
  }

  const { authorization } = callContext.getStore() ?? {};
  const headers: Record<string, string> = {};
  if (authorization) headers["authorization"] = authorization;

  let response: Response;
  try {
    response = await fetch(url, { method, headers });
  } catch (err) {
    return { ok: false, status: 0, body: { error: err instanceof Error ? err.message : String(err) } };
  }

  // Parse defensively — a provider that returns HTML or an empty body on an
  // error must still produce a tool result, not throw.
  const text = await response.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { ok: response.ok, status: response.status, body };
}

export const tools = {
  searchBooks: tool({
    description: "Search the library catalogue by genre and/or author",
    inputSchema: z.object({
      genre: z.string().optional().describe("Filter to books of this genre"),
      author: z.string().optional().describe("Filter to books by this author"),
      limit: z.number().int().min(1).max(100).optional().describe("Max results to return, defaults to 20"),
      offset: z.number().int().min(0).optional().describe("Results to skip, for paging"),
    }),
    execute: ({ genre, author, limit, offset }) => call("GET", "/books", { genre, author, limit, offset }),
  }),

  getBook: tool({
    description: "Get one book's details and availability by id",
    inputSchema: z.object({
      id: z.string().describe("The book's catalogue id"),
    }),
    execute: ({ id }) => call("GET", `/books/${encodeURIComponent(id)}`),
  }),
};
