import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

export function createDb(url: string) {
  // prepare: false — Supabase's transaction pooler (port 6543) rejects prepared statements.
  const sql = postgres(url, { max: 10, prepare: false, onnotice: () => {} });
  const db = drizzle(sql, { schema });
  return Object.assign(db, { close: () => sql.end() });
}

export type Db = ReturnType<typeof createDb>;
