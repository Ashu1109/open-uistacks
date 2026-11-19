"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import { CountUp } from "../ui/chart-utils";

/* Dev tools DORA: the four DORA metrics (deploy frequency, lead time, change failure rate, time to restore) with a performance level, a change versus the previous period and a trend line. A full-width section (12 columns); tiles flow 1, 2 or 4 across by container width. */

export type DoraLevel = "elite" | "high" | "medium" | "low";

export interface DoraMetric {
  id: string;
  label: string;
  value: string;
  level: DoraLevel;
  /** Percent change versus the previous period. */
  change: number;
  /** Whether a falling number is the good direction (lead time, failure rate, restore time). */
  lowerIsBetter: boolean;
  trend: number[];
}

export interface DevToolsDoraProps {
  metrics?: DoraMetric[];
  periodLabel?: string;
  className?: string;
}

export const DEMO_DORA: DoraMetric[] = [
  { id: "freq", label: "Deploy frequency", value: "6.4 / day", level: "elite", change: 12, lowerIsBetter: false, trend: [4.1, 4.8, 5.2, 4.9, 5.6, 6.0, 6.4] },
  { id: "lead", label: "Lead time for changes", value: "3.1 h", level: "high", change: -18, lowerIsBetter: true, trend: [5.2, 4.9, 4.4, 4.0, 3.8, 3.4, 3.1] },
  { id: "cfr", label: "Change failure rate", value: "9.2%", level: "medium", change: 6, lowerIsBetter: true, trend: [7.1, 7.6, 8.0, 7.4, 8.4, 8.9, 9.2] },
  { id: "mttr", label: "Time to restore", value: "42 min", level: "high", change: -9, lowerIsBetter: true, trend: [61, 58, 55, 57, 50, 46, 42] },
];

export function isImprovement(change: number, lowerIsBetter: boolean): boolean {
  return lowerIsBetter ? change < 0 : change > 0;
}

export function sparkPath(values: number[], w: number, h: number): string {
  if (values.length < 2) return "";
  const min = Math.min(...values);
  const span = Math.max(...values) - min || 1;
  return values.map((v, i) => `${i ? "L" : "M"}${((i / (values.length - 1)) * w).toFixed(1)} ${(h - 2 - ((v - min) / span) * (h - 4)).toFixed(1)}`).join(" ");
}

const LEVEL_STYLE: Record<DoraLevel, string> = {
  elite: "bg-success-soft text-success-text",
  high: "bg-select-soft text-select-text",
  medium: "bg-warning-soft text-warning-text",
  low: "bg-danger-soft text-danger-text",
};

export function DevToolsDora({ metrics = DEMO_DORA, periodLabel = "Last 7 weeks", className = "" }: DevToolsDoraProps) {
  return (
    <section aria-label="DORA metrics" className={`@container rounded-[20px] bg-surface p-4 shadow-[var(--shadow-card)] @[480px]:p-5 ${className}`}>
      <header className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="text-[15px] font-semibold text-fg">DORA metrics</h2>
        <span className="text-[12px] text-fg-muted">{periodLabel}</span>
      </header>
      <ul className="grid gap-3 @[560px]:grid-cols-2 @[1000px]:grid-cols-4">
        {metrics.map((m) => {
          const good = isImprovement(m.change, m.lowerIsBetter);
          const Arrow = m.change < 0 ? TrendingDown : TrendingUp;
          return (
            <li key={m.id} className="rounded-[16px] bg-subtle/60 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] text-fg-muted">{m.label}</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${LEVEL_STYLE[m.level]}`}>{m.level}</span>
              </div>
              <p className="mt-1.5 text-[24px] font-semibold leading-8 tabular-nums text-fg"><CountUp text={String(m.value)} /></p>
              <div className="mt-1 flex items-end justify-between gap-2">
                <span className={`inline-flex items-center gap-1 text-[12px] font-medium ${good ? "text-success-text" : "text-danger-text"}`}>
                  <Arrow size={13} aria-hidden />
                  <span>{Math.abs(m.change)}%</span>
                  <span className="sr-only">{good ? "improvement" : "regression"} versus previous period</span>
                </span>
                <svg width="88" height="28" viewBox="0 0 88 28" aria-hidden fill="none">
                  <path d={sparkPath(m.trend, 88, 28)} stroke={good ? "var(--success)" : "var(--danger)"} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
