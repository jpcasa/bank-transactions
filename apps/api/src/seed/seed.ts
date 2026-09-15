import { readFileSync } from "node:fs";
import { sql } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { transactions } from "../db/schema.js";
import { seedCsvPath } from "../paths.js";
import { parseTransactionsCsv } from "./parse.js";

export async function seed(db: Db, csvPath: string = seedCsvPath()): Promise<void> {
  const rows = parseTransactionsCsv(readFileSync(csvPath, "utf8"));
  if (rows.length > 0) {
    await db.insert(transactions).values(rows).onConflictDoNothing({ target: transactions.transactionId });
  }
  await db.execute(sql`
    SELECT setval('transaction_id_seq', GREATEST(
      COALESCE((SELECT MAX((substring(transaction_id FROM '^TXN-(\\d+)$'))::bigint) FROM transactions), 0),
      1000
    ))`);
}
