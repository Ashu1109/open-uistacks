"use client";

import { TrendingUp } from "lucide-react";
import { CountUp } from "../ui/chart-utils";

/* Data pipelines warehouse spend: a card (1/3 or 1/2 width) showing compute credits used this billing period against a budget, the month-end projection, and a per-warehouse breakdown. */

export interface WarehouseUsage {
  id: string;
  name: string;
  credits: number;
}

export interface DataPipelinesWarehouseSpendProps {
  warehouses?: WarehouseUsage[];
  /** Credits allowed for the period. */
  budget?: number;
  /** Days elapsed in the period, and its length. */
  day?: number;
  daysInPeriod?: number;
  /** Dollars per credit. */
  creditPrice?: number;
  className?: string;
}

export const DEMO_WAREHOUSES: WarehouseUsage[] = [
  { id: "w1", name: "TRANSFORM_WH", credits: 412 },
  { id: "w2", name: "LOAD_WH", credits: 236 },
  { id: "w3", name: "BI_WH", credits: 188 },
  { id: "w4", name: "ADHOC_WH", credits: 64 },
];

export function projectCredits(used: number, day: number, daysInPeriod: number): number {
  return day <= 0 ? 0 : (used / day) * daysInPeriod;
}

export const formatDollars = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function DataPipelinesWarehouseSpend({ warehouses = DEMO_WAREHOUSES, budget = 1600, day = 17, daysInPeriod = 30, creditPrice = 3, className = "" }: DataPipelinesWarehouseSpendProps) {
  const used = warehouses.reduce((s, w) => s + w.credits, 0);
  const projected = projectCredits(used, day, daysInPeriod);
  const over = projected > budget;
  const usedPct = Math.min((used / (budget || 1)) * 100, 100);
  const projectedPct = Math.min((projected / (budget || 1)) * 100, 100);
  const top = Math.max(1, ...warehouses.map((w) => w.credits));
  return (
    <section aria-label="Warehouse spend" className={`@container grid content-start gap-4 rounded-[20px] bg-surface p-5 shadow-[var(--shadow-card)] ${className}`}>
      <header>
        <h2 className="text-[15px] font-semibold text-fg">Warehouse spend</h2>
        <p className="mt-1 text-2xl font-semibold tabular-nums text-fg">
          <CountUp text={used.toLocaleString("en-US")} /> <span className="text-sm font-normal text-fg-muted">of {budget.toLocaleString("en-US")} credits</span>
        </p>
        <p className="text-[13px] text-fg-muted">
          {formatDollars(used * creditPrice)} so far · day {day} of {daysInPeriod}
        </p>
      </header>
      <div
        role="progressbar"
        aria-label="Credits used against budget"
        aria-valuemin={0}
        aria-valuemax={budget}
        aria-valuenow={Math.min(used, budget)}
        className="relative h-2.5 rounded-full bg-track"
      >
        <span className="absolute inset-y-0 left-0 rounded-full opacity-40" style={{ width: `${projectedPct}%`, background: over ? "var(--danger)" : "var(--select)" }} />
        <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${usedPct}%`, background: over ? "var(--danger)" : "var(--select)" }} />
      </div>
      <p className={`flex items-center gap-2 rounded-[12px] px-3 py-2 text-[13px] ${over ? "bg-danger-soft text-danger-text" : "bg-subtle text-fg-muted"}`}>
        <TrendingUp size={15} aria-hidden />
        <span>
          On pace for {Math.round(projected).toLocaleString("en-US")} credits ({formatDollars(projected * creditPrice)}){over ? `, ${Math.round(projected - budget)} over budget` : ", within budget"}.
        </span>
      </p>
      <ul className="grid gap-2.5">
        {warehouses.map((w) => (
          <li key={w.id} className="grid gap-1">
            <div className="flex justify-between text-[13px]">
              <span className="font-mono text-fg">{w.name}</span>
              <span className="tabular-nums text-fg-muted">{w.credits} cr</span>
            </div>
            <div className="h-1.5 rounded-full bg-track" aria-hidden>
              <div className="h-full rounded-full" style={{ width: `${(w.credits / top) * 100}%`, background: "var(--series-3)" }} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
