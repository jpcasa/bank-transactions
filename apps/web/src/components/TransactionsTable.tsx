import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Pencil, RotateCw, Trash2 } from "lucide-react";
import { useTransactions, type SortField, type Transaction } from "../api/transactions";
import { cn, formatAmount } from "../lib/utils";
import { PAGE_SIZES, useListParams } from "../lib/useListParams";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

const COLUMN_COUNT = 7;

export interface TransactionsTableProps {
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}

export function TransactionsTable({ onEdit, onDelete }: TransactionsTableProps) {
  const [params, setParams] = useListParams();
  const query = useTransactions(params);
  const { data } = query;

  const total = data?.total ?? 0;
  const rows = data?.data ?? [];
  const lastPage = Math.max(1, Math.ceil(total / params.pageSize));
  const from = total === 0 ? 0 : (params.page - 1) * params.pageSize + 1;
  const to = Math.min(total, params.page * params.pageSize);

  const toggleSort = (field: SortField) => {
    const order = params.sort === field && params.order === "asc" ? "desc" : "asc";
    setParams({ sort: field, order, page: 1 });
  };

  const sortHead = (field: SortField, label: string, align: "left" | "right" = "left") => {
    const active = params.sort === field;
    const Icon = !active ? ArrowUpDown : params.order === "asc" ? ArrowUp : ArrowDown;
    return (
      <TableHead
        aria-sort={active ? (params.order === "asc" ? "ascending" : "descending") : "none"}
        className={cn(align === "right" && "text-right")}
      >
        <button
          type="button"
          onClick={() => toggleSort(field)}
          className={cn(
            "-mx-1.5 inline-flex items-center gap-1 rounded px-1.5 py-1 hover:bg-canvas hover:text-ink focus-visible:outline-2 focus-visible:outline-accent",
            active && "text-ink",
            align === "right" && "flex-row-reverse",
          )}
        >
          {label}
          <Icon className={cn("size-3.5", !active && "opacity-40")} aria-hidden />
        </button>
      </TableHead>
    );
  };

  let body: ReactNode;
  if (query.isPending) {
    body = Array.from({ length: Math.min(params.pageSize, 8) }, (_, i) => (
      <TableRow key={i} aria-hidden data-testid="skeleton-row">
        {Array.from({ length: COLUMN_COUNT }, (_, j) => (
          <TableCell key={j}>
            <div className={cn("h-3 animate-pulse rounded bg-line", j === 2 ? "w-44" : "w-16", j === 3 && "ml-auto")} />
          </TableCell>
        ))}
      </TableRow>
    ));
  } else if (query.isError) {
    body = (
      <tr>
        <td colSpan={COLUMN_COUNT} className="px-3 py-14 text-center">
          <p className="font-medium text-ink">Couldn’t load transactions</p>
          <p className="mt-1 text-sm text-ink-muted">{query.error.message}</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => void query.refetch()}>
            <RotateCw aria-hidden /> Retry
          </Button>
        </td>
      </tr>
    );
  } else if (rows.length === 0) {
    body = (
      <tr>
        <td colSpan={COLUMN_COUNT} className="px-3 py-14 text-center">
          <p className="font-medium text-ink">No transactions yet</p>
          <p className="mt-1 text-sm text-ink-muted">Create one, or import a CSV through the API.</p>
        </td>
      </tr>
    );
  } else {
    body = rows.map((t) => {
      const negative = t.amount.trim().startsWith("-");
      return (
        <TableRow key={t.transactionId}>
          <TableCell className="font-mono text-xs text-ink-muted">{t.transactionId}</TableCell>
          <TableCell className="tabular-nums">{t.date}</TableCell>
          <TableCell className="max-w-[22rem] truncate" title={t.description}>
            {t.description}
          </TableCell>
          <TableCell
            className={cn("text-right font-medium tabular-nums", negative ? "text-debit" : "text-credit")}
            data-sign={negative ? "negative" : "positive"}
          >
            {formatAmount(t.amount, t.currency)}
          </TableCell>
          <TableCell className="text-ink-muted">{t.currency}</TableCell>
          <TableCell>{t.account}</TableCell>
          <TableCell className="text-right">
            <div className="inline-flex gap-0.5">
              <Button variant="ghost" size="icon" onClick={() => onEdit(t)} aria-label={`Edit ${t.transactionId}`}>
                <Pencil aria-hidden />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="hover:text-danger"
                onClick={() => onDelete(t)}
                aria-label={`Delete ${t.transactionId}`}
              >
                <Trash2 aria-hidden />
              </Button>
            </div>
          </TableCell>
        </TableRow>
      );
    });
  }

  return (
    <section className="overflow-hidden rounded-lg border border-line bg-surface" aria-label="Transactions">
      <div className="max-h-[calc(100dvh-13rem)] overflow-auto">
        <Table aria-busy={query.isFetching}>
          <TableHeader>
            <tr>
              <TableHead>Transaction ID</TableHead>
              {sortHead("date", "Date")}
              {sortHead("description", "Description")}
              {sortHead("amount", "Amount", "right")}
              <TableHead>Currency</TableHead>
              <TableHead>Account</TableHead>
              <TableHead className="text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </tr>
          </TableHeader>
          <TableBody className={cn(query.isPlaceholderData && "opacity-60 transition-opacity")}>{body}</TableBody>
        </Table>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-3 py-2.5 text-sm text-ink-muted">
        <p aria-live="polite" className="tabular-nums">
          {data ? `Showing ${from}–${to} of ${total}` : " "}
        </p>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2">
            Rows
            <select
              value={params.pageSize}
              onChange={(e) => setParams({ pageSize: Number(e.target.value), page: 1 })}
              className="h-8 rounded-md border border-line-strong bg-surface px-2 text-ink tabular-nums"
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-1">
            <Button
              variant="secondary"
              size="sm"
              disabled={params.page <= 1}
              onClick={() => setParams({ page: params.page - 1 })}
            >
              <ChevronLeft aria-hidden /> Prev
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={!data || params.page >= lastPage}
              onClick={() => setParams({ page: params.page + 1 })}
            >
              Next <ChevronRight aria-hidden />
            </Button>
          </div>
        </div>
      </footer>
    </section>
  );
}
