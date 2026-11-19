"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Leaving, gone } from "./chart-utils";

/* WeekCalendar: a seven-day time grid with navigation; events are positioned by time and overlapping ones share the day column side by side. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export type EventTone = "select" | "success" | "warning" | "danger";

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  tone?: EventTone;
}

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** First day of the week containing `d`; `weekStartsOn` 0 is Sunday. */
export function startOfWeek(d: Date, weekStartsOn = 0): Date {
  return addDays(startOfDay(d), -((d.getDay() - weekStartsOn + 7) % 7));
}

export interface PlacedEvent {
  event: CalendarEvent;
  column: number;
  columns: number;
}

/** Packs overlapping events into side-by-side columns; each overlap cluster shares one column count. */
export function layoutEvents(events: readonly CalendarEvent[]): PlacedEvent[] {
  const sorted = [...events].sort((a, b) => a.start.getTime() - b.start.getTime() || b.end.getTime() - a.end.getTime());
  const placed: PlacedEvent[] = [];
  let cluster: PlacedEvent[] = [];
  let lanes: number[] = [];
  let clusterEnd = -Infinity;

  const flush = () => {
    for (const p of cluster) placed.push({ ...p, columns: lanes.length });
    cluster = [];
    lanes = [];
  };

  for (const event of sorted) {
    const start = event.start.getTime();
    if (start >= clusterEnd) flush();
    let column = lanes.findIndex((end) => end <= start);
    if (column === -1) column = lanes.length;
    lanes[column] = event.end.getTime();
    cluster.push({ event, column, columns: 0 });
    clusterEnd = Math.max(clusterEnd, event.end.getTime());
  }
  flush();
  return placed;
}

const TONE: Record<EventTone, string> = {
  select: "bg-select-soft text-select-text border-[var(--select)]",
  success: "bg-success-soft text-success-text border-[var(--success)]",
  warning: "bg-warning-soft text-warning-text border-[var(--warning)]",
  danger: "bg-danger-soft text-danger-text border-[var(--danger)]",
};

const HOUR_HEIGHT = 48;
const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });
const hourLabel = new Intl.DateTimeFormat("en-US", { hour: "numeric" });
const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short" });
const monthDay = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

export interface WeekCalendarProps {
  events: readonly CalendarEvent[];
  date?: Date;
  defaultDate?: Date;
  onDateChange?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  startHour?: number;
  endHour?: number;
  weekStartsOn?: number;
  /** Overrides the current time (today highlight). */
  today?: Date;
  className?: string;
}

const slide = (distance: number, reduce: boolean) => ({
  enter: (dir: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: dir * distance }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => (reduce ? { opacity: 0, transition: { duration: 0.1 } } : { opacity: 0, x: dir * -distance, transition: { duration: 0.18, ease: "easeIn" as const } }),
});

