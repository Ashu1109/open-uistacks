"use client";

import { useId, useState, useSyncExternalStore } from "react";
import { animate, motion, useReducedMotion } from "motion/react";

/* Amount input: a currency field that accepts only digits and one decimal separator while typing, shows a grouped, locale-formatted value on blur, and offers optional preset chips. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const spring = { type: "spring", stiffness: 480, damping: 34 } as const;

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

/** Pulls a number out of what was typed ("1,234.5" or "$12"); null when there is nothing numeric. */
export function parseAmount(text: string, decimals = 2): number | null {
  const cleaned = text.replace(/[^\d.]/g, "");
  const [whole, ...rest] = cleaned.split(".");
  const joined = rest.length ? `${whole || "0"}.${rest.join("").slice(0, decimals)}` : whole;
  if (joined === "" || joined === ".") return null;
  const n = Number(joined);
  return Number.isFinite(n) ? n : null;
}

/** Keeps only digits and a single "." with at most `decimals` places. */
export function sanitizeAmount(text: string, decimals = 2): string {
  const cleaned = text.replace(/[^\d.]/g, "");
  const [whole, ...rest] = cleaned.split(".");
  if (rest.length === 0) return whole;
  return `${whole}.${rest.join("").slice(0, decimals)}`;
}

export function formatAmount(value: number, locale = "en-US", decimals = 2): string {
  return new Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
}

export function currencySymbol(currency: string, locale = "en-US"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency, currencyDisplay: "narrowSymbol" }).formatToParts(0).find((p) => p.type === "currency")?.value ?? currency;
}

export interface AmountInputProps {
  value?: number | null;
  defaultValue?: number | null;
  onValueChange?: (value: number | null) => void;
  currency?: string;
  locale?: string;
  decimals?: number;
  max?: number;
  label?: string;
  /** Quick amounts shown as chips under the field. */
  presets?: number[];
  className?: string;
}

export function AmountInput({ value: controlled, defaultValue = null, onValueChange, currency = "USD", locale = "en-US", decimals = 2, max, label = "Amount", presets, className = "" }: AmountInputProps) {
  const id = useId();
  const reduce = useReduce();
  const [inner, setInner] = useState<number | null>(defaultValue);
  const value = controlled !== undefined ? controlled : inner;
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? (value === null ? "" : formatAmount(value, locale, decimals));

  const commit = (n: number | null) => {
    const clamped = n !== null && max !== undefined ? Math.min(n, max) : n;
    setInner(clamped);
    onValueChange?.(clamped);
    return clamped;
  };

  const pick = (p: number) => {
    const from = value ?? 0;
    const to = commit(p) ?? p;
    if (reduce || from === to) return setDraft(null);
    animate(from, to, { duration: 0.3, ease: "easeOut", onUpdate: (v) => setDraft(formatAmount(v, locale, decimals)), onComplete: () => setDraft(null) });
  };

  return (
    <div className={`w-64 ${className}`}>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-fg-muted">{label}</label>
      <div className={`flex h-12 items-center gap-2 rounded-[14px] bg-surface px-3 shadow-[var(--shadow-card)] transition-shadow duration-150 focus-within:ring-2 focus-within:ring-[var(--select)]`}>
        <span aria-hidden className="text-lg text-fg-muted">{currencySymbol(currency, locale)}</span>
        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          placeholder={formatAmount(0, locale, decimals)}
          value={shown}
          onFocus={() => setDraft(value === null ? "" : String(value))}
          onChange={(e) => {
            const text = sanitizeAmount(e.target.value, decimals);
            setDraft(text);
            commit(parseAmount(text, decimals));
          }}
          onBlur={() => setDraft(null)}
          className="min-w-0 flex-1 bg-transparent text-xl font-medium tabular-nums text-fg outline-none placeholder:text-fg-subtle"
        />
        <span className="text-xs text-fg-subtle">{currency}</span>
      </div>
      {presets && presets.length > 0 && (
        <div role="group" aria-label="Quick amounts" className="mt-2 flex flex-wrap gap-1.5">
          {presets.map((p, i) => (
            <motion.button key={p} type="button" initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: i * 0.04 }} whileTap={reduce ? undefined : { scale: 0.94 }} onClick={() => pick(p)} className={`h-7 rounded-full px-3 text-xs tabular-nums transition-colors duration-150 hover:bg-track ${value === p ? "bg-[var(--select)] text-white" : "bg-subtle text-fg-muted"} ${ring}`}>
              {currencySymbol(currency, locale)}{formatAmount(p, locale, Number.isInteger(p) ? 0 : decimals)}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
