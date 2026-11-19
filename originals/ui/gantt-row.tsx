"use client";

import { useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "motion/react";

/* GanttRow: one task line of a Gantt chart, a label beside a track holding a bar positioned by date within the visible range, with optional progress fill. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const DAY = 86_400_000;

export const daysBetween = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / DAY);

/** Bar offset and width as percentages of the range; inclusive of the end day and clipped to the range. */
export function barGeometry(start: Date, end: Date, rangeStart: Date, rangeEnd: Date) {
  const total = Math.max(daysBetween(rangeStart, rangeEnd) + 1, 1);
  const from = Math.min(Math.max(daysBetween(rangeStart, start), 0), total);
  const to = Math.min(Math.max(daysBetween(rangeStart, end) + 1, 0), total);
  return { left: (from / total) * 100, width: (Math.max(to - from, 0) / total) * 100 };
}

const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

export interface GanttRowProps {
  label: string;
  start: Date;
  end: Date;
  rangeStart: Date;
  rangeEnd: Date;
  /** 0 to 1. */
  progress?: number;
  /** CSS color for the bar. */
  color?: string;
  /** Width of the label column. */
  labelWidth?: number;
  className?: string;
  /** Seconds to wait before the bar grows in; the chart staggers its rows with it. */
  delay?: number;
}

export function GanttRow({ label, start, end, rangeStart, rangeEnd, progress, color = "var(--series-1)", labelWidth = 160, className = "", delay = 0 }: GanttRowProps) {
  const reduce = useReduce();
  const { left, width } = barGeometry(start, end, rangeStart, rangeEnd);
  const pct = progress === undefined ? undefined : Math.round(Math.min(Math.max(progress, 0), 1) * 100);
  return (
    <div role="row" className={`flex h-10 items-center ${className}`}>
      <div role="rowheader" style={{ width: labelWidth }} className="shrink-0 truncate pr-3 text-[13px] text-fg">{label}</div>
      <div role="cell" className="relative h-full flex-1">
        {width > 0 && (
          <motion.div
            role="img"
            initial={reduce ? { opacity: 0 } : { clipPath: "inset(0 100% 0 0)" }}
            animate={reduce ? { opacity: 1 } : { clipPath: "inset(0 0% 0 0)" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay }}
            aria-label={`${label}: ${dateFmt.format(start)} to ${dateFmt.format(end)}${pct === undefined ? "" : `, ${pct}% complete`}`}
            style={{ left: `${left}%`, width: `${width}%`, background: `color-mix(in srgb, ${color} 28%, var(--surface))` }}
            className="absolute top-1/2 h-5 -translate-y-1/2 overflow-hidden rounded-[8px]"
          >
            {pct !== undefined && <motion.div initial={reduce ? false : { scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.6, ease: "easeOut", delay: delay + 0.25 }} style={{ width: `${pct}%`, background: color, transformOrigin: "left" }} className="h-full rounded-[8px]" />}
          </motion.div>
        )}
      </div>
    </div>
  );
}
