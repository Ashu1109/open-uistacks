"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { animate, motion, useReducedMotion } from "motion/react";
import { CountUp } from "./chart-utils";

/* Spend breakdown: a stacked bar and legend of what a run or period cost by category, measured against an optional budget that turns amber near the limit and red over it. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}
const spring = { type: "spring", stiffness: 480, damping: 36 } as const;

/** Tweens to a new value on change; the first render shows the value as is. */
function useTween(value: number, reduce: boolean): number {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    if (from.current === value) return;
    if (reduce) { from.current = value; setShown(value); return; }
    const controls = animate(from.current, value, { duration: 0.5, ease: "easeOut", onUpdate: (v) => { from.current = v; setShown(v); } });
    return () => controls.stop();
  }, [value, reduce]);
  return shown;
}

export interface SpendItem {
  label: string;
  usd: number;
}

export function formatUsd(usd: number): string {
  return `$${usd.toFixed(2)}`;
}

export function totalSpend(items: SpendItem[]): number {
  return items.reduce((sum, i) => sum + Math.max(0, i.usd), 0);
}

/** Percent of the bar each item fills; the bar spans the larger of total and budget. */
export function spendShares(items: SpendItem[], budget?: number): number[] {
  const span = Math.max(totalSpend(items), budget ?? 0);
  return items.map((i) => (span > 0 ? (Math.max(0, i.usd) / span) * 100 : 0));
}

const COLORS = ["var(--series-1)", "var(--series-3)", "var(--success)", "var(--warning)", "color-mix(in srgb, var(--series-1) 45%, var(--surface))"];

export interface SpendBreakdownProps {
  items: SpendItem[];
  budget?: number;
  title?: string;
  className?: string;
}

export function SpendBreakdown({ items, budget, title = "Spend", className = "" }: SpendBreakdownProps) {
  const total = totalSpend(items);
  const shares = spendShares(items, budget);
  const ratio = budget ? total / budget : 0;
  const reduce = useReduce();
  const shownTotal = useTween(total, reduce);
  const tone = ratio > 1 ? "text-danger-text" : ratio >= 0.8 ? "text-warning-text" : "text-fg-muted";
  return (
    <section aria-label={title} className={`rounded-[16px] bg-surface p-4 shadow-[var(--shadow-card)] dark:bg-raised ${className}`}>
      <div className="flex items-end justify-between">
        <div>
          <h4 className="text-xs text-fg-subtle">{title}</h4>
          <p className="text-2xl font-semibold tabular-nums text-fg"><CountUp text={formatUsd(shownTotal)} /></p>
        </div>
        {budget !== undefined && (
          <p className={`text-xs tabular-nums ${tone}`}>
            {ratio > 1 ? `${formatUsd(shownTotal - budget)} over` : `${formatUsd(budget - shownTotal)} left`} of {formatUsd(budget)}
          </p>
        )}
      </div>
      <div role="img" aria-label={items.map((i) => `${i.label} ${formatUsd(i.usd)}`).join(", ")} className="mt-3 flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-track">
        {items.map((i, k) => <motion.span key={i.label} className="h-full" initial={reduce ? false : { width: 0 }} animate={{ width: `${shares[k]}%` }} transition={{ ...spring, stiffness: 180, damping: 28, delay: k * 0.08 }} style={{ background: COLORS[k % COLORS.length] }} />)}
      </div>
      <ul className="mt-3 space-y-1.5">
        {items.map((i, k) => (
          <motion.li key={i.label} initial={reduce ? false : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.15 + k * 0.05 }} className="flex items-center gap-2 text-[13px]">
            <span aria-hidden className="size-2 rounded-full" style={{ background: COLORS[k % COLORS.length] }} />
            <span className="flex-1 text-fg-muted">{i.label}</span>
            <span className="tabular-nums text-fg">{formatUsd(i.usd)}</span>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
