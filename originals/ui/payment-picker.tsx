"use client";

import { useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CreditCard, Plus } from "lucide-react";

/* Payment picker: a radio group over saved payment methods passed in as props, shown masked ("•••• 4242"); it never collects card numbers, adding a method is delegated to onAddNew. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const spring = { type: "spring", stiffness: 480, damping: 34 } as const;

const ring = "outline-none focus-within:ring-2 focus-within:ring-[var(--select)] focus-within:ring-offset-2 focus-within:ring-offset-[var(--bg)]";

export interface SavedPaymentMethod {
  id: string;
  brand: string;
  /** Last four digits only. */
  last4: string;
  /** MM/YY. */
  expiry?: string;
}

export interface PaymentPickerProps {
  methods: SavedPaymentMethod[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (id: string) => void;
  onAddNew?: () => void;
  className?: string;
}

export function maskCard(last4: string): string {
  return `•••• ${last4.replace(/\D/g, "").slice(-4)}`;
}

/** True when an MM/YY expiry is before the given month. */
export function isExpired(expiry: string, now: Date = new Date()): boolean {
  const [mm, yy] = expiry.split("/").map(Number);
  if (!mm || Number.isNaN(yy)) return false;
  return 2000 + yy < now.getFullYear() || (2000 + yy === now.getFullYear() && mm < now.getMonth() + 1);
}

export function PaymentPicker({ methods, value, defaultValue, onValueChange, onAddNew, className = "" }: PaymentPickerProps) {
  const reduce = useReduce();
  const [inner, setInner] = useState(defaultValue ?? methods[0]?.id);
  const selected = value ?? inner;
  const name = `payment-${methods.map((m) => m.id).join("-")}`;
  return (
    <div className={`grid gap-2 ${className}`}>
      <div role="radiogroup" aria-label="Payment method" className="grid gap-2">
        {methods.map((m, i) => {
          const expired = m.expiry ? isExpired(m.expiry) : false;
          const checked = m.id === selected;
          return (
            <motion.label key={m.id} initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: i * 0.04 }} whileTap={reduce || expired ? undefined : { scale: 0.99 }} className={`relative flex cursor-pointer items-center gap-3 rounded-[14px] p-3.5 transition-colors ${checked ? "bg-select-soft" : "bg-surface shadow-[var(--shadow-card)] hover:bg-subtle dark:bg-raised"} ${expired ? "opacity-60" : ""} ${ring}`}>
              {checked && <motion.span layoutId={`${name}-ring`} aria-hidden transition={reduce ? { duration: 0 } : spring} className="pointer-events-none absolute inset-0 rounded-[14px] shadow-[0_0_0_1.5px_var(--select)]" />}
              <input
                type="radio"
                name={name}
                value={m.id}
                checked={checked}
                disabled={expired}
                onChange={() => { setInner(m.id); onValueChange?.(m.id); }}
                className="sr-only"
              />
              <span aria-hidden className={`grid size-4 shrink-0 place-items-center rounded-full border ${checked ? "border-select bg-select" : "border-track-strong"}`}>
                <AnimatePresence initial={false}>{checked && <motion.span initial={reduce ? false : { scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={spring} className="size-1.5 rounded-full bg-white" />}</AnimatePresence>
              </span>
              <CreditCard size={18} className="text-fg-muted" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-fg">{m.brand} <span className="tabular-nums text-fg-muted">{maskCard(m.last4)}</span></span>
                {m.expiry && <span className={`block text-xs ${expired ? "text-danger-text" : "text-fg-muted"}`}>{expired ? "Expired" : "Expires"} {m.expiry}</span>}
              </span>
            </motion.label>
          );
        })}
      </div>
      {onAddNew && (
        <motion.button type="button" onClick={onAddNew} whileTap={reduce ? undefined : { scale: 0.97 }} className="group flex h-10 items-center justify-center gap-2 rounded-[12px] text-sm font-medium text-fg-muted outline-none hover:text-fg focus-visible:ring-2 focus-visible:ring-[var(--select)]">
          <Plus size={15} className="transition-transform duration-200 group-hover:rotate-90" aria-hidden /> Add payment method
        </motion.button>
      )}
    </div>
  );
}
