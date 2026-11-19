"use client";

import { useRef, useState, useSyncExternalStore, type KeyboardEvent, type PointerEvent } from "react";
import { motion, useReducedMotion } from "motion/react";

/* Histogram range: a distribution of buckets over a two-thumb range slider; bars inside the chosen range are highlighted and the readout shows how many items fall inside. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const follow = { type: "spring", stiffness: 600, damping: 40 } as const;

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export type Range = readonly [number, number];

export function clampRange(range: Range, min: number, max: number, minGap = 0): [number, number] {
  const lo = Math.min(Math.max(range[0], min), max - minGap);
  const hi = Math.max(Math.min(range[1], max), lo + minGap);
  return [lo, hi];
}

/** Sum of the buckets whose span overlaps the range; buckets split `[min, max]` evenly. */
export function countInRange(bins: number[], min: number, max: number, range: Range): number {
  const width = (max - min) / bins.length;
  return bins.reduce((sum, count, i) => {
    const start = min + i * width;
    return start + width > range[0] && start < range[1] ? sum + count : sum;
  }, 0);
}

export interface HistogramRangeProps {
  /** Bucket counts, evenly spaced across min..max. */
  bins: number[];
  min: number;
  max: number;
  step?: number;
  value?: Range;
  defaultValue?: Range;
  onValueChange?: (range: [number, number]) => void;
  label?: string;
  formatValue?: (value: number) => string;
  className?: string;
}

export function HistogramRange({ bins, min, max, step = 1, value: controlled, defaultValue, onValueChange, label = "Range", formatValue = String, className = "" }: HistogramRangeProps) {
  const reduce = useReduce();
  const [inner, setInner] = useState<Range>(defaultValue ?? [min, max]);
  const [lo, hi] = clampRange(controlled ?? inner, min, max, step);
  const track = useRef<HTMLDivElement>(null);
  const active = useRef<0 | 1 | null>(null);
  const peak = Math.max(...bins, 1);
  const pct = (v: number) => ((v - min) / (max - min)) * 100;
  const width = (max - min) / bins.length;

  const set = (thumb: 0 | 1, raw: number) => {
    const snapped = min + Math.round((raw - min) / step) * step;
    const next = clampRange(thumb === 0 ? [Math.min(snapped, hi - step), hi] : [lo, Math.max(snapped, lo + step)], min, max, step);
    setInner(next);
    onValueChange?.(next);
  };

  const fromPointer = (e: PointerEvent, thumb: 0 | 1) => {
    const rect = track.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    set(thumb, min + ((e.clientX - rect.left) / rect.width) * (max - min));
  };

  const onKeyDown = (thumb: 0 | 1) => (e: KeyboardEvent) => {
    const current = thumb === 0 ? lo : hi;
    const big = Math.max(step, (max - min) / 10);
    const next: Record<string, number> = {
      ArrowRight: current + step, ArrowUp: current + step, ArrowLeft: current - step, ArrowDown: current - step,
      PageUp: current + big, PageDown: current - big, Home: min, End: max,
    };
    if (!(e.key in next)) return;
    e.preventDefault();
    set(thumb, next[e.key]);
  };

  const thumb = (which: 0 | 1, value: number, bound: Range) => (
    <motion.div
      role="slider"
      tabIndex={0}
      aria-label={which === 0 ? `${label} minimum` : `${label} maximum`}
      aria-valuemin={bound[0]}
      aria-valuemax={bound[1]}
      aria-valuenow={value}
      aria-valuetext={formatValue(value)}
      onKeyDown={onKeyDown(which)}
      initial={false}
      animate={{ left: `${pct(value)}%` }}
      whileHover={reduce ? undefined : { scale: 1.12 }}
      whileTap={reduce ? undefined : { scale: 1.25 }}
      transition={reduce ? { duration: 0 } : follow}
      className={`absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-surface shadow-[var(--shadow-card)] ring-2 ring-[var(--select)] ${ring}`}
    />
  );

  return (
    <div className={`w-80 ${className}`}>
      <div className="mb-2 flex items-baseline justify-between text-sm">
        <span className="font-medium text-fg">{formatValue(lo)} to {formatValue(hi)}</span>
        <span aria-live="polite" className="tabular-nums text-fg-muted">{countInRange(bins, min, max, [lo, hi])} results</span>
      </div>
      <div aria-hidden className="flex h-16 items-end gap-[2px]">
        {bins.map((count, i) => {
          const start = min + i * width;
          const inside = start + width > lo && start < hi;
          return <motion.div key={i} className={`flex-1 rounded-t-[3px] transition-colors duration-200 ${inside ? "bg-[var(--select)]" : "bg-track"}`} initial={reduce ? false : { height: "4%" }} animate={{ height: `${Math.max((count / peak) * 100, 4)}%` }} transition={reduce ? { duration: 0 } : { ...follow, delay: i * 0.015 }} />;
        })}
      </div>
      <div
        ref={track}
        onPointerDown={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const at = min + ((e.clientX - rect.left) / (rect.width || 1)) * (max - min);
          active.current = Math.abs(at - lo) <= Math.abs(at - hi) ? 0 : 1;
          e.currentTarget.setPointerCapture?.(e.pointerId);
          fromPointer(e, active.current);
        }}
        onPointerMove={(e) => active.current !== null && fromPointer(e, active.current)}
        onPointerUp={() => (active.current = null)}
        onPointerCancel={() => (active.current = null)}
        className="relative mt-1 h-6 cursor-pointer touch-none"
      >
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-track" />
        <motion.div className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-[var(--select)]" initial={false} animate={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }} transition={reduce ? { duration: 0 } : follow} />
        {thumb(0, lo, [min, hi - step])}
        {thumb(1, hi, [lo + step, max])}
      </div>
    </div>
  );
}
