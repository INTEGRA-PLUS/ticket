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
  if (!url) throw new Error("DATABASE_URL is not set");
  const client = postgres(url, { prepare: false });
  if (process.env.NODE_ENV !== "production") globalForDb.client = client;
  return client;
}

export const db: ReturnType<typeof drizzle<typeof schema>> =
  globalForDb.db ??
  new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
    get(_target, prop) {
      if (!globalForDb.db) {
        globalForDb.db = drizzle(getClient(), { schema });
      }
      return Reflect.get(globalForDb.db, prop);
    },
  });

export { schema };
