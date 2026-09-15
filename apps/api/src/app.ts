import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { asc, count, desc, eq, sql } from "drizzle-orm";
import { cors } from "hono/cors";
import type { Db } from "./db/client.js";
import { transactions } from "./db/schema.js";
import {
  ErrorSchema,
  IdParamSchema,
  ListQuerySchema,
  TransactionInputSchema,
  TransactionListSchema,
  TransactionSchema,
  type Transaction,
} from "./schemas.js";

const tags = ["Transactions"];
const errorResponse = (description: string) => ({ description, content: { "application/json": { schema: ErrorSchema } } });
const txnResponse = (description: string) => ({ description, content: { "application/json": { schema: TransactionSchema } } });
const jsonBody = { required: true, content: { "application/json": { schema: TransactionInputSchema } } };

const listRoute = createRoute({
  method: "get", path: "/transactions", tags, summary: "List transactions",
  request: { query: ListQuerySchema },
  responses: {
    200: { description: "Page of transactions", content: { "application/json": { schema: TransactionListSchema } } },
    400: errorResponse("Invalid query"),
  },
});
const getRoute = createRoute({
  method: "get", path: "/transactions/{transactionId}", tags, summary: "Get a transaction",
  request: { params: IdParamSchema },
  responses: { 200: txnResponse("The transaction"), 404: errorResponse("Not found") },
});
const createTxnRoute = createRoute({
  method: "post", path: "/transactions", tags, summary: "Create a transaction",
  request: { body: jsonBody },
  responses: { 201: txnResponse("Created"), 400: errorResponse("Invalid body") },
});
const updateRoute = createRoute({
  method: "put", path: "/transactions/{transactionId}", tags, summary: "Replace a transaction",
  request: { params: IdParamSchema, body: jsonBody },
  responses: { 200: txnResponse("Updated"), 400: errorResponse("Invalid body"), 404: errorResponse("Not found") },
});
const deleteRoute = createRoute({
  method: "delete", path: "/transactions/{transactionId}", tags, summary: "Delete a transaction",
  request: { params: IdParamSchema },
  responses: { 204: { description: "Deleted" }, 404: errorResponse("Not found") },
});
const healthRoute = createRoute({
  method: "get", path: "/health", tags: ["Meta"], summary: "Health check",
  responses: { 200: { description: "OK", content: { "application/json": { schema: z.object({ status: z.literal("ok") }) } } } },
});

const columns = {
  transactionId: transactions.transactionId,
  date: transactions.date,
  description: transactions.description,
  amount: transactions.amount,
  currency: transactions.currency,
  account: transactions.account,
};
const sortColumns = { date: transactions.date, amount: transactions.amount, description: transactions.description };
const notFound = (id: string) => ({ error: { code: "NOT_FOUND", message: `Transaction ${id} not found` } });
const to2dp = (amount: string) => Number(amount).toFixed(2);

export function createApp(db: Db) {
  const app = new OpenAPIHono({
    defaultHook: (result, c) => {
      if (!result.success) {
        const message = result.error.issues.map((i) => `${i.path.join(".") || "request"}: ${i.message}`).join("; ");
        return c.json({ error: { code: "VALIDATION_ERROR", message } }, 400);
      }
    },
  });

  app.use("*", cors({ origin: process.env.CORS_ORIGIN ?? "*" }));

  app.onError((err, c) => {
    if (err instanceof SyntaxError) return c.json({ error: { code: "BAD_REQUEST", message: "Malformed JSON body" } }, 400);
    console.error(err);
    return c.json({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, 500);
  });

  app.openapi(listRoute, async (c) => {
    const { page, pageSize, sort, order } = c.req.valid("query");
    const dir = order === "asc" ? asc : desc;
    const [data, totals] = await Promise.all([
      db.select(columns).from(transactions)
        .orderBy(dir(sortColumns[sort]), dir(transactions.transactionId))
        .limit(pageSize).offset((page - 1) * pageSize),
      db.select({ total: count() }).from(transactions),
    ]);
    return c.json({ data: data as Transaction[], total: totals[0]?.total ?? 0, page, pageSize }, 200);
  });

  app.openapi(getRoute, async (c) => {
    const { transactionId } = c.req.valid("param");
    const [row] = await db.select(columns).from(transactions).where(eq(transactions.transactionId, transactionId));
    if (!row) return c.json(notFound(transactionId), 404);
    return c.json(row, 200);
  });

  app.openapi(createTxnRoute, async (c) => {
    const input = c.req.valid("json");
    const [row] = await db.insert(transactions)
      .values({ ...input, amount: to2dp(input.amount), transactionId: sql`'TXN-' || nextval('transaction_id_seq')` })
      .returning(columns);
    return c.json(row!, 201);
  });

  app.openapi(updateRoute, async (c) => {
    const { transactionId } = c.req.valid("param");
    const input = c.req.valid("json");
    const [row] = await db.update(transactions)
      .set({ ...input, amount: to2dp(input.amount), updatedAt: sql`now()` })
      .where(eq(transactions.transactionId, transactionId))
      .returning(columns);
    if (!row) return c.json(notFound(transactionId), 404);
    return c.json(row, 200);
  });

  app.openapi(deleteRoute, async (c) => {
    const { transactionId } = c.req.valid("param");
    const deleted = await db.delete(transactions).where(eq(transactions.transactionId, transactionId)).returning({ id: transactions.transactionId });
    if (deleted.length === 0) return c.json(notFound(transactionId), 404);
    return c.body(null, 204);
  });

  app.openapi(healthRoute, (c) => c.json({ status: "ok" as const }, 200));

  app.doc31("/openapi.json", {
    openapi: "3.1.0",
    info: { title: "Bank Transactions API", version: "1.0.0", description: "CRUD API for bank transactions." },
  });
  app.get("/docs", swaggerUI({ url: "/openapi.json" }));

  return app;
}

export type App = ReturnType<typeof createApp>;
