import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { renderApp } from "../test/render";
import { API, requests, server } from "../test/server";

const lastGet = () => requests.filter((r) => r.method === "GET").at(-1)!.url.searchParams;

describe("TransactionsTable", () => {
  it("renders the first page of rows and the total", async () => {
    renderApp();
    // default sort is date desc → TXN-1030 first
    expect(await screen.findByText("TXN-1030")).toBeInTheDocument();
    expect(screen.getByText("Showing 1–25 of 30")).toBeInTheDocument();
    expect(screen.queryByText("TXN-1005")).not.toBeInTheDocument();
    // amount formatted with sign, not colour alone
    const row = screen.getByText("TXN-1029").closest("tr")!;
    expect(within(row).getByText("-$29.50")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /prev/i })).toBeDisabled();
  });

  it("clicking Next requests page 2 and shows its rows", async () => {
    const { user } = renderApp();
    await screen.findByText("TXN-1030");
    await user.click(screen.getByRole("button", { name: /next/i }));
    expect(await screen.findByText("TXN-1005")).toBeInTheDocument();
    expect(lastGet().get("page")).toBe("2");
    expect(screen.getByText("Showing 26–30 of 30")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
    expect(window.location.search).toContain("page=2");
  });

  it("clicking the Amount header sorts asc, then desc", async () => {
    const { user } = renderApp();
    await screen.findByText("TXN-1030");
    const amountHeader = () => screen.getByRole("columnheader", { name: /amount/i });

    await user.click(within(amountHeader()).getByRole("button"));
    await waitFor(() => expect(lastGet().get("sort")).toBe("amount"));
    expect(lastGet().get("order")).toBe("asc");
    await waitFor(() => expect(amountHeader()).toHaveAttribute("aria-sort", "ascending"));

    await user.click(within(amountHeader()).getByRole("button"));
    await waitFor(() => expect(lastGet().get("order")).toBe("desc"));
    expect(amountHeader()).toHaveAttribute("aria-sort", "descending");
  });

  it("shows an error state with retry", async () => {
    server.use(
      http.get(`${API}/transactions`, () =>
        HttpResponse.json({ error: { code: "boom", message: "Database unavailable" } }, { status: 500 }),
      ),
    );
    const { user } = renderApp();
    expect(await screen.findByText("Database unavailable")).toBeInTheDocument();
    server.resetHandlers();
    await user.click(screen.getByRole("button", { name: /retry/i }));
    expect(await screen.findByText("TXN-1030")).toBeInTheDocument();
  });

  it("deletes a transaction after confirmation", async () => {
    const { user } = renderApp();
    await screen.findByText("TXN-1030");
    await user.click(screen.getByRole("button", { name: "Delete TXN-1030" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(requests.some((r) => r.method === "DELETE")).toBe(false);
    await user.click(within(dialog).getByRole("button", { name: /delete transaction/i }));
    await waitFor(() => expect(screen.queryByText("TXN-1030")).not.toBeInTheDocument());
    const del = requests.filter((r) => r.method === "DELETE");
    expect(del).toHaveLength(1);
    expect(del[0]!.url.pathname).toBe("/transactions/TXN-1030");
  });
});
