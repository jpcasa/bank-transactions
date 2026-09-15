import { screen, waitFor, within } from "@testing-library/react";
import { renderApp } from "../test/render";
import { requests } from "../test/server";

describe("TransactionFormDialog", () => {
  it("shows validation errors and does not POST invalid input", async () => {
    const { user } = renderApp();
    await screen.findByText("TXN-1030");
    await user.click(screen.getByRole("button", { name: /new transaction/i }));
    const dialog = await screen.findByRole("dialog");

    await user.type(within(dialog).getByLabelText("Amount"), "12.345");
    await user.click(within(dialog).getByRole("button", { name: /create transaction/i }));

    expect(await within(dialog).findByText("Description is required")).toBeInTheDocument();
    expect(within(dialog).getByText(/use a number like/i)).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Amount")).toHaveAttribute("aria-invalid", "true");
    expect(requests.some((r) => r.method === "POST")).toBe(false);
  });

  it("POSTs a valid transaction, closes, and shows the new row", async () => {
    const { user } = renderApp();
    await screen.findByText("TXN-1030");
    await user.click(screen.getByRole("button", { name: /new transaction/i }));
    const dialog = await screen.findByRole("dialog");

    const date = within(dialog).getByLabelText("Date");
    await user.clear(date);
    await user.type(date, "2024-02-15");
    await user.type(within(dialog).getByLabelText("Description"), "Bike repair");
    await user.type(within(dialog).getByLabelText("Amount"), "-89.99");
    await user.click(within(dialog).getByRole("button", { name: /create transaction/i }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    const post = requests.find((r) => r.method === "POST");
    expect(post?.body).toEqual({
      date: "2024-02-15",
      description: "Bike repair",
      amount: "-89.99",
      currency: "USD",
      account: "Checking",
    });
    expect(await screen.findByText("TXN-2000")).toBeInTheDocument();
    expect(screen.getByText("Bike repair")).toBeInTheDocument();
  });

  it("edits an existing transaction with PUT", async () => {
    const { user } = renderApp();
    await screen.findByText("TXN-1030");
    await user.click(screen.getByRole("button", { name: "Edit TXN-1030" }));
    const dialog = await screen.findByRole("dialog");
    const desc = within(dialog).getByLabelText("Description");
    expect(desc).toHaveValue("Bookstore #30");
    await user.clear(desc);
    await user.type(desc, "Used books");
    await user.click(within(dialog).getByRole("button", { name: /save changes/i }));
    expect(await screen.findByText("Used books")).toBeInTheDocument();
    const put = requests.find((r) => r.method === "PUT");
    expect(put?.url.pathname).toBe("/transactions/TXN-1030");
  });
});
