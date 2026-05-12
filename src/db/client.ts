import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForPg = globalThis as unknown as {
  pg?: ReturnType<typeof postgres>;
  drizzleDb?: ReturnType<typeof drizzle>;
};

function getClient() {
  if (globalForPg.pg) return globalForPg.pg;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const c = postgres(url, { max: 10 });
  if (process.env.NODE_ENV !== "production") globalForPg.pg = c;
  else globalForPg.pg = c;
  return c;
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_, prop) {
    if (!globalForPg.drizzleDb) {
      globalForPg.drizzleDb = drizzle(getClient(), { schema });
    }
    return (globalForPg.drizzleDb as any)[prop];
  },
});

export { schema };
