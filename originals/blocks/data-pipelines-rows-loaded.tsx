"use client";

import { useState } from "react";
import { Tabs } from "../../registry/ui/tabs";
import { formatRows } from "./data-pipelines-connector-health";
import { CountUp } from "../ui/chart-utils";

/* Data pipelines rows loaded: a card (1/2 width, or full width) charting rows loaded per day as keyboard-focusable bars, with a 7, 14 or 30 day range, the total, and a readout for the focused day. */

export interface RowsDay {
  /** Display date, e.g. "Nov 4". */
  date: string;
  rows: number;
}

export interface DataPipelinesRowsLoadedProps {
  /** Oldest first. */
  days?: RowsDay[];
  className?: string;
}

const MONTH = ["Oct", "Nov"];
const BASE = [1.1, 1.2, 1.15, 0.9, 0.7, 1.25, 1.3, 1.18, 1.22, 1.1, 0.85, 0.72, 1.28, 1.35, 1.2, 1.24, 1.16, 0.88, 0.74, 1.3, 1.4, 1.26, 1.3, 1.2, 0.9, 0.78, 1.34, 1.42, 1.5, 1.38];

export const DEMO_ROWS_DAYS: RowsDay[] = BASE.map((m, i) => {
  const day = i + 19;
  return { date: day <= 31 ? `${MONTH[0]} ${day}` : `${MONTH[1]} ${day - 31}`, rows: Math.round(m * 4_000_000) };
});

export const lastDays = (days: readonly RowsDay[], n: number): RowsDay[] => days.slice(Math.max(0, days.length - n));

export const totalRows = (days: readonly RowsDay[]) => days.reduce((sum, d) => sum + d.rows, 0);

export function DataPipelinesRowsLoaded({ days = DEMO_ROWS_DAYS, className = "" }: DataPipelinesRowsLoadedProps) {
  const [range, setRange] = useState("14");
  const [focus, setFocus] = useState<number | null>(null);
  const shown = lastDays(days, Number(range));
  const max = Math.max(1, ...shown.map((d) => d.rows));
  const active = focus !== null && focus < shown.length ? shown[focus] : null;
  const half = totalRows(shown.slice(0, Math.floor(shown.length / 2)));
  const recent = totalRows(shown.slice(Math.floor(shown.length / 2)));
  const change = half === 0 ? null : ((recent - half) / half) * 100;
  return (
    <section aria-label="Rows loaded" className={`@container grid content-start gap-4 rounded-[20px] bg-surface p-5 shadow-[var(--shadow-card)] ${className}`}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-fg">Rows loaded</h2>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-fg"><CountUp text={formatRows(totalRows(shown))} /></p>
          {change !== null && (
            <p className={`text-[13px] ${change >= 0 ? "text-success-text" : "text-danger-text"}`}>
              {change >= 0 ? "Up" : "Down"} {Math.abs(change).toFixed(1)}% in the second half
            </p>
          )}
        </div>
        <Tabs
          items={[{ value: "7", label: "7d" }, { value: "14", label: "14d" }, { value: "30", label: "30d" }]}
          value={range}
          onValueChange={(v) => {
            setRange(v);
            setFocus(null);
          }}
          variant="pill"
          size="sm"
          label="Date range"
        />
      </header>
      <p className="h-5 text-[13px] text-fg-muted" aria-live="polite">
        {active ? (
          <>
            <span className="font-medium text-fg">{active.date}</span> · {active.rows.toLocaleString("en-US")} rows
          </>
        ) : (
          "Focus a bar to see its day."
        )}
      </p>
      <div className="flex h-36 items-end gap-[3px] @[560px]:h-44" onMouseLeave={() => setFocus(null)}>
        {shown.map((d, i) => (
          <button
            key={d.date}
            type="button"
            aria-label={`${d.date}: ${d.rows.toLocaleString("en-US")} rows`}
            onMouseEnter={() => setFocus(i)}
            onFocus={() => setFocus(i)}
            onBlur={() => setFocus(null)}
            className="group flex h-full min-w-0 flex-1 items-end rounded-[4px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)]"
          >
            <span
              className="w-full rounded-t-[4px] transition-opacity"
              style={{ height: `${(d.rows / max) * 100}%`, background: "var(--series-1)", opacity: focus === null || focus === i ? 1 : 0.45 }}
            />
          </button>
        ))}
      </div>
      <div className="flex justify-between text-[12px] text-fg-subtle" aria-hidden>
        <span>{shown[0]?.date}</span>
        <span>{shown[shown.length - 1]?.date}</span>
      </div>
    </section>
  );
}
