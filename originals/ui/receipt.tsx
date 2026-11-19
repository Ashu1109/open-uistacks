"use client";

import { CircleCheck, Printer } from "lucide-react";
import { useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "motion/react";
import { computeTotals, formatMoney, TotalsList, type Discount } from "./cart-summary";
import type { OrderLine } from "./order-summary";

/* Receipt: a paper-style proof of payment with merchant, receipt number, date, itemised lines, totals and the masked payment method; offers print when asked. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const spring = { type: "spring", stiffness: 480, damping: 34 } as const;

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface ReceiptProps {
  merchant: string;
  number: string;
  /** ISO date or Date. */
  paidAt: Date | string;
  lines: OrderLine[];
  currency?: string;
  discount?: Discount;
  taxRate?: number;
  shipping?: number;
  /** Already masked, e.g. "Visa •••• 4242". */
  paymentMethod?: string;
  onPrint?: () => void;
  className?: string;
}

export function Receipt({ merchant, number, paidAt, lines, currency = "USD", discount, taxRate, shipping, paymentMethod, onPrint, className = "" }: ReceiptProps) {
  const reduce = useReduce();
  const totals = computeTotals({ lines, discount, taxRate, shipping });
  const date = new Date(paidAt);
  return (
    <motion.article initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={spring} aria-label={`Receipt ${number}`} className={`mx-auto grid w-full max-w-sm gap-4 rounded-[18px] bg-surface p-6 shadow-[var(--shadow-card)] dark:bg-raised ${className}`}>
      <header className="grid justify-items-center gap-1 text-center">
        <motion.span initial={reduce ? false : { scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ ...spring, delay: 0.1 }} className="grid"><CircleCheck size={28} className="text-success" aria-hidden /></motion.span>
        <h4 className="text-base font-semibold text-fg">{merchant}</h4>
        <p className="text-sm text-fg-muted">Payment of {formatMoney(totals.total, currency)} received</p>
        <p className="text-xs tabular-nums text-fg-subtle">
          #{number} · <time dateTime={date.toISOString()}>{date.toLocaleDateString("en", { dateStyle: "medium" })}</time>
        </p>
      </header>
      <ul className="grid gap-2 border-y border-dashed border-track-strong py-4">
        {lines.map((l, i) => (
          <motion.li key={l.id} initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.2 + i * 0.07 }} className="flex justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-fg">{l.name}{l.quantity > 1 && <span className="text-fg-muted"> × {l.quantity}</span>}</span>
            <span className="tabular-nums text-fg">{formatMoney(l.unitPrice * l.quantity, currency)}</span>
          </motion.li>
        ))}
      </ul>
      <TotalsList totals={totals} currency={currency} discountLabel={discount?.label} />
      {paymentMethod && <p className="text-center text-xs text-fg-muted">Paid with {paymentMethod}</p>}
      {onPrint && (
        <motion.button type="button" onClick={onPrint} whileTap={reduce ? undefined : { scale: 0.97 }} className={`mx-auto flex h-9 items-center gap-2 rounded-[10px] bg-subtle px-3.5 text-sm font-medium text-fg transition-colors hover:bg-track ${ring}`}>
          <Printer size={15} aria-hidden /> Print receipt
        </motion.button>
      )}
    </motion.article>
  );
}
