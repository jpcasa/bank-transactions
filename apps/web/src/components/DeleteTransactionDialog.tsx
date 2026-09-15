import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { useDeleteTransaction, type Transaction } from "../api/transactions";

export function DeleteTransactionDialog({
  transaction,
  onOpenChange,
}: {
  transaction: Transaction | null;
  onOpenChange: (open: boolean) => void;
}) {
  const del = useDeleteTransaction();

  const confirm = async () => {
    if (!transaction) return;
    try {
      await del.mutateAsync(transaction.transactionId);
      onOpenChange(false);
    } catch {
      /* surfaced below */
    }
  };

  return (
    <Dialog
      open={transaction !== null}
      onOpenChange={(open) => {
        if (!open) del.reset();
        onOpenChange(open);
      }}
    >
      <DialogContent role="alertdialog">
        <DialogTitle>Delete {transaction?.transactionId}?</DialogTitle>
        <DialogDescription>
          “{transaction?.description}” will be removed permanently. This can’t be undone.
        </DialogDescription>
        {del.error ? (
          <p role="alert" className="mt-3 text-sm text-danger">
            {del.error.message}
          </p>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirm} disabled={del.isPending}>
            {del.isPending ? "Deleting…" : "Delete transaction"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
