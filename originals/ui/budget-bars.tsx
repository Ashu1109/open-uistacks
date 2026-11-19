"use client";

import { useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "motion/react";
import { formatMoney } from "./balance-card";

/* Budget bars: one meter per spending category showing spent against its limit, amber near the limit and red once over it. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

export const NEAR_LIMIT = 0.85;

export type BudgetLevel = "ok" | "near" | "over";

export function budgetLevel(spent: number, limit: number): BudgetLevel {
  if (limit <= 0) return spent > 0 ? "over" : "ok";
  if (spent > limit) return "over";
  return spent / limit >= NEAR_LIMIT ? "near" : "ok";
}

export function budgetRatio(spent: number, limit: number): number {
  return limit > 0 ? Math.min(Math.max(spent / limit, 0), 1) : spent > 0 ? 1 : 0;
}

const COLOR: Record<BudgetLevel, string> = { ok: "var(--select)", near: "var(--warning)", over: "var(--danger)" };

export interface BudgetItem {
  id: string;
  label: string;
  /** Minor units. */
  spent: number;
  limit: number;
}

export interface BudgetBarsProps {
  items: BudgetItem[];
  currency?: string;
  locale?: string;
  className?: string;
}

export function BudgetBars({ items, currency = "USD", locale = "en-US", className = "" }: BudgetBarsProps) {
  const reduce = useReduce();
  return (
    <ul className={`grid w-full max-w-md gap-4 rounded-[20px] bg-surface p-5 shadow-[var(--shadow-card)] ${className}`}>
      {items.map((item) => {
        const level = budgetLevel(item.spent, item.limit);
        const pct = Math.round(budgetRatio(item.spent, item.limit) * 100);
        const remaining = item.limit - item.spent;
        return (
          <li key={item.id}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium text-fg">{item.label}</span>
              <span className="tabular-nums text-fg-muted">
                {formatMoney(item.spent, currency, locale)} <span className="text-fg-subtle">of {formatMoney(item.limit, currency, locale)}</span>
              </span>
            </div>
            <div role="meter" aria-label={`${item.label} budget`} aria-valuemin={0} aria-valuemax={item.limit} aria-valuenow={Math.min(item.spent, item.limit)} aria-valuetext={`${formatMoney(item.spent, currency, locale)} of ${formatMoney(item.limit, currency, locale)}`} className="mt-2 h-2 overflow-hidden rounded-full bg-track">
              <motion.div className="h-full rounded-full" style={{ background: COLOR[level] }} initial={reduce ? false : { width: 0 }} animate={{ width: `${pct}%` }} transition={{ type: "spring", stiffness: 140, damping: 24 }} />
            </div>
            <p className={`mt-1 text-xs tabular-nums ${level === "over" ? "text-danger-text" : level === "near" ? "text-warning-text" : "text-fg-subtle"}`}>
              {remaining >= 0 ? `${formatMoney(remaining, currency, locale)} left` : `${formatMoney(-remaining, currency, locale)} over`}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
