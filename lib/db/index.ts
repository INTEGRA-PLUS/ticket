import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  client?: ReturnType<typeof postgres>;
  db?: ReturnType<typeof drizzle<typeof schema>>;
};

function getClient() {
  if (globalForDb.client) return globalForDb.client;
  const url = process.env.DATABASE_URL;
  
  // Si no hay URL (solo durante el build), usamos una dummy
  if (!url) {
    return postgres("postgres://dummy:dummy@localhost:5432/dummy", { prepare: false });
  }

  const client = postgres(url, { prepare: false });
  globalForDb.client = client;
  return client;
}

export const db: ReturnType<typeof drizzle<typeof schema>> =
  globalForDb.db ??
  (() => {
    const d = drizzle(getClient(), { schema });
    globalForDb.db = d;
    return d;
  })();

export { schema };
