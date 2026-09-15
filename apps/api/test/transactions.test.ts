import { sql } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { createDb } from "../src/db/client.js";
import { transactions } from "../src/db/schema.js";
import { seed } from "../src/seed/seed.js";

const db = createDb(process.env.TEST_DATABASE_URL!);
const app = createApp(db);

const fixtures = [
  { transactionId: "TXN-1001", date: "2024-01-01", description: "Coffee Shop", amount: "-4.50", currency: "USD", account: "Checking" },
  { transactionId: "TXN-1002", date: "2024-01-03", description: "Salary", amount: "2500.00", currency: "USD", account: "Checking" },
  { transactionId: "TXN-1003", date: "2024-01-02", description: "Bookstore", amount: "-20.00", currency: "EUR", account: "Savings" },
];

const valid = { date: "2024-02-01", description: "Rent", amount: "-1200.00", currency: "USD", account: "Checking" };

const json = (body: unknown) => ({ body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });

beforeEach(async () => {
  await db.execute(sql`TRUNCATE transactions`);
  await db.execute(sql`SELECT setval('transaction_id_seq', 1003)`);
  await db.insert(transactions).values(fixtures);
});

afterAll(async () => {
  await db.close();
});

describe("GET /transactions", () => {
  it("paginates with total, sorted by date desc by default", async () => {
    const res = await app.request("/transactions?page=1&pageSize=2");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: [fixtures[1], fixtures[2]], total: 3, page: 1, pageSize: 2 });
  });

  it("returns the second page", async () => {
    const res = await app.request("/transactions?page=2&pageSize=2");
    expect(await res.json()).toEqual({ data: [fixtures[0]], total: 3, page: 2, pageSize: 2 });
  });

  it("sorts by amount asc", async () => {
    const res = await app.request("/transactions?sort=amount&order=asc");
    const body = (await res.json()) as { data: { transactionId: string }[] };
    expect(body.data.map((t) => t.transactionId)).toEqual(["TXN-1003", "TXN-1001", "TXN-1002"]);
  });

  it("rejects pageSize over 100 with 400 error body", async () => {
    const res = await app.request("/transactions?pageSize=101");
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string; message: string } };
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("GET /transactions/:id", () => {
  it("returns 200 with the transaction", async () => {
    const res = await app.request("/transactions/TXN-1002");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(fixtures[1]);
  });

  it("returns 404 when missing", async () => {
    const res = await app.request("/transactions/TXN-9999");
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: { code: "NOT_FOUND", message: "Transaction TXN-9999 not found" } });
  });
});

describe("POST /transactions", () => {
  it("creates with a server-assigned id", async () => {
    const res = await app.request("/transactions", { method: "POST", ...json(valid) });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ transactionId: "TXN-1004", ...valid });
  });

  it("normalises amount to 2dp", async () => {
    const res = await app.request("/transactions", { method: "POST", ...json({ ...valid, amount: "-5" }) });
    expect(((await res.json()) as { amount: string }).amount).toBe("-5.00");
  });

  it("rejects invalid amount with 400", async () => {
    const res = await app.request("/transactions", { method: "POST", ...json({ ...valid, amount: "12.345" }) });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("PUT /transactions/:id", () => {
  it("replaces and returns 200", async () => {
    const res = await app.request("/transactions/TXN-1001", { method: "PUT", ...json(valid) });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ transactionId: "TXN-1001", ...valid });
    const get = await app.request("/transactions/TXN-1001");
    expect(await get.json()).toEqual({ transactionId: "TXN-1001", ...valid });
  });

  it("returns 404 when missing", async () => {
    const res = await app.request("/transactions/TXN-9999", { method: "PUT", ...json(valid) });
    expect(res.status).toBe(404);
  });

  it("returns 400 on invalid body", async () => {
    const res = await app.request("/transactions/TXN-1001", { method: "PUT", ...json({ ...valid, currency: "usd" }) });
    expect(res.status).toBe(400);
  });
});

describe("DELETE /transactions/:id", () => {
  it("returns 204 then the transaction is gone", async () => {
    const res = await app.request("/transactions/TXN-1001", { method: "DELETE" });
    expect(res.status).toBe(204);
    expect((await app.request("/transactions/TXN-1001")).status).toBe(404);
  });

  it("returns 404 when missing", async () => {
    const res = await app.request("/transactions/TXN-9999", { method: "DELETE" });
    expect(res.status).toBe(404);
  });
});

describe("seed", () => {
  it("is idempotent and advances the id sequence past the CSV", async () => {
    await db.execute(sql`TRUNCATE transactions`);
    await seed(db);
    await seed(db);
    const list = await app.request("/transactions");
    expect(((await list.json()) as { total: number }).total).toBe(100);
    const res = await app.request("/transactions", { method: "POST", ...json(valid) });
    expect(((await res.json()) as { transactionId: string }).transactionId).toBe("TXN-1101");
  });
});

describe("meta", () => {
  it("serves health, openapi and docs", async () => {
    expect(await (await app.request("/health")).json()).toEqual({ status: "ok" });
    const spec = (await (await app.request("/openapi.json")).json()) as { openapi: string; paths: Record<string, unknown> };
    expect(spec.openapi).toBe("3.1.0");
    expect(Object.keys(spec.paths)).toEqual(expect.arrayContaining(["/transactions", "/transactions/{transactionId}"]));
    expect((await app.request("/docs")).status).toBe(200);
  });
});
