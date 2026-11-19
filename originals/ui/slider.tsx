"use client";

import { useRef, useState, useSyncExternalStore, type KeyboardEvent, type PointerEvent } from "react";
import { motion, useReducedMotion } from "motion/react";

/* Slider: a single-value slider following the ARIA slider pattern, with drag, arrows, PageUp/PageDown, Home/End, optional tick marks and a live value readout. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const follow = { type: "spring", stiffness: 600, damping: 40 } as const;

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

function decimals(step: number): number {
  const s = String(step);
  return s.includes(".") ? s.split(".")[1].length : 0;
}

/** Snap to the nearest step from min, clamped to [min, max], free of float noise. */
export function snapToStep(value: number, min: number, max: number, step: number): number {
  const stepped = min + Math.round((value - min) / step) * step;
  return Number(Math.min(Math.max(stepped, min), max).toFixed(decimals(step)));
}

export function ratioOf(value: number, min: number, max: number): number {
  return max === min ? 0 : (Math.min(Math.max(value, min), max) - min) / (max - min);
}

export interface SliderProps {
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  label: string;
  /** Format the value for the readout and screen readers. */
  formatValue?: (value: number) => string;
  /** Show a tick every `step * marks` units. */
  marks?: number;
  showValue?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Slider({ min = 0, max = 100, step = 1, value: controlled, defaultValue = min, onValueChange, label, formatValue = String, marks, showValue = true, disabled = false, className = "" }: SliderProps) {
  const reduce = useReduce();
  const [inner, setInner] = useState(defaultValue);
  const value = snapToStep(controlled ?? inner, min, max, step);
  const track = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const pct = ratioOf(value, min, max) * 100;

  const set = (next: number) => {
    const snapped = snapToStep(next, min, max, step);
    if (snapped === value) return;
    setInner(snapped);
    onValueChange?.(snapped);
  };

  const fromPointer = (e: PointerEvent) => {
    const rect = track.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    set(min + ((e.clientX - rect.left) / rect.width) * (max - min));
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const big = Math.max(step, (max - min) / 10);
    const next: Record<string, number> = {
      ArrowRight: value + step, ArrowUp: value + step, ArrowLeft: value - step, ArrowDown: value - step,
      PageUp: value + big, PageDown: value - big, Home: min, End: max,
    };
    if (!(e.key in next)) return;
    e.preventDefault();
    set(next[e.key]);
  };

  const tickCount = marks ? Math.floor((max - min) / (step * marks)) : 0;

  return (
    <div className={`w-72 ${disabled ? "opacity-50" : ""} ${className}`}>
      <div className="mb-2 flex items-baseline justify-between text-sm">
        <span className="font-medium text-fg">{label}</span>
        {showValue && <motion.span key={formatValue(value)} className="tabular-nums text-fg-muted" initial={reduce ? false : { opacity: 0.4, y: -2 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.12 }}>{formatValue(value)}</motion.span>}
      </div>
      <div
        ref={track}
        onPointerDown={(e) => {
          if (disabled) return;
          dragging.current = true;
          e.currentTarget.setPointerCapture?.(e.pointerId);
          fromPointer(e);
        }}
        onPointerMove={(e) => dragging.current && fromPointer(e)}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
        className="relative flex h-6 cursor-pointer touch-none items-center"
      >
        <div className="h-1.5 w-full rounded-full bg-track">
          <motion.div className="h-full rounded-full bg-[var(--select)]" initial={false} animate={{ width: `${pct}%` }} transition={reduce ? { duration: 0 } : follow} />
        </div>
        {Array.from({ length: tickCount + 1 }, (_, i) => (
          <span key={i} aria-hidden className="absolute top-[calc(50%+8px)] h-1 w-px bg-track-strong" style={{ left: `${((i * step * (marks ?? 1)) / (max - min)) * 100}%` }} />
        ))}
        <motion.div
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={formatValue(value)}
          aria-disabled={disabled}
          onKeyDown={onKeyDown}
          initial={false}
          animate={{ left: `${pct}%` }}
          whileHover={reduce || disabled ? undefined : { scale: 1.12 }}
          whileTap={reduce || disabled ? undefined : { scale: 1.25 }}
          transition={reduce ? { duration: 0 } : follow}
          className={`absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-surface shadow-[var(--shadow-card)] ring-2 ring-[var(--select)] ${ring}`}
        />
      </div>
    </div>
  );
}
