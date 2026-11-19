"use client";

import { useId, useRef, useState, useSyncExternalStore, type KeyboardEvent, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

/* Segmented control: a compact single-choice switch with a sliding highlight; it is a radio group, so arrows move and select, and Home/End jump to the ends. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface SegmentOption {
  value: string;
  label: ReactNode;
  /** Plain-text name when the label is an icon. */
  ariaLabel?: string;
  disabled?: boolean;
}

/** Next enabled option index from `from`, wrapping; -1 if none. */
export function nextEnabled(options: SegmentOption[], from: number, delta: 1 | -1): number {
  const n = options.length;
  for (let i = 1; i <= n; i++) {
    const idx = (((from + delta * i) % n) + n) % n;
    if (!options[idx].disabled) return idx;
  }
  return -1;
}

export interface SegmentedControlProps {
  options: SegmentOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  label: string;
  size?: "sm" | "md";
  className?: string;
}

export function SegmentedControl({ options, value: controlled, defaultValue, onValueChange, label, size = "md", className = "" }: SegmentedControlProps) {
  const id = useId();
  const reduce = useReduce();
  const [inner, setInner] = useState(defaultValue ?? options.find((o) => !o.disabled)?.value);
  const value = controlled ?? inner;
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const selected = options.findIndex((o) => o.value === value);

  const choose = (index: number) => {
    const o = options[index];
    if (!o || o.disabled) return;
    setInner(o.value);
    onValueChange?.(o.value);
    refs.current[index]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const at = Math.max(selected, 0);
    const map: Record<string, number> = {
      ArrowRight: nextEnabled(options, at, 1),
      ArrowDown: nextEnabled(options, at, 1),
      ArrowLeft: nextEnabled(options, at, -1),
      ArrowUp: nextEnabled(options, at, -1),
      Home: nextEnabled(options, -1, 1),
      End: nextEnabled(options, 0, -1),
    };
    if (!(e.key in map)) return;
    e.preventDefault();
    choose(map[e.key]);
  };

  return (
    <div role="radiogroup" aria-label={label} onKeyDown={onKeyDown} className={`inline-flex gap-0.5 rounded-full bg-subtle p-1 ${className}`}>
      {options.map((o, i) => {
        const on = i === selected;
        return (
          <button
            key={o.value}
            ref={(n) => {
              refs.current[i] = n;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={o.ariaLabel}
            disabled={o.disabled}
            tabIndex={on || (selected < 0 && i === 0) ? 0 : -1}
            onClick={() => choose(i)}
            className={`relative inline-flex items-center justify-center gap-1.5 rounded-full px-3.5 font-medium transition-colors disabled:opacity-40 ${size === "sm" ? "h-7 text-xs" : "h-8 text-sm"} ${on ? "text-fg" : "text-fg-muted hover:text-fg"} ${ring}`}
          >
            {on && <motion.span layoutId={`${id}-pill`} aria-hidden transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 34 }} className="absolute inset-0 rounded-full bg-surface shadow-[var(--shadow-card)] dark:bg-raised" />}
            <span className="relative inline-flex items-center gap-1.5">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
