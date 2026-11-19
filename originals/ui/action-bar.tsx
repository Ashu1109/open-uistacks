"use client";

import { useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X, type LucideIcon } from "lucide-react";

/* Action bar: a floating toolbar that appears when rows are selected, showing the count and bulk actions; arrow keys move between buttons (roving tab stop). */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export function wrapIndex(index: number, delta: number, length: number): number {
  return length === 0 ? -1 : (((index + delta) % length) + length) % length;
}

export function selectionLabel(count: number, noun = "selected"): string {
  return `${count} ${noun}`;
}

export interface ActionBarItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  onSelect: () => void;
  destructive?: boolean;
}

export interface ActionBarProps {
  items: ActionBarItem[];
  /** Selected count; the bar is hidden at 0. */
  count: number;
  onDismiss?: () => void;
  className?: string;
}

export function ActionBar({ items, count, onDismiss, className = "" }: ActionBarProps) {
  const reduce = useReduce();
  const [focus, setFocus] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const total = items.length + (onDismiss ? 1 : 0);

  const onKeyDown = (e: KeyboardEvent) => {
    const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    const edge = e.key === "Home" ? 0 : e.key === "End" ? total - 1 : -1;
    if (!delta && edge < 0) return;
    e.preventDefault();
    const next = edge >= 0 ? edge : wrapIndex(focus, delta, total);
    setFocus(next);
    refs.current[next]?.focus();
  };

  const button = (i: number) => ({
    ref: (n: HTMLButtonElement | null) => {
      refs.current[i] = n;
    },
    tabIndex: i === focus ? 0 : -1,
    onFocus: () => setFocus(i),
  });

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          role="toolbar"
          aria-label="Selection actions"
          onKeyDown={onKeyDown}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 500, damping: 34 }}
          className={`inline-flex items-center gap-1 rounded-full bg-surface p-1.5 shadow-[var(--shadow-overlay)] dark:bg-raised ${className}`}
        >
          <span aria-live="polite" className="px-3 text-sm font-medium tabular-nums text-fg">{selectionLabel(count)}</span>
          <span aria-hidden className="h-5 w-px bg-track" />
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              {...button(i)}
              onClick={item.onSelect}
              className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm hover:bg-[color-mix(in_srgb,var(--fg)_4%,var(--surface))] ${item.destructive ? "text-danger-text" : "text-fg"} ${ring}`}
            >
              {item.icon && <item.icon className="size-4" aria-hidden />}
              {item.label}
            </button>
          ))}
          {onDismiss && (
            <button type="button" aria-label="Clear selection" {...button(items.length)} onClick={onDismiss} className={`inline-flex size-8 items-center justify-center rounded-full text-fg-muted hover:bg-subtle ${ring}`}>
              <X className="size-4" aria-hidden />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
