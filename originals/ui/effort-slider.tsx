"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

/* Effort slider: a stepped slider for how hard the model should think (Low to Max); arrows, Home and End step it, and each stop is clickable. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export const DEFAULT_LEVELS = ["Low", "Medium", "High", "Max"];

/** The index a key press moves to, or null for keys the slider ignores. */
export function stepEffort(index: number, key: string, count: number): number | null {
  const last = count - 1;
  if (key === "ArrowRight" || key === "ArrowUp") return Math.min(index + 1, last);
  if (key === "ArrowLeft" || key === "ArrowDown") return Math.max(index - 1, 0);
  if (key === "Home") return 0;
  if (key === "End") return last;
  return null;
}

/** Nearest stop for a pointer at `x` inside a track spanning `left` to `left + width`. */
export function indexFromPointer(x: number, left: number, width: number, count: number): number {
  if (width <= 0 || count < 2) return 0;
  return Math.round(Math.min(Math.max((x - left) / width, 0), 1) * (count - 1));
}

export interface EffortSliderProps {
  /** Selected stop index. */
  value?: number;
  defaultValue?: number;
  onValueChange?: (index: number) => void;
  levels?: string[];
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function EffortSlider({ value: valueProp, defaultValue = 1, onValueChange, levels = DEFAULT_LEVELS, label = "Effort", disabled = false, className = "" }: EffortSliderProps) {
  const track = useRef<HTMLDivElement>(null);
  const [inner, setInner] = useState(defaultValue);
  const value = Math.min(Math.max(valueProp ?? inner, 0), levels.length - 1);
  const pct = levels.length > 1 ? (value / (levels.length - 1)) * 100 : 0;

  const set = (next: number) => {
    if (next === value) return;
    if (valueProp === undefined) setInner(next);
    onValueChange?.(next);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const next = stepEffort(value, e.key, levels.length);
    if (next === null) return;
    e.preventDefault();
    set(next);
  };

  const onPointer = (e: PointerEvent) => {
    const box = track.current?.getBoundingClientRect();
    if (box) set(indexFromPointer(e.clientX, box.left, box.width, levels.length));
  };

  return (
    <div className={`w-full max-w-xs ${disabled ? "opacity-50" : ""} ${className}`}>
      <div className="mb-2 flex items-baseline justify-between text-[13px]">
        <span className="font-medium text-fg">{label}</span>
        <span aria-hidden className="text-fg-muted">{levels[value]}</span>
      </div>
      <div
        ref={track}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={levels.length - 1}
        aria-valuenow={value}
        aria-valuetext={levels[value]}
        aria-disabled={disabled}
        onKeyDown={disabled ? undefined : onKeyDown}
        onPointerDown={disabled ? undefined : (e) => { e.currentTarget.setPointerCapture?.(e.pointerId); onPointer(e); }}
        onPointerMove={disabled ? undefined : (e) => { if (e.buttons === 1) onPointer(e); }}
        className={`relative mx-2 h-6 cursor-pointer touch-none rounded-full ${ring}`}
      >
        <span className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-track" />
        <span className="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-select transition-[width]" style={{ width: `${pct}%` }} />
        {levels.map((l, i) => (
          <span key={l} aria-hidden className={`absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${i <= value ? "bg-[var(--inverse-fg)]" : "bg-track-strong"}`} style={{ left: `${(i / Math.max(levels.length - 1, 1)) * 100}%` }} />
        ))}
        <span className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-surface shadow-[var(--shadow-card)] transition-[left]" style={{ left: `${pct}%` }} />
      </div>
      <div aria-hidden className="mx-2 mt-1.5 flex justify-between text-xs text-fg-subtle">
        {levels.map((l) => <span key={l}>{l}</span>)}
      </div>
    </div>
  );
}
