import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  useCreateTransaction,
  useUpdateTransaction,
  type Transaction,
  type TransactionInput,
} from "../api/transactions";

export const transactionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a date"),
  description: z.string().trim().min(1, "Description is required").max(255, "Keep it under 255 characters"),
  amount: z.string().trim().regex(/^-?\d+(\.\d{1,2})?$/, "Use a number like -4.50 or 1200"),
  currency: z.string().trim().regex(/^[A-Z]{3}$/, "Use a 3-letter code like USD"),
  account: z.string().trim().min(1, "Account is required"),
});

type FormValues = z.infer<typeof transactionSchema>;

const emptyValues = (): FormValues => ({
  date: new Date().toISOString().slice(0, 10),
  description: "",
  amount: "",
  currency: "USD",
  account: "Checking",
});

export interface TransactionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the dialog edits this transaction; otherwise it creates one. */
  transaction?: Transaction | null;
}

export function TransactionFormDialog({ open, onOpenChange, transaction }: TransactionFormDialogProps) {
  const isEdit = Boolean(transaction);
  const create = useCreateTransaction();
  const update = useUpdateTransaction();
  const mutation = isEdit ? update : create;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(transactionSchema), defaultValues: emptyValues() });

  useEffect(() => {
    if (!open) return;
    create.reset();
    update.reset();
    reset(
      transaction
        ? {
            date: transaction.date,
            description: transaction.description,
            amount: transaction.amount,
            currency: transaction.currency,
            account: transaction.account,
          }
        : emptyValues(),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, transaction, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const body: TransactionInput = values;
    try {
      if (transaction) await update.mutateAsync({ transactionId: transaction.transactionId, body });
      else await create.mutateAsync(body);
      onOpenChange(false);
    } catch {
      /* surfaced via mutation.error */
    }
  });

  const field = (name: keyof FormValues) => ({
    id: `txn-${name}`,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `txn-${name}-error` : undefined,
    ...register(name),
  });

  const errorFor = (name: keyof FormValues) =>
    errors[name] ? (
      <p id={`txn-${name}-error`} className="text-xs text-danger">
        {errors[name]?.message}
      </p>
    ) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{isEdit ? `Edit ${transaction?.transactionId}` : "New transaction"}</DialogTitle>
        <DialogDescription>
          {isEdit ? "Update the details of this transaction." : "Negative amounts are money out; positive amounts are money in."}
        </DialogDescription>

        <form onSubmit={onSubmit} noValidate className="mt-5 grid grid-cols-2 gap-x-3 gap-y-4">
          <div className="col-span-2 grid gap-1.5 sm:col-span-1">
            <Label htmlFor="txn-date">Date</Label>
            <Input type="date" {...field("date")} />
            {errorFor("date")}
          </div>
          <div className="col-span-2 grid gap-1.5 sm:col-span-1">
            <Label htmlFor="txn-account">Account</Label>
            <Input {...field("account")} />
            {errorFor("account")}
          </div>
          <div className="col-span-2 grid gap-1.5">
            <Label htmlFor="txn-description">Description</Label>
            <Input {...field("description")} />
            {errorFor("description")}
          </div>
          <div className="col-span-2 grid gap-1.5 sm:col-span-1">
            <Label htmlFor="txn-amount">Amount</Label>
            <Input inputMode="decimal" placeholder="-4.50" className="tabular-nums" {...field("amount")} />
            {errorFor("amount")}
          </div>
          <div className="col-span-2 grid gap-1.5 sm:col-span-1">
            <Label htmlFor="txn-currency">Currency</Label>
            <Input maxLength={3} className="uppercase" {...field("currency")} />
            {errorFor("currency")}
          </div>

          {mutation.error ? (
            <p role="alert" className="col-span-2 rounded-md bg-danger/8 px-3 py-2 text-sm text-danger">
              {mutation.error.message}
            </p>
          ) : null}

          <div className="col-span-2 mt-1 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : isEdit ? "Save changes" : "Create transaction"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
