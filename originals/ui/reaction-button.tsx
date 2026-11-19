"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

/* Reaction button: an emoji toggle with a running count; reacting pops the emoji and releases a small burst of particles, and the count rolls to its new value. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

/** 999, 1.2k, 15k. */
export function formatCount(n: number): string {
  if (n < 1000) return String(Math.max(0, Math.round(n)));
  const k = n / 1000;
  return `${k < 10 ? k.toFixed(1).replace(/\.0$/, "") : Math.round(k)}k`;
}

export function burstOffsets(count: number, radius: number): { x: number; y: number }[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    return { x: Math.round(Math.cos(angle) * radius), y: Math.round(Math.sin(angle) * radius) };
  });
}

export interface ReactionButtonProps {
  /** The emoji or icon shown on the button. */
  emoji: ReactNode;
  /** Accessible name of the reaction, e.g. "Love". */
  label: string;
  /** Count excluding the viewer's own reaction. */
  count?: number;
  pressed?: boolean;
  defaultPressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  className?: string;
}

const PARTICLES = burstOffsets(8, 22);

export function ReactionButton({ emoji, label, count = 0, pressed: controlled, defaultPressed = false, onPressedChange, className = "" }: ReactionButtonProps) {
  const reduce = useReduce();
  const [inner, setInner] = useState(defaultPressed);
  const [burst, setBurst] = useState(0);
  const pressed = controlled ?? inner;
  const total = count + (pressed ? 1 : 0);

  const toggle = () => {
    const next = !pressed;
    setInner(next);
    onPressedChange?.(next);
    if (next) setBurst((b) => b + 1);
  };

  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={`${label}, ${total} reactions`}
      onClick={toggle}
      className={`relative inline-flex h-9 items-center gap-2 rounded-full px-3 text-sm tabular-nums transition-colors ${pressed ? "bg-select-soft text-select-text" : "bg-subtle text-fg-muted hover:bg-track"} ${ring} ${className}`}
    >
      <motion.span key={burst} className="relative inline-flex text-base leading-none" initial={false} animate={reduce || burst === 0 ? undefined : { scale: [1, 1.5, 1] }} transition={{ duration: 0.3 }}>
        {emoji}
        {!reduce && burst > 0 && pressed && (
          <span aria-hidden className="pointer-events-none absolute left-1/2 top-1/2">
            {PARTICLES.map((p, i) => (
              <motion.span key={i} className="absolute size-1 rounded-full bg-select" initial={{ x: 0, y: 0, opacity: 1 }} animate={{ x: p.x, y: p.y, opacity: 0 }} transition={{ duration: 0.5, ease: "easeOut" }} />
            ))}
          </span>
        )}
      </motion.span>
      <span className="relative inline-flex h-5 overflow-hidden" aria-hidden>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={total} initial={reduce ? { opacity: 0 } : { y: pressed ? 12 : -12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={reduce ? { opacity: 0 } : { y: pressed ? -12 : 12, opacity: 0 }} transition={{ type: "spring", stiffness: 500, damping: 34 }} className="leading-5">
            {formatCount(total)}
          </motion.span>
        </AnimatePresence>
      </span>
    </button>
  );
}
