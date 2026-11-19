"use client";

import { useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "motion/react";

/* CohortTable: a retention heatmap where each row is a cohort and each column a period; cell tint scales with the retained share. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

/** Background for a 0..1 retention value, blending the accent into the surface. */
export function cellTint(value: number): string {
  const strength = Math.round(Math.min(Math.max(value, 0), 1) * 85);
  return `color-mix(in srgb, var(--select) ${strength}%, var(--surface))`;
}

export interface CohortRow {
  label: string;
  size: number;
  /** Retained share per period, 0 to 1; shorter rows leave later cells empty. */
  values: readonly number[];
}

export interface CohortTableProps {
  rows: readonly CohortRow[];
  periodLabel?: string;
  caption?: string;
  className?: string;
}

export function CohortTable({ rows, periodLabel = "Week", caption = "Cohort retention", className = "" }: CohortTableProps) {
  const reduce = useReduce();
  const periods = Math.max(0, ...rows.map((r) => r.values.length));
  return (
    <div className={`overflow-x-auto rounded-[20px] bg-surface p-3 shadow-[var(--shadow-card)] ${className}`}>
      <table className="w-full border-separate border-spacing-1 text-xs">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="text-fg-muted">
            <th scope="col" className="px-2 py-1 text-left font-medium">Cohort</th>
            <th scope="col" className="px-2 py-1 text-right font-medium">Users</th>
            {Array.from({ length: periods }, (_, i) => (
              <th key={i} scope="col" className="px-2 py-1 font-medium">{periodLabel} {i}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={row.label}>
              <th scope="row" className="whitespace-nowrap px-2 py-1 text-left font-medium text-fg">{row.label}</th>
              <td className="px-2 py-1 text-right tabular-nums text-fg-muted">{row.size.toLocaleString("en-US")}</td>
              {Array.from({ length: periods }, (_, i) => {
                const v = row.values[i];
                return v === undefined ? (
                  <td key={i} />
                ) : (
                  <motion.td key={i} initial={reduce ? false : { opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 480, damping: 34, delay: Math.min((r + i) * 0.04, 0.5) }} style={{ background: cellTint(v) }} className={`rounded-[8px] px-2 py-1.5 text-center font-medium tabular-nums ${v > 0.55 ? "text-white" : "text-fg"}`}>
                    {formatPercent(v)}
                  </motion.td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
