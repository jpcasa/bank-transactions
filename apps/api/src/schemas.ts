import { z } from "@hono/zod-openapi";

export const TransactionInputSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD").openapi({ example: "2024-01-01" }),
    description: z.string().min(1).max(255).openapi({ example: "Coffee Shop" }),
    amount: z.string().regex(/^-?\d+(\.\d{1,2})?$/, "amount must be a signed decimal with up to 2 decimals").openapi({ example: "-4.50" }),
    currency: z.string().regex(/^[A-Z]{3}$/, "currency must be a 3-letter uppercase code").openapi({ example: "USD" }),
    account: z.string().min(1).max(100).openapi({ example: "Checking" }),
  })
  .openapi("TransactionInput");

export const TransactionSchema = z
  .object({
    transactionId: z.string().openapi({ example: "TXN-1001" }),
    date: z.string().openapi({ example: "2024-01-01" }),
    description: z.string().openapi({ example: "Coffee Shop" }),
    amount: z.string().openapi({ example: "-4.50" }),
    currency: z.string().openapi({ example: "USD" }),
    account: z.string().openapi({ example: "Checking" }),
  })
  .openapi("Transaction");

export const TransactionListSchema = z
  .object({
    data: z.array(TransactionSchema),
    total: z.number().int(),
    page: z.number().int(),
    pageSize: z.number().int(),
  })
  .openapi("TransactionList");

export const ListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).openapi({ param: { name: "page", in: "query" }, example: 1 }),
  pageSize: z.coerce.number().int().min(1).max(100).default(25).openapi({ param: { name: "pageSize", in: "query" }, example: 25 }),
  sort: z.enum(["date", "amount", "description"]).default("date").openapi({ param: { name: "sort", in: "query" } }),
  order: z.enum(["asc", "desc"]).default("desc").openapi({ param: { name: "order", in: "query" } }),
});

export const IdParamSchema = z.object({
  transactionId: z.string().min(1).openapi({ param: { name: "transactionId", in: "path" }, example: "TXN-1001" }),
});

export const ErrorSchema = z
  .object({ error: z.object({ code: z.string(), message: z.string() }) })
  .openapi("Error");

export type Transaction = z.infer<typeof TransactionSchema>;
export type TransactionInput = z.infer<typeof TransactionInputSchema>;
