"use client";

import { useId, useState } from "react";
import { budgetLevel, budgetRatio } from "./budget-bars";
import { formatMoney } from "./balance-card";

/* Spend limit: a slider for a card's spending cap in minor units with a daily, weekly or monthly period and a bar of what is already spent. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export type LimitPeriod = "daily" | "weekly" | "monthly";
const PERIODS: LimitPeriod[] = ["daily", "weekly", "monthly"];

/** Snaps to `step` and keeps the result inside [min, max]. */
export function snapLimit(value: number, min: number, max: number, step: number): number {
  const snapped = Math.round(value / step) * step;
  return Math.min(Math.max(snapped, min), max);
}

export interface SpendLimitProps {
  /** Limit in minor units. */
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  period?: LimitPeriod;
  defaultPeriod?: LimitPeriod;
  onPeriodChange?: (period: LimitPeriod) => void;
  min?: number;
  max?: number;
  /** Slider step in minor units. */
  step?: number;
  /** Amount already spent in the period, minor units. */
  spent?: number;
  currency?: string;
  locale?: string;
  className?: string;
}

export function SpendLimit({ value, defaultValue = 50_000, onValueChange, period, defaultPeriod = "monthly", onPeriodChange, min = 0, max = 200_000, step = 1000, spent, currency = "USD", locale = "en-US", className = "" }: SpendLimitProps) {
  const uid = useId();
  const [innerValue, setInnerValue] = useState(defaultValue);
  const [innerPeriod, setInnerPeriod] = useState(defaultPeriod);
  const limit = snapLimit(value ?? innerValue, min, max, step);
  const activePeriod = period ?? innerPeriod;
  const money = (n: number) => formatMoney(n, currency, locale);
  const level = spent === undefined ? "ok" : budgetLevel(spent, limit);

  return (
    <div className={`w-full max-w-sm rounded-[20px] bg-surface p-5 shadow-[var(--shadow-card)] ${className}`}>
      <div className="flex items-baseline justify-between">
        <label htmlFor={`${uid}-range`} className="text-[13px] font-medium text-fg-muted">Spending limit</label>
        <output htmlFor={`${uid}-range`} className="text-2xl font-semibold tabular-nums text-fg">{money(limit)}</output>
      </div>
      <fieldset className="mt-3 flex rounded-full bg-subtle p-0.5">
        <legend className="sr-only">Limit period</legend>
        {PERIODS.map((p) => (
          <label key={p} className={`flex-1 cursor-pointer rounded-full py-1 text-center text-xs capitalize transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--select)] ${activePeriod === p ? "bg-surface text-fg shadow-[var(--shadow-hairline)]" : "text-fg-muted"}`}>
            <input type="radio" name={`${uid}-period`} value={p} checked={activePeriod === p} className="sr-only" onChange={() => { setInnerPeriod(p); onPeriodChange?.(p); }} />
            {p}
          </label>
        ))}
      </fieldset>
      <input
        id={`${uid}-range`}
        type="range"
        min={min}
        max={max}
        step={step}
        value={limit}
        aria-valuetext={`${money(limit)} ${activePeriod}`}
        onChange={(e) => {
          const next = snapLimit(Number(e.target.value), min, max, step);
          setInnerValue(next);
          onValueChange?.(next);
        }}
        className={`mt-4 w-full accent-[var(--select)] ${ring}`}
      />
      <div className="flex justify-between text-xs tabular-nums text-fg-subtle"><span>{money(min)}</span><span>{money(max)}</span></div>
      {spent !== undefined && (
        <div className="mt-4">
          <div className="h-1.5 overflow-hidden rounded-full bg-track">
            <div className="h-full rounded-full transition-[width]" style={{ width: `${budgetRatio(spent, limit) * 100}%`, background: level === "over" ? "var(--danger)" : level === "near" ? "var(--warning)" : "var(--select)" }} />
          </div>
          <p className={`mt-1.5 text-xs tabular-nums ${level === "over" ? "text-danger-text" : "text-fg-muted"}`} aria-live="polite">
            {money(spent)} spent {activePeriod === "daily" ? "today" : activePeriod === "weekly" ? "this week" : "this month"}{level === "over" ? ", over your limit" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
