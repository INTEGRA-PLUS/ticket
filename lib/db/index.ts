import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  client?: ReturnType<typeof postgres>;
  db?: ReturnType<typeof drizzle<typeof schema>>;
};

function getClient() {
  const url = process.env.DATABASE_URL;
  
  // Durante el build no hay URL, devolvemos algo que no se guarde en memoria
  if (!url) {
    return postgres("postgres://dummy:dummy@localhost:5432/dummy", { prepare: false });
  }

  if (globalForDb.client) return globalForDb.client;

  const client = postgres(url, { prepare: false });
  if (process.env.NODE_ENV !== "production") globalForDb.client = client;
  return client;
}

export const db: ReturnType<typeof drizzle<typeof schema>> =
  new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
    get(_target, prop) {
      if (!globalForDb.db) {
        globalForDb.db = drizzle(getClient(), { schema });
      }
      return Reflect.get(globalForDb.db, prop);
    },
  });

export { schema };
