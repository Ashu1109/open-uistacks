"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, formatISO, isSameDay, startOfDay } from "./date-picker";

/* Date strip: a horizontal run of days for quick scheduling; it is a radio group with roving focus, arrows step day by day and scroll the strip, and the side buttons page by a whole strip. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

/** The first day of a strip so that `date` is visible: strips start at multiples of `days` from `anchor`. */
export function stripStart(date: Date, anchor: Date, days: number): Date {
  const offset = Math.round((startOfDay(date).getTime() - startOfDay(anchor).getTime()) / 86_400_000);
  return addDays(anchor, Math.floor(offset / days) * days);
}

export interface DateStripProps {
  value?: Date | null;
  defaultValue?: Date | null;
  onValueChange?: (date: Date) => void;
  /** How many days are visible at once. */
  days?: number;
  locale?: string;
  /** Treated as today, for demos and tests. */
  today?: Date;
  className?: string;
}

export function DateStrip({ value: controlled, defaultValue = null, onValueChange, days = 7, locale = "en-US", today = new Date(), className = "" }: DateStripProps) {
  const anchor = startOfDay(today);
  const [inner, setInner] = useState<Date | null>(defaultValue);
  const value = controlled !== undefined ? controlled : inner;
  const [start, setStart] = useState(() => stripStart(value ?? anchor, anchor, days));
  const refs = useRef(new Map<string, HTMLButtonElement>());
  const shown = Array.from({ length: days }, (_, i) => addDays(start, i));
  const weekday = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const full = new Intl.DateTimeFormat(locale, { dateStyle: "full" });
  const range = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" });

  const choose = (date: Date) => {
    const d = startOfDay(date);
    setInner(d);
    onValueChange?.(d);
    setStart(stripStart(d, anchor, days));
    requestAnimationFrame(() => refs.current.get(formatISO(d))?.focus());
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const at = value ?? shown[0];
    const next = e.key === "ArrowRight" ? addDays(at, 1) : e.key === "ArrowLeft" ? addDays(at, -1) : e.key === "Home" ? shown[0] : e.key === "End" ? shown[days - 1] : null;
    if (!next) return;
    e.preventDefault();
    choose(next);
  };

  const inStrip = value !== null && shown.some((d) => isSameDay(d, value));

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <button type="button" aria-label="Previous days" onClick={() => setStart(addDays(start, -days))} className={`inline-flex size-8 items-center justify-center rounded-full text-fg-muted hover:bg-subtle ${ring}`}><ChevronLeft className="size-4" aria-hidden /></button>
      <div role="radiogroup" aria-label={`Days, ${range.format(shown[0])} to ${range.format(shown[days - 1])}`} onKeyDown={onKeyDown} className="flex gap-1.5">
        {shown.map((d, i) => {
          const on = value !== null && isSameDay(d, value);
          const isToday = isSameDay(d, anchor);
          return (
            <button
              key={formatISO(d)}
              ref={(n) => {
                if (n) refs.current.set(formatISO(d), n);
                else refs.current.delete(formatISO(d));
              }}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={full.format(d)}
              aria-current={isToday ? "date" : undefined}
              tabIndex={on || (!inStrip && i === 0) ? 0 : -1}
              onClick={() => choose(d)}
              className={`flex h-16 w-12 flex-col items-center justify-center gap-0.5 rounded-[14px] text-xs transition-colors ${on ? "bg-[image:var(--grad-primary)] text-[var(--inverse-fg)] shadow-[var(--shadow-btn-primary)]" : "bg-surface text-fg-muted shadow-[var(--shadow-card)] hover:bg-[color-mix(in_srgb,var(--fg)_4%,var(--surface))]"} ${ring}`}
            >
              <span aria-hidden>{weekday.format(d)}</span>
              <span aria-hidden className={`text-base font-medium tabular-nums ${on ? "" : "text-fg"}`}>{d.getDate()}</span>
              <span aria-hidden className={`size-1 rounded-full ${isToday ? (on ? "bg-current" : "bg-[var(--select)]") : "bg-transparent"}`} />
            </button>
          );
        })}
      </div>
      <button type="button" aria-label="Next days" onClick={() => setStart(addDays(start, days))} className={`inline-flex size-8 items-center justify-center rounded-full text-fg-muted hover:bg-subtle ${ring}`}><ChevronRight className="size-4" aria-hidden /></button>
    </div>
  );
}
