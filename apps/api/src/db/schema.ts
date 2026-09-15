import { numeric, pgSequence, pgTable, text, date, timestamp, char } from "drizzle-orm/pg-core";

export const transactionIdSeq = pgSequence("transaction_id_seq", { startWith: 1001 });

export const transactions = pgTable("transactions", {
  transactionId: text("transaction_id").primaryKey(),
  date: date("date", { mode: "string" }).notNull(),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: char("currency", { length: 3 }).notNull(),
  account: text("account").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
