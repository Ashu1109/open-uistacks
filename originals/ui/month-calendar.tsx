"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, sameDay, startOfWeek, type CalendarEvent } from "./week-calendar";
import { Leaving, gone } from "./chart-utils";

/* MonthCalendar: a month grid with roving-tabindex arrow-key navigation, a selected day, today marker and a dot under days that have events. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

/** Weeks (arrays of 7 dates) covering the month, padded with neighbouring days. */
export function monthGrid(year: number, month: number, weekStartsOn = 0): Date[][] {
  const first = new Date(year, month, 1);
  const start = startOfWeek(first, weekStartsOn);
  const lastDay = new Date(year, month + 1, 0);
  const weeks = Math.ceil((lastDay.getDate() + ((first.getDay() - weekStartsOn + 7) % 7)) / 7);
  return Array.from({ length: weeks }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)));
}

const KEY_STEP: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
const title = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
const full = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
const dow = new Intl.DateTimeFormat("en-US", { weekday: "short" });

export interface MonthCalendarProps {
  events?: readonly CalendarEvent[];
  value?: Date;
  defaultValue?: Date;
  onValueChange?: (date: Date) => void;
  weekStartsOn?: number;
  /** Overrides the current day. */
  today?: Date;
  className?: string;
}

const slide = (distance: number, reduce: boolean) => ({
  enter: (dir: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: dir * distance }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => (reduce ? { opacity: 0, transition: { duration: 0.1 } } : { opacity: 0, x: dir * -distance, transition: { duration: 0.18, ease: "easeIn" as const } }),
});

export function MonthCalendar({ events = [], value, defaultValue, onValueChange, weekStartsOn = 0, today = new Date(), className = "" }: MonthCalendarProps) {
  const [inner, setInner] = useState(defaultValue ?? today);
  const [cursor, setCursor] = useState(value ?? defaultValue ?? today);
  const selected = value ?? inner;
  const reduce = useReduce();
  const pillId = useId();
  const dir = useRef(1);
  const gridRef = useRef<HTMLDivElement>(null);
  const shouldFocus = useRef(false);
  const weeks = monthGrid(cursor.getFullYear(), cursor.getMonth(), weekStartsOn);

  useEffect(() => {
    if (!shouldFocus.current) return;
    shouldFocus.current = false;
    gridRef.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus();
  });

  const pick = (d: Date) => {
    if (value === undefined) setInner(d);
    onValueChange?.(d);
  };
  const goTo = (next: Date) => {
    dir.current = next.getFullYear() * 12 + next.getMonth() >= cursor.getFullYear() * 12 + cursor.getMonth() ? 1 : -1;
    setCursor(next);
  };
  const shiftMonth = (n: number) => goTo(new Date(cursor.getFullYear(), cursor.getMonth() + n, 1));
  const onKey = (e: KeyboardEvent) => {
    const step = KEY_STEP[e.key];
    if (step === undefined) return;
    e.preventDefault();
    shouldFocus.current = true;
    goTo(addDays(cursor, step));
  };

  return (
    <section aria-label={`Calendar, ${title.format(cursor)}`} className={`w-full max-w-sm rounded-[20px] bg-surface p-4 shadow-[var(--shadow-card)] ${className}`}>
      <header className="mb-3 flex items-center justify-between">
        <h4 aria-live="polite" className="text-sm font-semibold text-fg">{title.format(cursor)}</h4>
        <div className="flex gap-1">
          <button type="button" aria-label="Previous month" onClick={() => shiftMonth(-1)} className={`grid size-8 place-items-center rounded-[10px] text-fg-muted transition-colors hover:bg-subtle active:scale-95 ${ring}`}><ChevronLeft size={16} aria-hidden /></button>
          <button type="button" aria-label="Next month" onClick={() => shiftMonth(1)} className={`grid size-8 place-items-center rounded-[10px] text-fg-muted transition-colors hover:bg-subtle active:scale-95 ${ring}`}><ChevronRight size={16} aria-hidden /></button>
        </div>
      </header>
      <div className="grid [&>*]:col-start-1 [&>*]:row-start-1">
      <AnimatePresence custom={dir.current}>
      <Leaving key={`${cursor.getFullYear()}-${cursor.getMonth()}`}>{(out) => (
      <motion.div {...gone(out)} ref={out ? undefined : gridRef} role="grid" aria-label={title.format(cursor)} onKeyDown={onKey} custom={dir.current} variants={slide(24, reduce)} initial="enter" animate="center" exit="exit" transition={{ type: "spring", stiffness: 420, damping: 36 }}>
        <div role="row" className="grid grid-cols-7">
          {weeks[0].map((d) => <div key={d.getDay()} role="columnheader" className="pb-1 text-center text-[11px] font-medium text-fg-subtle">{dow.format(d)}</div>)}
        </div>
        {weeks.map((week) => (
          <div key={week[0].toISOString()} role="row" className="grid grid-cols-7">
            {week.map((d) => {
              const inMonth = d.getMonth() === cursor.getMonth();
              const isSelected = sameDay(d, selected);
              const hasEvents = events.some((e) => sameDay(e.start, d));
              return (
                <div key={d.toISOString()} role="gridcell" aria-selected={isSelected} className="grid place-items-center p-0.5">
                  <button
                    type="button"
                    tabIndex={sameDay(d, cursor) ? 0 : -1}
                    aria-label={`${full.format(d)}${hasEvents ? ", has events" : ""}`}
                    aria-current={sameDay(d, today) ? "date" : undefined}
                    onClick={() => { setCursor(d); pick(d); }}
                    className={`relative grid size-9 place-items-center rounded-full text-[13px] tabular-nums transition-colors active:scale-95 ${ring} ${isSelected ? "font-medium text-white" : sameDay(d, today) ? "font-semibold text-select-text" : inMonth ? "text-fg hover:bg-subtle" : "text-fg-subtle hover:bg-subtle"}`}
                  >
                    {isSelected && <motion.span aria-hidden layoutId={reduce ? undefined : pillId} initial={reduce ? false : undefined} transition={{ type: "spring", stiffness: 520, damping: 34 }} className="absolute inset-0 rounded-full bg-select" />}
                    <span className="relative">{d.getDate()}</span>
                    {hasEvents && <span aria-hidden className={`absolute bottom-1 size-1 rounded-full ${isSelected ? "bg-white" : "bg-select"}`} />}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </motion.div>
      )}</Leaving>
      </AnimatePresence>
      </div>
    </section>
  );
}
