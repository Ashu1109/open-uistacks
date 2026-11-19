"use client";

import { useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { computeTotals, Money, TotalsList, type Discount } from "./cart-summary";

/* Order summary: a read-only list of purchased lines (name, quantity, price) above subtotal, discount, shipping, tax and total. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const spring = { type: "spring", stiffness: 480, damping: 34 } as const;

export interface OrderLine {
  id: string;
  name: string;
  variant?: string;
  unitPrice: number;
  quantity: number;
}

export interface OrderSummaryProps {
  lines: OrderLine[];
  currency?: string;
  discount?: Discount;
  taxRate?: number;
  shipping?: number;
  title?: string;
  className?: string;
}

export function OrderSummary({ lines, currency = "USD", discount, taxRate, shipping, title = "Order summary", className = "" }: OrderSummaryProps) {
  const reduce = useReduce();
  const totals = computeTotals({ lines, discount, taxRate, shipping });
  return (
    <motion.section initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={spring} aria-label={title} className={`grid gap-4 rounded-[20px] bg-surface p-5 shadow-[var(--shadow-card)] dark:bg-raised ${className}`}>
      <h4 className="text-[15px] font-medium text-fg">{title}</h4>
      <ul className="grid gap-3">
        <AnimatePresence>
        {lines.map((l, i) => (
          <motion.li key={l.id} layout={!reduce} initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ ...spring, delay: i * 0.04 }} className="flex items-start justify-between gap-3 text-sm">
            <span className="min-w-0">
              <span className="block truncate text-fg">{l.name}</span>
              <span className="block text-xs text-fg-muted">{[l.variant, `Qty ${l.quantity}`].filter(Boolean).join(" · ")}</span>
            </span>
            <span className="tabular-nums text-fg"><Money minor={l.unitPrice * l.quantity} currency={currency} /></span>
          </motion.li>
        ))}
        </AnimatePresence>
      </ul>
      <TotalsList totals={totals} currency={currency} discountLabel={discount?.label} className="border-t border-track pt-4" />
    </motion.section>
  );
}