export function WeekCalendar({ events, date, defaultDate, onDateChange, onEventClick, startHour = 8, endHour = 18, weekStartsOn = 0, today = new Date(), className = "" }: WeekCalendarProps) {
  const [inner, setInner] = useState(defaultDate ?? today);
  const anchor = date ?? inner;
  const first = startOfWeek(anchor, weekStartsOn);
  const days = Array.from({ length: 7 }, (_, i) => addDays(first, i));
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const reduce = useReduce();
  const dir = useRef(1);
  const move = (next: Date) => {
    dir.current = next.getTime() >= anchor.getTime() ? 1 : -1;
    if (date === undefined) setInner(next);
    onDateChange?.(next);
  };

  return (
    <section aria-label={`Week of ${monthDay.format(first)}`} className={`overflow-hidden rounded-[20px] bg-surface shadow-[var(--shadow-card)] ${className}`}>
      <header className="flex items-center justify-between border-b border-track px-4 py-3">
        <h4 className="text-sm font-semibold text-fg">{monthDay.format(first)} – {monthDay.format(days[6])}</h4>
        <div className="flex items-center gap-1">
          <button type="button" aria-label="Previous week" onClick={() => move(addDays(first, -7))} className={`grid size-8 place-items-center rounded-[10px] text-fg-muted transition-colors hover:bg-subtle active:scale-95 ${ring}`}><ChevronLeft size={16} aria-hidden /></button>
          <button type="button" onClick={() => move(today)} className={`h-8 rounded-[10px] px-3 text-[13px] font-medium text-fg transition-colors hover:bg-subtle active:scale-95 ${ring}`}>Today</button>
          <button type="button" aria-label="Next week" onClick={() => move(addDays(first, 7))} className={`grid size-8 place-items-center rounded-[10px] text-fg-muted transition-colors hover:bg-subtle active:scale-95 ${ring}`}><ChevronRight size={16} aria-hidden /></button>
        </div>
      </header>
      <div className="overflow-x-auto">
        <div className="grid min-w-[640px] [&>*]:col-start-1 [&>*]:row-start-1">
        <AnimatePresence custom={dir.current}>
        <Leaving key={first.toISOString()}>{(out) => (
        <motion.div {...gone(out)} custom={dir.current} variants={slide(28, reduce)} initial="enter" animate="center" exit="exit" transition={{ type: "spring", stiffness: 420, damping: 36 }} className="grid min-w-[640px] grid-cols-[48px_repeat(7,minmax(0,1fr))]">
          <div />
          {days.map((d) => (
            <div key={d.toISOString()} className="border-l border-track py-2 text-center text-xs text-fg-muted">
              {weekday.format(d)}{" "}
              <span className={`ml-0.5 inline-grid size-6 place-items-center rounded-full text-[13px] font-medium ${sameDay(d, today) ? "bg-select text-white" : "text-fg"}`}>{d.getDate()}</span>
            </div>
          ))}
          <div aria-hidden>
            {hours.map((h) => (
              <div key={h} style={{ height: HOUR_HEIGHT }} className="-mt-px pr-2 pt-1 text-right text-[11px] text-fg-subtle">{hourLabel.format(new Date(2000, 0, 1, h))}</div>
            ))}
          </div>
          {days.map((d, di) => {
            const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), startHour).getTime();
            const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), endHour).getTime();
            const todays = events.filter((e) => sameDay(e.start, d));
            return (
              <div key={d.toISOString()} role="group" aria-label={monthDay.format(d)} className="relative border-l border-track" style={{ height: hours.length * HOUR_HEIGHT, backgroundImage: "linear-gradient(var(--track) 1px, transparent 1px)", backgroundSize: `100% ${HOUR_HEIGHT}px` }}>
                {layoutEvents(todays).map(({ event, column, columns }, ei) => {
                  const from = Math.max(event.start.getTime(), dayStart);
                  const to = Math.min(event.end.getTime(), dayEnd);
                  if (to <= from) return null;
                  const top = ((from - dayStart) / 3_600_000) * HOUR_HEIGHT;
                  const height = Math.max(((to - from) / 3_600_000) * HOUR_HEIGHT - 2, 18);
                  return (
                    <motion.button
                      key={event.id}
                      initial={reduce ? false : { opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 480, damping: 34, delay: 0.12 + Math.min(di * 0.03 + ei * 0.04, 0.4) }}
                      whileHover={reduce ? undefined : { scale: 1.03 }}
                      whileTap={reduce ? undefined : { scale: 0.97 }}
                      type="button"
                      aria-label={`${event.title}, ${time.format(event.start)} to ${time.format(event.end)}`}
                      onClick={() => onEventClick?.(event)}
                      style={{ top, height, left: `calc(${(column / columns) * 100}% + 2px)`, width: `calc(${100 / columns}% - 4px)` }}
                      className={`absolute overflow-hidden rounded-[8px] border-l-[3px] px-1.5 py-1 text-left text-[11px] leading-4 ${TONE[event.tone ?? "select"]} ${ring}`}
                    >
                      <span className="block truncate font-medium">{event.title}</span>
                      <span className="block truncate opacity-80">{time.format(event.start)}</span>
                    </motion.button>
                  );
                })}
              </div>
            );
          })}
        </motion.div>
        )}</Leaving>
        </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
