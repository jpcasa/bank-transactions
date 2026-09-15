import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { seedCsvPath } from "../paths.js";
import { parseTransactionsCsv } from "./parse.js";

describe("parseTransactionsCsv", () => {
  it("maps CSV rows to Transactions", () => {
    const rows = parseTransactionsCsv(readFileSync(seedCsvPath(), "utf8"));
    expect(rows).toHaveLength(100);
    expect(rows[0]).toEqual({
      transactionId: "TXN-1001",
      date: "2024-01-01",
      description: "Coffee Shop",
      amount: "-4.50",
      currency: "USD",
      account: "Checking",
    });
  });
});
