"use client";

import { useState } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { SegmentedControl } from "../ui/segmented-control";
import { formatMoney } from "../ui/cart-summary";
import { CountUp, useChartWidth } from "../ui/chart-utils";

/* Revenue overview: a full-width section with revenue, orders, average order value and conversion for the chosen window, each compared with the window before it, above a daily revenue bar chart. */

export interface DayStat {
  label: string;
  /** Minor units. */
  revenue: number;
  orders: number;
  visits: number;
}

export interface RevenueOverviewProps {
  /** Oldest first. Windows are taken from the end; the window before it is the comparison. */
  days?: DayStat[];
  currency?: string;
  defaultRange?: 7 | 14;
  className?: string;
}

export interface Summary {
  revenue: number;
  orders: number;
  aov: number;
  /** Orders per visit, 0 to 1. */
  conversion: number;
}

export function summarize(days: DayStat[]): Summary {
  const revenue = days.reduce((s, d) => s + d.revenue, 0);
  const orders = days.reduce((s, d) => s + d.orders, 0);
  const visits = days.reduce((s, d) => s + d.visits, 0);
  return { revenue, orders, aov: orders ? Math.round(revenue / orders) : 0, conversion: visits ? orders / visits : 0 };
}

/** Percent change from previous to current; null when there is nothing to compare against. */
export function percentChange(current: number, previous: number): number | null {
  return previous > 0 ? ((current - previous) / previous) * 100 : null;
}

export function windows(days: DayStat[], range: number): { current: DayStat[]; previous: DayStat[] } {
  return { current: days.slice(-range), previous: days.slice(-range * 2, -range) };
}

export const DEMO_DAYS: DayStat[] = Array.from({ length: 28 }, (_, i) => {
  const wave = Math.sin(i / 2.3) * 0.18 + (i % 7 >= 5 ? 0.22 : 0) + i * 0.012;
  const orders = Math.round(34 * (1 + wave));
  return { label: i < 11 ? `Oct ${i + 21}` : `Nov ${i - 10}`, orders, revenue: orders * (5600 + (i % 5) * 180), visits: Math.round(orders * (31 - (i % 4))) };
});

function Kpi({ label, value, change }: { label: string; value: string; change: number | null }) {
  const up = (change ?? 0) >= 0;
  return (
    <div className="grid gap-1 rounded-[16px] bg-subtle/60 p-3">
      <p className="text-xs text-fg-muted">{label}</p>
      <p className="text-xl font-semibold tabular-nums text-fg"><CountUp text={String(value)} /></p>
      {change === null ? (
        <p className="text-xs text-fg-subtle">No prior data</p>
      ) : (
        <p className={`flex items-center gap-1 text-xs font-medium ${up ? "text-success-text" : "text-danger-text"}`}>
          {up ? <ArrowUpRight size={13} aria-hidden /> : <ArrowDownRight size={13} aria-hidden />}
          <span className="tabular-nums">{Math.abs(change).toFixed(1)}%</span>
          <span className="sr-only">{up ? "up" : "down"} versus previous period</span>
          <span aria-hidden className="font-normal text-fg-subtle">vs prior</span>
        </p>
      )}
    </div>
  );
}

export function RevenueOverview({ days = DEMO_DAYS, currency = "USD", defaultRange = 7, className = "" }: RevenueOverviewProps) {
  const [range, setRange] = useState<number>(defaultRange);
  const { current, previous } = windows(days, range);
  const now = summarize(current);
  const before = summarize(previous);
  const max = Math.max(...current.map((d) => d.revenue), 1);
  const [chartRef, W] = useChartWidth<HTMLDivElement>(560);
  const H = 160;
  const slot = W / Math.max(current.length, 1);
  const barW = Math.min(slot * 0.64, 56);
  return (
    <section aria-label="Revenue overview" className={`@container grid gap-4 rounded-[20px] bg-surface p-4 shadow-[var(--shadow-card)] dark:bg-raised ${className}`}>
      <header className="flex items-center justify-between gap-3">
        <h3 className="text-[15px] font-semibold text-fg">Revenue</h3>
        <SegmentedControl label="Date range" size="sm" value={String(range)} onValueChange={(v) => setRange(Number(v))} options={[{ value: "7", label: "7 days" }, { value: "14", label: "14 days" }]} />
      </header>
      <div className="grid grid-cols-2 gap-3 @[720px]:grid-cols-4">
        <Kpi label="Revenue" value={formatMoney(now.revenue, currency)} change={percentChange(now.revenue, before.revenue)} />
        <Kpi label="Orders" value={now.orders.toLocaleString("en-US")} change={percentChange(now.orders, before.orders)} />
        <Kpi label="Avg. order value" value={formatMoney(now.aov, currency)} change={percentChange(now.aov, before.aov)} />
        <Kpi label="Conversion" value={`${(now.conversion * 100).toFixed(2)}%`} change={percentChange(now.conversion, before.conversion)} />
      </div>
      <div ref={chartRef}>
      <svg role="img" aria-label={`Daily revenue for the last ${range} days, peaking at ${formatMoney(max, currency)}`} viewBox={`0 0 ${W} ${H + 22}`} className="block h-auto w-full">
        {[0.25, 0.5, 0.75, 1].map((f) => <line key={f} x1={0} x2={W} y1={H - H * f} y2={H - H * f} stroke="var(--track)" strokeWidth={1} />)}
        {current.map((d, i) => {
          const h = Math.max((d.revenue / max) * H, 2);
          return (
            <g key={`${d.label}-${i}`}>
              <rect x={i * slot + (slot - barW) / 2} y={H - h} width={barW} height={h} rx={4} fill="var(--series-1)" opacity={d.revenue === max ? 1 : 0.7}>
                <title>{`${d.label}: ${formatMoney(d.revenue, currency)}, ${d.orders} orders`}</title>
              </rect>
              {(range === 7 || i % 2 === 0) && <text x={i * slot + slot / 2} y={H + 15} textAnchor="middle" fontSize={10} fill="var(--fg-subtle)">{d.label}</text>}
            </g>
          );
        })}
      </svg>
      </div>
    </section>
  );
}
