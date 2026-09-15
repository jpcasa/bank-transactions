import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const formatters = new Map<string, Intl.NumberFormat>();

/** Formats a signed decimal string with an explicit sign ("+$1.00" / "−$4.50"). */
export function formatAmount(amount: string, currency: string): string {
  let fmt = formatters.get(currency);
  if (!fmt) {
    try {
      fmt = new Intl.NumberFormat("en-US", { style: "currency", currency, signDisplay: "exceptZero" });
    } catch {
      fmt = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, signDisplay: "exceptZero" });
    }
    formatters.set(currency, fmt);
  }
  const n = Number(amount);
  return Number.isFinite(n) ? fmt.format(n) : amount;
}
