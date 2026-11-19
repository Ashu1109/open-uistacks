"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

/* Date picker: a field that opens a month calendar built on the ARIA date picker grid pattern (arrows, Home/End, PageUp/PageDown, Shift for years, Enter to pick, Escape to close); all date maths uses the built-in Date and Intl APIs. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** Moves by whole months, landing on the last day when the target month is shorter. */
export function addMonths(d: Date, n: number): Date {
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(d.getDate(), last));
}

export const isSameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** Local yyyy-mm-dd, safe for keys and data attributes. */
export function formatISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function clampDate(d: Date, min?: Date, max?: Date): Date {
  if (min && d < startOfDay(min)) return startOfDay(min);
  if (max && d > startOfDay(max)) return startOfDay(max);
  return d;
}

/** Six weeks of seven days covering the month, starting on `weekStartsOn` (0 = Sunday). */
export function monthGrid(year: number, month: number, weekStartsOn = 0): Date[][] {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() - weekStartsOn + 7) % 7;
  const start = addDays(first, -lead);
  return Array.from({ length: 6 }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)));
}

export function weekdayLabels(locale = "en-US", weekStartsOn = 0): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { weekday: "short" });
  return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2023, 0, 1 + ((i + weekStartsOn) % 7))));
}

/** The date a grid key moves focus to, or null for keys the grid does not handle. */
export function moveFocus(current: Date, key: string, shift: boolean, weekStartsOn = 0): Date | null {
  switch (key) {
    case "ArrowLeft": return addDays(current, -1);
    case "ArrowRight": return addDays(current, 1);
    case "ArrowUp": return addDays(current, -7);
    case "ArrowDown": return addDays(current, 7);
    case "Home": return addDays(current, -((current.getDay() - weekStartsOn + 7) % 7));
    case "End": return addDays(current, 6 - ((current.getDay() - weekStartsOn + 7) % 7));
    case "PageUp": return addMonths(current, shift ? -12 : -1);
    case "PageDown": return addMonths(current, shift ? 12 : 1);
    default: return null;
  }
}

export interface CalendarProps {
  value: Date | null;
  onSelect: (date: Date) => void;
  min?: Date;
  max?: Date;
  locale?: string;
  weekStartsOn?: number;
  /** Move keyboard focus into the grid on mount. */
  autoFocus?: boolean;
  /** Treated as today, for demos and tests. */
  today?: Date;
}

