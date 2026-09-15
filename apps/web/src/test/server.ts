import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import type { Transaction, TransactionInput } from "../api/transactions";

export const API = "http://localhost:8787";

const DESCRIPTIONS = [
  "Coffee Shop", "Payroll Deposit", "Grocery Market", "Electric Utility", "Gas Station",
  "Streaming Service", "Restaurant", "Pharmacy", "Transfer from Savings", "Bookstore",
];

export function makeFixtures(): Transaction[] {
  return Array.from({ length: 30 }, (_, i) => {
    const n = i + 1;
    const positive = n % 5 === 0;
    return {
      transactionId: `TXN-${1000 + n}`,
      date: `2024-01-${String(n).padStart(2, "0")}`,
      description: `${DESCRIPTIONS[i % DESCRIPTIONS.length]} #${n}`,
      amount: positive ? `${n * 100}.00` : `-${n}.50`,
      currency: "USD",
      account: n % 3 === 0 ? "Savings" : "Checking",
    };
  });
}

export const db = { rows: makeFixtures(), nextId: 2000 };
export const requests: { method: string; url: URL; body?: unknown }[] = [];

export const handlers = [
  http.get(`${API}/transactions`, ({ request }) => {
    const url = new URL(request.url);
    requests.push({ method: "GET", url });
    const page = Number(url.searchParams.get("page") ?? 1);
    const pageSize = Number(url.searchParams.get("pageSize") ?? 25);
    const sort = (url.searchParams.get("sort") ?? "date") as "date" | "amount" | "description";
    const dir = url.searchParams.get("order") === "desc" ? -1 : 1;
    const sorted = [...db.rows].sort((a, b) => {
      const cmp = sort === "amount" ? Number(a.amount) - Number(b.amount) : a[sort].localeCompare(b[sort]);
      return cmp * dir;
    });
    return HttpResponse.json({
      data: sorted.slice((page - 1) * pageSize, page * pageSize),
      total: db.rows.length,
      page,
      pageSize,
    });
  }),
  http.post(`${API}/transactions`, async ({ request }) => {
    const body = (await request.json()) as TransactionInput;
    requests.push({ method: "POST", url: new URL(request.url), body });
    const created: Transaction = { transactionId: `TXN-${db.nextId++}`, ...body };
    db.rows.push(created);
    return HttpResponse.json(created, { status: 201 });
  }),
  http.put(`${API}/transactions/:id`, async ({ request, params }) => {
    const body = (await request.json()) as TransactionInput;
    requests.push({ method: "PUT", url: new URL(request.url), body });
    const idx = db.rows.findIndex((r) => r.transactionId === params.id);
    if (idx < 0) return HttpResponse.json({ error: { code: "not_found", message: "Not found" } }, { status: 404 });
    const updated: Transaction = { transactionId: String(params.id), ...body };
    db.rows[idx] = updated;
    return HttpResponse.json(updated);
  }),
  http.delete(`${API}/transactions/:id`, ({ request, params }) => {
    requests.push({ method: "DELETE", url: new URL(request.url) });
    const before = db.rows.length;
    db.rows = db.rows.filter((r) => r.transactionId !== params.id);
    if (db.rows.length === before)
      return HttpResponse.json({ error: { code: "not_found", message: "Not found" } }, { status: 404 });
    return new HttpResponse(null, { status: 204 });
  }),
];

export const server = setupServer(...handlers);

export function resetServerState() {
  db.rows = makeFixtures();
  db.nextId = 2000;
  requests.length = 0;
}
