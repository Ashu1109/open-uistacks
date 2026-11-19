"use client";

import { Flame } from "lucide-react";

/* Devops error budget: per-SLO error budget consumed over its window with burn rate and minutes left. A card, 1/3 or 1/2 width. */

export interface Slo {
  id: string;
  name: string;
  /** Target availability as a percentage, e.g. 99.9. */
  target: number;
  windowDays: number;
  /** Fraction of the error budget used so far, 0 to 1 (can exceed 1). */
  consumed: number;
  /** Budget burn rate: 1 spends exactly the whole budget over the window. */
  burnRate: number;
}

export interface DevopsErrorBudgetProps {
  slos?: Slo[];
  className?: string;
}

export type BudgetState = "healthy" | "at-risk" | "exhausted";

/** Total allowed downtime in minutes for a target over a window. */
export const budgetMinutes = (target: number, windowDays: number) => Math.round(windowDays * 24 * 60 * (1 - target / 100));

export function budgetState(slo: Pick<Slo, "consumed" | "burnRate">): BudgetState {
  if (slo.consumed >= 1) return "exhausted";
  return slo.consumed >= 0.75 || slo.burnRate >= 2 ? "at-risk" : "healthy";
}

const COLOR: Record<BudgetState, string> = { healthy: "var(--success)", "at-risk": "var(--warning)", exhausted: "var(--danger)" };
const TEXT: Record<BudgetState, string> = { healthy: "Healthy", "at-risk": "At risk", exhausted: "Exhausted" };

const DEMO: Slo[] = [
  { id: "api", name: "API availability", target: 99.9, windowDays: 30, consumed: 0.42, burnRate: 0.8 },
  { id: "checkout", name: "Checkout success", target: 99.95, windowDays: 30, consumed: 0.81, burnRate: 3.1 },
  { id: "ingest", name: "Ingest freshness", target: 99.5, windowDays: 28, consumed: 1.12, burnRate: 1.4 },
  { id: "search", name: "Search latency", target: 99, windowDays: 30, consumed: 0.18, burnRate: 0.4 },
];

export function DevopsErrorBudget({ slos = DEMO, className = "" }: DevopsErrorBudgetProps) {
  return (
    <section aria-labelledby="devops-budget-title" className={`@container rounded-[20px] bg-surface p-5 shadow-[var(--shadow-card)] ${className}`}>
      <h3 id="devops-budget-title" className="mb-4 flex items-center gap-2 text-[15px] font-semibold text-fg"><Flame className="size-4 text-warning-text" aria-hidden /> Error budget</h3>
      <ul className="m-0 grid list-none gap-4 p-0">
        {slos.map((s) => {
          const state = budgetState(s);
          const total = budgetMinutes(s.target, s.windowDays);
          const left = Math.max(0, Math.round(total * (1 - s.consumed)));
          const pct = Math.round(s.consumed * 100);
          return (
            <li key={s.id}>
              <div className="mb-1.5 flex items-baseline justify-between gap-2 text-[13px]">
                <span className="font-medium text-fg">{s.name}</span>
                <span className="tabular-nums text-fg-muted">{s.target}% / {s.windowDays}d</span>
              </div>
              <div role="progressbar" aria-label={`${s.name} error budget used`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(pct, 100)} aria-valuetext={`${pct}% used, ${TEXT[state]}`} className="h-2 overflow-hidden rounded-full bg-track">
                <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${Math.min(pct, 100)}%`, background: COLOR[state] }} />
              </div>
              <div className="mt-1.5 flex flex-wrap justify-between gap-x-3 text-xs text-fg-muted">
                <span className="tabular-nums">{pct}% used · {left} of {total} min left</span>
                <span className="tabular-nums" style={{ color: state === "healthy" ? undefined : COLOR[state] }}>{s.burnRate.toFixed(1)}x burn · {TEXT[state]}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