export function Calendar({ value, onSelect, min, max, locale = "en-US", weekStartsOn = 0, autoFocus = false, today = new Date() }: CalendarProps) {
  const [focused, setFocused] = useState(() => clampDate(startOfDay(value ?? today), min, max));
  const cells = useRef(new Map<string, HTMLButtonElement>());
  const wantsFocus = useRef(autoFocus);
  const heading = useId();
  const grid = monthGrid(focused.getFullYear(), focused.getMonth(), weekStartsOn);
  const disabled = (d: Date) => Boolean((min && d < startOfDay(min)) || (max && d > startOfDay(max)));

  useEffect(() => {
    if (wantsFocus.current) cells.current.get(formatISO(focused))?.focus();
  }, [focused]);

  const go = (next: Date, focusCell: boolean) => {
    wantsFocus.current = focusCell;
    setFocused(clampDate(next, min, max));
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const next = moveFocus(focused, e.key, e.shiftKey, weekStartsOn);
    if (!next) return;
    e.preventDefault();
    go(next, true);
  };

  const title = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(focused);
  const dayName = new Intl.DateTimeFormat(locale, { dateStyle: "full" });

  return (
    <div className="w-72">
      <div className="mb-2 flex items-center justify-between">
        <button type="button" aria-label="Previous month" onClick={() => go(addMonths(focused, -1), false)} className={`inline-flex size-8 items-center justify-center rounded-full text-fg-muted hover:bg-subtle ${ring}`}><ChevronLeft className="size-4" aria-hidden /></button>
        <h4 id={heading} aria-live="polite" className="text-sm font-medium text-fg">{title}</h4>
        <button type="button" aria-label="Next month" onClick={() => go(addMonths(focused, 1), false)} className={`inline-flex size-8 items-center justify-center rounded-full text-fg-muted hover:bg-subtle ${ring}`}><ChevronRight className="size-4" aria-hidden /></button>
      </div>
      <table role="grid" aria-labelledby={heading} onKeyDown={onKeyDown} className="w-full border-collapse">
        <thead>
          <tr>
            {weekdayLabels(locale, weekStartsOn).map((w) => (
              <th key={w} scope="col" className="h-8 text-xs font-normal text-fg-subtle">{w}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.map((week, w) => (
            <tr key={w}>
              {week.map((d) => {
                const iso = formatISO(d);
                const inMonth = d.getMonth() === focused.getMonth();
                const selected = value !== null && isSameDay(d, value);
                const isToday = isSameDay(d, today);
                return (
                  <td key={iso} role="gridcell" aria-selected={selected} className="p-0.5 text-center">
                    <button
                      ref={(n) => {
                        if (n) cells.current.set(iso, n);
                        else cells.current.delete(iso);
                      }}
                      type="button"
                      tabIndex={isSameDay(d, focused) ? 0 : -1}
                      disabled={disabled(d)}
                      aria-label={dayName.format(d)}
                      aria-current={isToday ? "date" : undefined}
                      onClick={() => {
                        go(d, true);
                        onSelect(startOfDay(d));
                      }}
                      className={`size-9 rounded-full text-sm tabular-nums transition-colors disabled:opacity-30 ${selected ? "bg-[image:var(--grad-primary)] text-[var(--inverse-fg)] shadow-[var(--shadow-btn-primary)]" : `${inMonth ? "text-fg" : "text-fg-subtle"} hover:bg-subtle ${isToday ? "font-semibold text-select-text" : ""}`} ${ring}`}
                    >
                      {d.getDate()}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export interface DatePickerProps {
  value?: Date | null;
  defaultValue?: Date | null;
  onValueChange?: (date: Date) => void;
  min?: Date;
  max?: Date;
  locale?: string;
  weekStartsOn?: number;
  label?: string;
  placeholder?: string;
  today?: Date;
  className?: string;
}

export function DatePicker({ value: controlled, defaultValue = null, onValueChange, min, max, locale = "en-US", weekStartsOn = 0, label = "Date", placeholder = "Pick a date", today, className = "" }: DatePickerProps) {
  const reduce = useReduce();
  const [inner, setInner] = useState<Date | null>(defaultValue);
  const value = controlled !== undefined ? controlled : inner;
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };

  return (
    <div ref={root} className={`relative inline-block ${className}`} onKeyDown={(e) => e.key === "Escape" && open && close()}>
      <button
        ref={trigger}
        type="button"
        aria-label={value ? `${label}: ${new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(value)}` : label}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={`${id}-dialog`}
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex h-10 w-56 items-center justify-between gap-2 rounded-[12px] bg-surface px-3 text-sm shadow-[var(--shadow-card)] ${value ? "text-fg" : "text-fg-subtle"} ${ring}`}
      >
        <span>{value ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(value) : placeholder}</span>
        <CalendarDays className="size-4 text-fg-muted" aria-hidden />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            id={`${id}-dialog`}
            role="dialog"
            aria-label={`Choose ${label.toLowerCase()}`}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ type: "spring", stiffness: 520, damping: 34 }}
            className="absolute left-0 top-full z-50 mt-2 rounded-[18px] bg-surface p-3 shadow-[var(--shadow-overlay)] dark:bg-raised"
          >
            <Calendar
              value={value}
              min={min}
              max={max}
              locale={locale}
              weekStartsOn={weekStartsOn}
              today={today}
              autoFocus
              onSelect={(d) => {
                setInner(d);
                onValueChange?.(d);
                close();
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
