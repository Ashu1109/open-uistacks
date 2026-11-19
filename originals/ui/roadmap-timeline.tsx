"use client";

import { useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "motion/react";

/* Roadmap timeline: initiatives drawn as bars on a month scale, with optional progress fill and a today marker; every bar has a text equivalent with its dates. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

export type RoadmapTone = "info" | "success" | "warning" | "danger" | "neutral";

const TONE_VAR: Record<RoadmapTone, string> = {
  info: "var(--series-1)",
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--danger)",
  neutral: "var(--series-3)",
};

export interface RoadmapItem {
  id: string;
  title: string;
  /** ISO date, YYYY-MM-DD. */
  start: string;
  end: string;
  /** 0 to 1. */
  progress?: number;
  tone?: RoadmapTone;
  group?: string;
}

export interface RoadmapTimelineProps {
  items: RoadmapItem[];
  /** ISO date drawn as a vertical marker. */
  today?: string;
  className?: string;
}

const DAY = 86_400_000;
const toTime = (iso: string) => Date.parse(`${iso}T00:00:00Z`);

/** Bar position as percentages of the range; the end date is inclusive and the result is clamped to the range. */
export function barLayout(start: string, end: string, rangeStart: number, rangeEnd: number): { left: number; width: number } {
  const span = rangeEnd - rangeStart;
  const a = Math.min(Math.max(toTime(start), rangeStart), rangeEnd);
  const b = Math.min(Math.max(toTime(end) + DAY, rangeStart), rangeEnd);
  return { left: ((a - rangeStart) / span) * 100, width: Math.max(((b - a) / span) * 100, 0) };
}

/** First day of each month covered by the items, plus the exclusive range end. */
export function timelineRange(items: RoadmapItem[]): { start: number; end: number; months: number[] } {
  if (items.length === 0) return { start: 0, end: 0, months: [] };
  const first = new Date(Math.min(...items.map((i) => toTime(i.start))));
  const last = new Date(Math.max(...items.map((i) => toTime(i.end))));
  const months: number[] = [];
  for (let d = Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), 1); d <= last.getTime(); ) {
    months.push(d);
    const next = new Date(d);
    d = Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 1);
  }
  const lastMonth = new Date(months[months.length - 1]);
  return { start: months[0], end: Date.UTC(lastMonth.getUTCFullYear(), lastMonth.getUTCMonth() + 1, 1), months };
}

const monthLabel = (t: number) => new Date(t).toLocaleDateString("en", { month: "short", timeZone: "UTC" });
const dayLabel = (iso: string) => new Date(toTime(iso)).toLocaleDateString("en", { month: "short", day: "numeric", timeZone: "UTC" });

export function RoadmapTimeline({ items, today, className = "" }: RoadmapTimelineProps) {
  const reduce = useReduce();
  const range = timelineRange(items);
  if (items.length === 0) return <p className={`text-sm text-fg-muted ${className}`}>Nothing planned yet.</p>;
  const marker = today ? barLayout(today, today, range.start, range.end).left : null;
  const showMarker = marker !== null && toTime(today!) >= range.start && toTime(today!) < range.end;
  const columns = { gridTemplateColumns: `repeat(${range.months.length}, minmax(0, 1fr))` };

  return (
    <div className={`overflow-x-auto rounded-[18px] bg-surface p-4 shadow-[var(--shadow-card)] dark:bg-raised ${className}`}>
      <div className="relative min-w-[560px]">
        <div aria-hidden className="grid text-xs text-fg-subtle" style={columns}>
          {range.months.map((m) => <span key={m} className="border-l border-track pl-1.5">{monthLabel(m)}</span>)}
        </div>
        <ul aria-label="Roadmap" className="relative mt-2 grid gap-2">
          <div aria-hidden className="pointer-events-none absolute inset-0 grid" style={columns}>
            {range.months.map((m) => <span key={m} className="border-l border-track/60" />)}
          </div>
          {showMarker && <motion.span aria-hidden data-testid="today-marker" initial={reduce ? false : { scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.3 }} className="absolute inset-y-0 z-10 w-px origin-top bg-danger" style={{ left: `${marker}%` }} />}
          {items.map((item, i) => {
            const { left, width } = barLayout(item.start, item.end, range.start, range.end);
            const color = TONE_VAR[item.tone ?? "info"];
            return (
              <li key={item.id} className="relative h-9">
                <span className="sr-only">{item.title}, {dayLabel(item.start)} to {dayLabel(item.end)}{item.progress !== undefined ? `, ${Math.round(item.progress * 100)}% complete` : ""}</span>
                <motion.div
                  aria-hidden
                  initial={reduce ? { opacity: 0 } : { clipPath: "inset(0 100% 0 0 round 10px)" }}
                  animate={reduce ? { opacity: 1 } : { clipPath: "inset(0 0% 0 0 round 10px)" }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: Math.min(i, 10) * 0.05 }}
                  className="absolute inset-y-0 flex items-center overflow-hidden rounded-[10px] px-3 text-xs font-medium text-fg" style={{ left: `${left}%`, width: `${width}%`, background: `color-mix(in srgb, ${color} 18%, var(--surface))`, boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${color} 40%, transparent)` }}>
                  {item.progress !== undefined && <motion.span initial={reduce ? false : { scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.5, ease: "easeOut", delay: Math.min(i, 10) * 0.05 + 0.25 }} className="absolute inset-y-0 left-0 origin-left" style={{ width: `${Math.round(item.progress * 100)}%`, background: `color-mix(in srgb, ${color} 28%, transparent)` }} />}
                  <span className="relative truncate">{item.title}</span>
                </motion.div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
