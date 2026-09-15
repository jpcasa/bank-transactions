import { parse } from "csv-parse/sync";
import type { Transaction } from "../schemas.js";

type Row = { transaction_id: string; date: string; description: string; amount: string; currency: string; account: string };

export function parseTransactionsCsv(csvText: string): Transaction[] {
  const rows = parse(csvText, { columns: true, skip_empty_lines: true, trim: true }) as Row[];
  return rows.map((r) => ({
    transactionId: r.transaction_id,
    date: r.date,
    description: r.description,
    amount: Number(r.amount).toFixed(2),
    currency: r.currency,
    account: r.account,
  }));
}
