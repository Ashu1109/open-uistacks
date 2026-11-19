"use client";

import { useLayoutEffect, useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import { AnimatePresence, animate, motion, useReducedMotion } from "motion/react";

/* Cart summary: subtotal, discount, shipping, tax and total with an optional promo code field and checkout button; all arithmetic runs in integer minor units (cents) through the exported helpers. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const spring = { type: "spring", stiffness: 480, damping: 34 } as const;

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface MoneyLine {
  /** Price of one unit in minor units, such as cents. */
  unitPrice: number;
  quantity: number;
}

export type Discount = { type: "percent"; value: number; label?: string } | { type: "fixed"; amount: number; label?: string };

export interface TotalsInput {
  lines: MoneyLine[];
  discount?: Discount;
  /** Fraction, 0.08 for 8%; applied after the discount. */
  taxRate?: number;
  shipping?: number;
}

export interface Totals {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
}

/** Formats minor units with Intl.NumberFormat, honouring the currency's own decimal places (JPY has none). */
export function formatMoney(minor: number, currency = "USD", locale = "en-US"): string {
  const fmt = new Intl.NumberFormat(locale, { style: "currency", currency });
  const digits = fmt.resolvedOptions().maximumFractionDigits ?? 2;
  return fmt.format(minor / 10 ** digits);
}

export function discountAmount(subtotal: number, discount?: Discount): number {
  if (!discount) return 0;
  const raw = discount.type === "percent" ? Math.round((subtotal * discount.value) / 100) : discount.amount;
  return Math.min(Math.max(raw, 0), subtotal);
}

export function computeTotals({ lines, discount, taxRate = 0, shipping = 0 }: TotalsInput): Totals {
  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const off = discountAmount(subtotal, discount);
  const tax = Math.round((subtotal - off) * taxRate);
  return { subtotal, discount: off, shipping, tax, total: subtotal - off + shipping + tax };
}

/** A money amount that tweens to its new value; the final text stays in the DOM (screen readers, tests) while an aria-hidden copy counts toward it. */
export function Money({ minor, currency = "USD", className }: { minor: number; currency?: string; className?: string }) {
  const reduce = useReduce();
  const shown = useRef(minor);
  const [live, setLive] = useState<number | null>(null);
  useLayoutEffect(() => {
    if (reduce || shown.current === minor) {
      shown.current = minor;
      return;
    }
    setLive(shown.current);
    const controls = animate(shown.current, minor, {
      duration: 0.45,
      ease: "easeOut",
      onUpdate: (v) => {
        shown.current = v;
        setLive(v);
      },
      onComplete: () => {
        shown.current = minor;
        setLive(null);
      },
    });
    return () => controls.stop();
  }, [minor, reduce]);
  if (live === null) return <span className={className}>{formatMoney(minor, currency)}</span>;
  return (
    <span className={className}>
      <span className="sr-only">{formatMoney(minor, currency)}</span>
      <span aria-hidden>{formatMoney(Math.round(live), currency)}</span>
    </span>
  );
}

export interface TotalsListProps {
  totals: Totals;
  currency?: string;
  discountLabel?: string;
  className?: string;
}

export function TotalsList({ totals, currency = "USD", discountLabel = "Discount", className = "" }: TotalsListProps) {
  const reduce = useReduce();
  const row = (label: string, value: ReactNode, tone = "text-fg-muted") => (
    <div className="flex justify-between text-sm"><dt className="text-fg-muted">{label}</dt><dd className={`tabular-nums ${tone}`}>{value}</dd></div>
  );
  const money = (minor: number) => <Money minor={minor} currency={currency} />;
  return (
    <dl className={`grid gap-2 ${className}`}>
      {row("Subtotal", money(totals.subtotal), "text-fg")}
      <AnimatePresence initial={false}>
        {totals.discount > 0 && (
          <motion.div key="discount" initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }} animate={reduce ? { opacity: 1 } : { opacity: 1, height: "auto" }} exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            {row(discountLabel, <>−{money(totals.discount)}</>, "text-success-text")}
          </motion.div>
        )}
      </AnimatePresence>
      {row("Shipping", totals.shipping === 0 ? "Free" : money(totals.shipping), "text-fg")}
      {row("Tax", money(totals.tax), "text-fg")}
      <div className="flex justify-between border-t border-track pt-3 text-base font-semibold text-fg"><dt>Total</dt><dd className="tabular-nums">{money(totals.total)}</dd></div>
    </dl>
  );
}

export interface CartSummaryProps extends TotalsInput {
  currency?: string;
  /** Shows a promo field; return an error string to display, or nothing when the code was accepted. */
  onApplyCode?: (code: string) => string | void;
  onCheckout?: () => void;
  checkoutLabel?: string;
  className?: string;
}

export function CartSummary({ currency = "USD", onApplyCode, onCheckout, checkoutLabel = "Checkout", className = "", ...input }: CartSummaryProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const totals = computeTotals(input);
  const empty = input.lines.length === 0;
  const reduce = useReduce();

  const apply = (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setError(onApplyCode?.(code.trim()) || null);
  };

  return (
    <motion.section initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={spring} aria-label="Order summary" className={`grid gap-4 rounded-[20px] bg-surface p-5 shadow-[var(--shadow-card)] dark:bg-raised ${className}`}>
      <h4 className="text-[15px] font-medium text-fg">Summary</h4>
      {onApplyCode && (
        <form onSubmit={apply} className="grid gap-1.5">
          <div className="flex gap-2">
            <input aria-label="Promo code" aria-invalid={error ? true : undefined} placeholder="Promo code" value={code} onChange={(e) => setCode(e.target.value)} className={`h-9 min-w-0 flex-1 rounded-[10px] bg-subtle px-3 text-sm text-fg placeholder:text-fg-subtle ${ring}`} />
            <motion.button type="submit" whileTap={reduce ? undefined : { scale: 0.97 }} className={`h-9 rounded-[10px] bg-subtle px-3 text-sm font-medium text-fg transition-colors hover:bg-track ${ring}`}>Apply</motion.button>
          </div>
          <AnimatePresence>{error && <motion.p role="alert" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="text-xs text-danger-text">{error}</motion.p>}</AnimatePresence>
        </form>
      )}
      <TotalsList totals={totals} currency={currency} discountLabel={input.discount?.label} />
      {onCheckout && (
        <motion.button type="button" disabled={empty} onClick={onCheckout} whileHover={reduce || empty ? undefined : { y: -1 }} whileTap={reduce || empty ? undefined : { scale: 0.98 }} className={`h-11 rounded-[12px] bg-[image:var(--grad-primary)] text-sm font-medium text-[var(--inverse-fg)] shadow-[var(--shadow-btn-primary)] disabled:opacity-40 ${ring}`}>
          {checkoutLabel}
        </motion.button>
      )}
    </motion.section>
  );
}
