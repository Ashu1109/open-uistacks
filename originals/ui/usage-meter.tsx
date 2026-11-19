"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { formatTokens } from "./context-meter";

/* Usage meter: a quota bar showing used against a limit with a plain-language readout, colour that shifts to warning and danger as it fills, an optional stacked breakdown with legend and a slot for an upgrade action; it exposes role="meter". */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

export type UsageLevel = "ok" | "warning" | "danger";

/** ok below 80% of the limit, warning from 80%, danger from 95%. */
export function usageLevel(ratio: number): UsageLevel {
  if (ratio >= 0.95) return "danger";
  if (ratio >= 0.8) return "warning";
  return "ok";
}

const FILL: Record<UsageLevel, string> = {
  ok: "var(--select)",
  warning: "var(--warning)",
  danger: "var(--danger)",
};

const SERIES = ["var(--series-1)", "var(--series-3)", "var(--success)", "var(--warning)"];

export interface UsageSegment {
  label: string;
  value: number;
  /** Any CSS colour; defaults to the chart series palette. */
  color?: string;
}

export interface UsageMeterProps {
  label: string;
  used: number;
  limit: number;
  /** Noun after the numbers, such as "credits". */
  unit?: string;
  /** Splits the bar by source; the segment values should sum to `used`. */
  segments?: UsageSegment[];
  /** Text such as "Resets Dec 1". */
  resets?: ReactNode;
  /** Slot for an upgrade or top-up button. */
  action?: ReactNode;
  format?: (value: number) => string;
  className?: string;
}

export function UsageMeter({ label, used, limit, unit = "", segments, resets, action, format = formatTokens, className = "" }: UsageMeterProps) {
  const reduce = useReduce();
  const ratio = limit > 0 ? used / limit : 0;
  const level = usageLevel(ratio);
  const over = Math.max(0, used - limit);
  const suffix = unit ? ` ${unit}` : "";
  const text = `${format(used)} of ${format(limit)}${suffix} used`;
  const spring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 500, damping: 34 };
  const stacked = segments && segments.length > 0;

  return (
    <div className={`grid gap-2.5 ${className}`}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-fg">{label}</span>
        <span className="text-sm tabular-nums text-fg-muted">{Math.round(ratio * 100)}%</span>
      </div>
      <div role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={limit} aria-valuenow={Math.min(used, limit)} aria-valuetext={text} className="flex h-2 overflow-hidden rounded-full bg-track">
        {stacked ? (
          segments.map((s, i) => (
            <motion.div key={s.label} initial={false} animate={{ width: `${Math.min((s.value / limit) * 100, 100)}%` }} transition={spring} style={{ background: s.color ?? SERIES[i % SERIES.length] }} className="h-full border-r border-surface last:border-0 dark:border-raised" />
          ))
        ) : (
          <motion.div initial={false} animate={{ width: `${Math.min(ratio * 100, 100)}%` }} transition={spring} style={{ background: FILL[level] }} className="h-full rounded-full" />
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[13px] text-fg-muted">
        <span>{text}</span>
        {resets && <span className="text-fg-subtle">{resets}</span>}
      </div>
      {over > 0 && <p role="alert" className="text-[13px] font-medium text-danger-text">Over the limit by {format(over)}{suffix}.</p>}
      {level === "warning" && over === 0 && <p role="status" className="text-[13px] text-warning-text">Approaching your limit.</p>}
      {stacked && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {segments.map((s, i) => (
            <li key={s.label} className="flex items-center gap-1.5 text-xs text-fg-muted">
              <span aria-hidden className="size-2 rounded-full" style={{ background: s.color ?? SERIES[i % SERIES.length] }} />
              {s.label} <span className="tabular-nums text-fg-subtle">{format(s.value)}</span>
            </li>
          ))}
        </ul>
      )}
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}
