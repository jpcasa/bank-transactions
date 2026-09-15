import { useState } from "react";
import { Plus } from "lucide-react";
import type { Transaction } from "./api/transactions";
import { Button } from "./components/ui/button";
import { TransactionsTable } from "./components/TransactionsTable";
import { TransactionFormDialog } from "./components/TransactionFormDialog";
import { DeleteTransactionDialog } from "./components/DeleteTransactionDialog";

export function App() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">Transactions</h1>
          <p className="mt-0.5 text-sm text-ink-muted">Money in and out across your accounts.</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus aria-hidden /> New transaction
        </Button>
      </header>

      <TransactionsTable
        onEdit={(t) => {
          setEditing(t);
          setFormOpen(true);
        }}
        onDelete={setDeleting}
      />

      <TransactionFormDialog open={formOpen} onOpenChange={setFormOpen} transaction={editing} />
      <DeleteTransactionDialog transaction={deleting} onOpenChange={(open) => !open && setDeleting(null)} />
    </div>
  );
}
