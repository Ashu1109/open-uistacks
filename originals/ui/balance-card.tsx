"use client";

import { useId, useState, useSyncExternalStore, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Eye, EyeOff, TrendingDown, TrendingUp } from "lucide-react";
import { CountUp } from "./chart-utils";

/* Balance card: an account balance in minor units with a period change, an optional sparkline, a hide toggle and an actions slot. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export function currencyDigits(currency: string, locale = "en-US"): number {
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    return 2;
  }
}

/** Minor units (cents) to a localized currency string; `signed` adds an explicit + for gains. */
export function formatMoney(minor: number, currency = "USD", locale = "en-US", signed = false): string {
  const value = minor / 10 ** currencyDigits(currency, locale);
  return new Intl.NumberFormat(locale, { style: "currency", currency, signDisplay: signed ? "exceptZero" : "auto" }).format(value);
}

/** "12.5" to 1250 without float drift; extra decimals are truncated. Null when there are no digits. */
export function parseMinor(text: string, digits = 2): number | null {
  const clean = text.replace(/[^\d.]/g, "");
  if (!/\d/.test(clean)) return null;
  const [whole = "", fraction = ""] = clean.split(".");
  const frac = (fraction + "0".repeat(digits)).slice(0, digits);
  return Number(whole || "0") * 10 ** digits + Number(frac || "0");
}

/** An SVG path through `values` fitted to w by h; flat series draw a centered line. */
export function sparklinePath(values: number[], width: number, height: number, pad = 2): string {
  if (values.length < 2) return "";
  const min = Math.min(...values);
  const span = Math.max(...values) - min;
  const step = (width - pad * 2) / (values.length - 1);
  return values
    .map((v, i) => {
      const y = span === 0 ? height / 2 : pad + (1 - (v - min) / span) * (height - pad * 2);
      return `${i === 0 ? "M" : "L"}${(pad + i * step).toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

export interface BalanceCardProps {
  /** Balance in minor units. */
  balance: number;
  currency?: string;
  locale?: string;
  label?: string;
  /** Change over the period in minor units. */
  change?: number;
  changeLabel?: string;
  /** Recent balance points drawn as a sparkline. */
  history?: number[];
  hidden?: boolean;
  defaultHidden?: boolean;
  onHiddenChange?: (hidden: boolean) => void;
  /** Buttons or links shown under the balance. */
  actions?: ReactNode;
  className?: string;
}

export function BalanceCard({ balance, currency = "USD", locale = "en-US", label = "Available balance", change, changeLabel = "this month", history, hidden, defaultHidden = false, onHiddenChange, actions, className = "" }: BalanceCardProps) {
  const labelId = useId();
  const reduce = useReduce();
  const [inner, setInner] = useState(defaultHidden);
  const isHidden = hidden ?? inner;
  const toggle = () => {
    setInner(!isHidden);
    onHiddenChange?.(!isHidden);
  };
  const up = (change ?? 0) >= 0;
  const path = history ? sparklinePath(history, 120, 40) : "";

  return (
    <section aria-labelledby={labelId} className={`w-full max-w-sm rounded-[20px] bg-surface p-5 shadow-[var(--shadow-card)] ${className}`}>
      <div className="flex items-center justify-between">
        <h3 id={labelId} className="text-[13px] font-medium text-fg-muted">{label}</h3>
        <button type="button" onClick={toggle} aria-pressed={isHidden} aria-label={isHidden ? "Show balance" : "Hide balance"} className={`grid size-8 place-items-center rounded-full text-fg-muted transition-colors hover:bg-subtle ${ring}`}>
          {isHidden ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
        </button>
      </div>
      <div className="mt-2 flex items-end justify-between gap-4">
        <p className="text-[32px] font-semibold leading-none tabular-nums tracking-tight text-fg" aria-live="polite">
          {isHidden ? <span aria-label="Balance hidden">{"•".repeat(6)}</span> : <CountUp text={formatMoney(balance, currency, locale)} />}
        </p>
        {path && !isHidden && (
          <svg width={120} height={40} viewBox="0 0 120 40" aria-hidden className="shrink-0">
            <motion.path d={path} fill="none" stroke={up ? "var(--success)" : "var(--danger)"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ type: "spring", stiffness: 60, damping: 20 }} />
          </svg>
        )}
      </div>
      {change !== undefined && !isHidden && (
        <p className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${up ? "bg-success-soft text-success-text" : "bg-danger-soft text-danger-text"}`}>
          {up ? <TrendingUp size={13} aria-hidden /> : <TrendingDown size={13} aria-hidden />}
          {formatMoney(change, currency, locale, true)} <span className="font-normal opacity-80">{changeLabel}</span>
        </p>
      )}
      {actions && <div className="mt-4 flex gap-2">{actions}</div>}
    </section>
  );
}
