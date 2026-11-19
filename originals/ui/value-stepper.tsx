"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Minus, Plus } from "lucide-react";

/* Value stepper: minus and plus buttons around a number that follows the spinbutton pattern; holding a button repeats, and arrows, PageUp/PageDown, Home and End work from the keyboard. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

/** value + delta clamped to [min, max], rounded to the step's precision. */
export function stepValue(value: number, delta: number, min: number, max: number, step: number): number {
  const places = (String(step).split(".")[1] ?? "").length;
  return Number(Math.min(Math.max(value + delta, min), max).toFixed(places));
}

export interface ValueStepperProps {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label: string;
  /** Text shown for the value, e.g. (n) => `${n} guests`. */
  formatValue?: (value: number) => string;
  className?: string;
}

const REPEAT_DELAY = 400;
const REPEAT_EVERY = 80;

export function ValueStepper({ value: controlled, defaultValue = 0, onValueChange, min = 0, max = 99, step = 1, label, formatValue = String, className = "" }: ValueStepperProps) {
  const [inner, setInner] = useState(defaultValue);
  const value = controlled ?? inner;
  const latest = useRef(value);
  latest.current = value;
  const timers = useRef<{ delay?: ReturnType<typeof setTimeout>; repeat?: ReturnType<typeof setInterval> }>({});

  const set = (next: number) => {
    if (next === latest.current) return false;
    latest.current = next;
    setInner(next);
    onValueChange?.(next);
    return true;
  };

  const stop = () => {
    clearTimeout(timers.current.delay);
    clearInterval(timers.current.repeat);
  };
  useEffect(() => stop, []);

  const hold = (direction: 1 | -1) => {
    stop();
    set(stepValue(latest.current, direction * step, min, max, step));
    timers.current.delay = setTimeout(() => {
      timers.current.repeat = setInterval(() => {
        if (!set(stepValue(latest.current, direction * step, min, max, step))) stop();
      }, REPEAT_EVERY);
    }, REPEAT_DELAY);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const big = Math.max(step, (max - min) / 10);
    const next: Record<string, number> = {
      ArrowUp: stepValue(value, step, min, max, step), ArrowRight: stepValue(value, step, min, max, step),
      ArrowDown: stepValue(value, -step, min, max, step), ArrowLeft: stepValue(value, -step, min, max, step),
      PageUp: stepValue(value, big, min, max, step), PageDown: stepValue(value, -big, min, max, step),
      Home: min, End: max,
    };
    if (!(e.key in next)) return;
    e.preventDefault();
    set(next[e.key]);
  };

  const button = "inline-flex size-9 items-center justify-center rounded-full bg-subtle text-fg transition-colors hover:bg-track disabled:opacity-40";

  return (
    <div role="group" aria-label={label} className={`inline-flex items-center gap-1 rounded-full bg-surface p-1 shadow-[var(--shadow-card)] ${className}`}>
      <button type="button" tabIndex={-1} aria-label={`Decrease ${label}`} disabled={value <= min} onPointerDown={() => hold(-1)} onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && set(stepValue(value, -step, min, max, step))} className={`${button} ${ring}`}>
        <Minus className="size-4" aria-hidden />
      </button>
      <div role="spinbutton" tabIndex={0} aria-label={label} aria-valuemin={min} aria-valuemax={max} aria-valuenow={value} aria-valuetext={formatValue(value)} onKeyDown={onKeyDown} className={`min-w-16 rounded-full px-2 text-center text-sm font-medium tabular-nums text-fg ${ring}`}>
        {formatValue(value)}
      </div>
      <button type="button" tabIndex={-1} aria-label={`Increase ${label}`} disabled={value >= max} onPointerDown={() => hold(1)} onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && set(stepValue(value, step, min, max, step))} className={`${button} ${ring}`}>
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  );
}
