// Every environment variable this component reads, read once, here, and
// nowhere else. A sensible default lets the process start with none of them
// set; `/healthz` is what reports which required ones are still missing.

export interface Config {
  port: number;

  // library-service — the sole dependency the two tools call.
  libraryServiceUrl?: string;

  // memory-db (postgres-cnpg) — absence means the in-memory conversation
  // store, not a fault. See src/store.ts.
  memoryDbHost?: string;
  memoryDbPort?: string;
  memoryDbName?: string;
  memoryDbUser?: string;
  memoryDbPassword?: string;

  // Model access — required for a turn to run at all.
  modelEndpoint?: string;
  modelName?: string;
  modelApiKey?: string;
  modelApiFormat?: string;
  modelApiAuthScheme?: string;
  modelApiKeyHeader?: string;
}

export const config: Config = {
  port: Number(process.env.PORT ?? 9090),

  libraryServiceUrl: process.env.LIBRARY_SERVICE_URL,

  memoryDbHost: process.env.MEMORY_DB_HOST,
  memoryDbPort: process.env.MEMORY_DB_PORT,
  memoryDbName: process.env.MEMORY_DB_DBNAME,
  memoryDbUser: process.env.MEMORY_DB_USER,
  memoryDbPassword: process.env.MEMORY_DB_PASSWORD,

  modelEndpoint: process.env.MODEL_ENDPOINT,
  modelName: process.env.MODEL_NAME,
  modelApiKey: process.env.MODEL_API_KEY,
  modelApiFormat: process.env.MODEL_API_FORMAT,
  modelApiAuthScheme: process.env.MODEL_API_AUTH_SCHEME,
  modelApiKeyHeader: process.env.MODEL_API_KEY_HEADER,
};

// The four required model-access variables. None has a fallback — a default
// model id would be right for one host and wrong for every other, so a
// deployment missing one of these is misconfigured and says so via
// `/healthz`'s `missing`, rather than guessing.
export function missingRequiredConfig(): string[] {
  const missing: string[] = [];
  if (!config.modelEndpoint) missing.push("MODEL_ENDPOINT");
  if (!config.modelName) missing.push("MODEL_NAME");
  if (!config.modelApiKey) missing.push("MODEL_API_KEY");
  if (!config.modelApiFormat) missing.push("MODEL_API_FORMAT");
  return missing;
}
