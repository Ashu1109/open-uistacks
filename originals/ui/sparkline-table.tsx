"use client";

import { useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

/* SparklineTable: a compact metrics table with an inline SVG trend line per row, the latest value and the change over the series. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

export function sparklinePath(series: readonly number[], width: number, height: number, pad = 2): string {
  if (series.length < 2) return "";
  const min = Math.min(...series);
  const span = Math.max(...series) - min || 1;
  return series
    .map((v, i) => {
      const x = (i / (series.length - 1)) * width;
      const y = pad + (1 - (v - min) / span) * (height - pad * 2);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

/** Percent change from first to last point; 0 when the series starts at zero. */
export function seriesChange(series: readonly number[]): number {
  const first = series[0];
  const last = series[series.length - 1];
  return !first || last === undefined ? 0 : ((last - first) / Math.abs(first)) * 100;
}

export interface SparklineRow {
  id: string;
  label: string;
  series: readonly number[];
  /** Formats the latest value; defaults to a localized number. */
  format?: (value: number) => string;
}

export interface SparklineTableProps {
  rows: readonly SparklineRow[];
  caption: string;
  className?: string;
}

function Trend({ series, id, delay = 0 }: { series: readonly number[]; id: string; delay?: number }) {
  const reduce = useReduce();
  const up = seriesChange(series) >= 0;
  const color = up ? "var(--success)" : "var(--danger)";
  const d = sparklinePath(series, 96, 28);
  return (
    <svg width="96" height="28" viewBox="0 0 96 28" role="img" aria-label={`${id} trend, ${up ? "rising" : "falling"}`} className="overflow-visible">
      <motion.path initial={reduce ? false : { pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 + delay }} d={d} fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SparklineTable({ rows, caption, className = "" }: SparklineTableProps) {
  const reduce = useReduce();
  return (
    <div className={`overflow-hidden rounded-[20px] bg-surface shadow-[var(--shadow-card)] ${className}`}>
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-track text-left text-xs text-fg-muted">
            <th scope="col" className="px-4 py-2.5 font-medium">Metric</th>
            <th scope="col" className="px-4 py-2.5 font-medium">Trend</th>
            <th scope="col" className="px-4 py-2.5 text-right font-medium">Latest</th>
            <th scope="col" className="px-4 py-2.5 text-right font-medium">Change</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const change = seriesChange(row.series);
            const latest = row.series[row.series.length - 1] ?? 0;
            const Arrow = change >= 0 ? ArrowUpRight : ArrowDownRight;
            return (
              <motion.tr key={row.id} initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 480, damping: 34, delay: i * 0.05 }} className="border-b border-track transition-colors last:border-0 hover:bg-subtle/50">
                <th scope="row" className="px-4 py-3 text-left font-medium text-fg">{row.label}</th>
                <td className="px-4 py-3"><Trend series={row.series} id={row.label} delay={i * 0.05} /></td>
                <td className="px-4 py-3 text-right tabular-nums text-fg">{row.format ? row.format(latest) : latest.toLocaleString("en-US")}</td>
                <td className="px-4 py-3 text-right">
                  <motion.span initial={reduce ? false : { opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 480, damping: 30, delay: 0.3 + i * 0.05 }} className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${change >= 0 ? "bg-success-soft text-success-text" : "bg-danger-soft text-danger-text"}`}>
                    <Arrow size={12} aria-hidden />
                    {Math.abs(change).toFixed(1)}%
                  </motion.span>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
