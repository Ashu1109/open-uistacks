"use client";

import { ForecastChart } from "../ui/forecast-chart";

/* LLM ops model spend: a full-width or 2/3-width (8 of 12 columns) card charting cumulative daily spend with a forecast to month end, summarised against the monthly budget. */

export interface ModelSpendProps {
  /** Cumulative spend in USD, one value per elapsed day. */
  actual?: number[];
  /** Projected cumulative spend for the remaining days. */
  forecast?: number[];
  budgetUsd?: number;
  className?: string;
}

const DEMO_ACTUAL = Array.from({ length: 18 }, (_, i) => Math.round(((i + 1) * 640 + Math.sin(i) * 120) * 1));
const DEMO_FORECAST = Array.from({ length: 12 }, (_, i) => Math.round(DEMO_ACTUAL[17] + (i + 1) * 690));

export interface BudgetStatus {
  projected: number;
  usedRatio: number;
  state: "on-track" | "at-risk" | "over";
}

export function budgetStatus(actual: number[], forecast: number[], budgetUsd: number): BudgetStatus {
  const spent = actual[actual.length - 1] ?? 0;
  const projected = forecast[forecast.length - 1] ?? spent;
  const state = projected > budgetUsd ? "over" : projected > budgetUsd * 0.9 ? "at-risk" : "on-track";
  return { projected, usedRatio: budgetUsd > 0 ? spent / budgetUsd : 0, state };
}

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const STATE = {
  "on-track": { text: "On track", tone: "text-success-text" },
  "at-risk": { text: "Near budget", tone: "text-warning-text" },
  over: { text: "Projected over budget", tone: "text-danger-text" },
} as const;

export function LlmOpsModelSpend({ actual = DEMO_ACTUAL, forecast = DEMO_FORECAST, budgetUsd = 20_000, className = "" }: ModelSpendProps) {
  const status = budgetStatus(actual, forecast, budgetUsd);
  const spent = actual[actual.length - 1] ?? 0;
  const labels = Array.from({ length: actual.length + forecast.length }, (_, i) => `Nov ${i + 1}`);
  const s = STATE[status.state];
  return (
    <section aria-label="Model spend against budget" className={`@container rounded-[20px] bg-surface p-5 shadow-[var(--shadow-card)] dark:bg-raised ${className}`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold text-fg">Model spend</h3>
          <p className="text-[13px] text-fg-muted">
            <span className="tabular-nums text-fg">{usd(spent)}</span> of {usd(budgetUsd)} budget ({Math.round(status.usedRatio * 100)}%)
          </p>
        </div>
        <p className={`text-[13px] font-medium ${s.tone}`} role="status">
          {s.text} · <span className="tabular-nums">{usd(status.projected)}</span> projected
        </p>
      </div>
      <ForecastChart className="mt-3" actual={actual} forecast={forecast} labels={labels} format={usd} label="Cumulative model spend with month-end forecast" />
    </section>
  );
}
