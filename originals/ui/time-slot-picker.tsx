"use client";

import { useRef, useState, type KeyboardEvent } from "react";

/* Time slot picker: a grid of bookable times as a radio group; unavailable slots are disabled and skipped by the arrow keys, which move in two dimensions. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface TimeSlot {
  /** 24-hour "HH:mm". */
  time: string;
  disabled?: boolean;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Slots from start (inclusive) to end (exclusive) every `stepMinutes`, e.g. ("09:00","11:00",30). */
export function generateSlots(start: string, end: string, stepMinutes: number, unavailable: string[] = []): TimeSlot[] {
  const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  const slots: TimeSlot[] = [];
  for (let m = toMin(start); m < toMin(end); m += Math.max(stepMinutes, 1)) {
    const time = `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
    slots.push({ time, disabled: unavailable.includes(time) });
  }
  return slots;
}

export function formatSlot(time: string, hour12 = true): string {
  const h = Number(time.slice(0, 2));
  const m = time.slice(3, 5);
  if (!hour12) return `${pad(h)}:${m}`;
  return `${h % 12 === 0 ? 12 : h % 12}:${m} ${h < 12 ? "AM" : "PM"}`;
}

/** Next enabled index moving by `delta` (columns for vertical moves), staying inside the list. */
export function moveSlot(slots: TimeSlot[], from: number, delta: number): number {
  for (let i = from + delta; i >= 0 && i < slots.length; i += delta) if (!slots[i].disabled) return i;
  return from;
}

export interface TimeSlotPickerProps {
  slots: TimeSlot[];
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (time: string) => void;
  hour12?: boolean;
  columns?: number;
  label?: string;
  className?: string;
}

export function TimeSlotPicker({ slots, value: controlled, defaultValue = null, onValueChange, hour12 = true, columns = 3, label = "Available times", className = "" }: TimeSlotPickerProps) {
  const [inner, setInner] = useState<string | null>(defaultValue);
  const value = controlled !== undefined ? controlled : inner;
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const selected = slots.findIndex((s) => s.time === value);
  const firstEnabled = slots.findIndex((s) => !s.disabled);
  const tabStop = selected >= 0 ? selected : firstEnabled;

  const choose = (index: number) => {
    setInner(slots[index].time);
    onValueChange?.(slots[index].time);
    refs.current[index]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const at = refs.current.findIndex((n) => n === document.activeElement);
    if (at < 0) return;
    const delta: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: columns, ArrowUp: -columns };
    let next = at;
    if (e.key in delta) next = moveSlot(slots, at, delta[e.key]);
    else if (e.key === "Home") next = moveSlot(slots, -1, 1);
    else if (e.key === "End") next = moveSlot(slots, slots.length, -1);
    else return;
    e.preventDefault();
    refs.current[next]?.focus();
  };

  return (
    <div role="radiogroup" aria-label={label} onKeyDown={onKeyDown} className={`grid w-72 gap-2 ${className}`} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {slots.map((s, i) => {
        const on = s.time === value;
        return (
          <button
            key={s.time}
            ref={(n) => {
              refs.current[i] = n;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={s.disabled}
            tabIndex={i === tabStop ? 0 : -1}
            onClick={() => choose(i)}
            className={`h-10 rounded-[12px] text-sm tabular-nums transition-colors disabled:cursor-not-allowed disabled:text-fg-subtle disabled:line-through disabled:opacity-50 ${on ? "bg-[image:var(--grad-primary)] text-[var(--inverse-fg)] shadow-[var(--shadow-btn-primary)]" : "bg-surface text-fg shadow-[var(--shadow-card)] hover:bg-[color-mix(in_srgb,var(--fg)_4%,var(--surface))]"} ${ring}`}
          >
            {formatSlot(s.time, hour12)}
          </button>
        );
      })}
    </div>
  );
}
