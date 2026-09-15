import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createDb } from "../src/db/client.js";
import { migrationsFolder } from "../src/paths.js";

export default async function setup() {
  const db = createDb(process.env.TEST_DATABASE_URL ?? "postgres://postgres:postgres@localhost:55433/transactions_test");
  try {
    await migrate(db, { migrationsFolder: migrationsFolder() });
  } finally {
    await db.close();
  }
}
