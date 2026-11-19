"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { motion, useReducedMotion } from "motion/react";

/* Hold to confirm: a destructive-action button that only fires after being held for a set time, with a fill that drains back if released early; Space and Enter work too. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const spring = { type: "spring", stiffness: 480, damping: 34 } as const;

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export function holdProgress(elapsedMs: number, durationMs: number): number {
  if (durationMs <= 0) return 1;
  return Math.min(Math.max(elapsedMs / durationMs, 0), 1);
}

export interface HoldToConfirmProps {
  onConfirm: () => void;
  /** Milliseconds the press must last. */
  duration?: number;
  label?: string;
  confirmedLabel?: string;
  className?: string;
}

const TICK_MS = 16;

export function HoldToConfirm({ onConfirm, duration = 1200, label = "Hold to delete", confirmedLabel = "Deleted", className = "" }: HoldToConfirmProps) {
  const reduce = useReduce();
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const holding = useRef(false);
  const stop = useCallback(() => {
    clearInterval(timer.current);
    timer.current = undefined;
  }, []);
  useEffect(() => stop, [stop]);

  const start = () => {
    if (holding.current || done) return;
    holding.current = true;
    const began = Date.now();
    stop();
    timer.current = setInterval(() => {
      const p = holdProgress(Date.now() - began, duration);
      setProgress(p);
      if (p >= 1) {
        stop();
        holding.current = false;
        setDone(true);
        onConfirm();
      }
    }, TICK_MS);
  };

  const release = () => {
    if (!holding.current) return;
    holding.current = false;
    stop();
    const drain = setInterval(() => {
      setProgress((p) => {
        const next = Math.max(p - 0.08, 0);
        if (next === 0) clearInterval(drain);
        return next;
      });
    }, TICK_MS);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if ((e.key === " " || e.key === "Enter") && !e.repeat) {
      e.preventDefault();
      start();
    }
  };
  const onKeyUp = (e: KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") release();
  };

  return (
    <>
      <motion.button
        type="button"
        whileTap={reduce || done ? undefined : { scale: 0.97 }}
        animate={done && !reduce ? { scale: [1, 1.06, 1] } : { scale: 1 }}
        transition={{ duration: 0.3 }}
        onPointerDown={start}
        onPointerUp={release}
        onPointerLeave={release}
        onPointerCancel={release}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onBlur={release}
        aria-disabled={done}
        className={`relative inline-flex h-10 select-none items-center justify-center overflow-hidden rounded-full bg-danger-soft px-5 text-sm font-medium text-danger-text ${ring} ${className}`}
      >
        <motion.span aria-hidden className="absolute inset-0 origin-left bg-danger/30" initial={false} animate={{ scaleX: done ? 1 : progress, opacity: done ? 0.5 : 1 }} transition={{ duration: reduce ? 0 : 0.05, ease: "linear" }} />
        <motion.span key={done ? "done" : "idle"} className="relative" initial={reduce ? false : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>{done ? confirmedLabel : label}</motion.span>
      </motion.button>
      <span role="status" className="sr-only">{done ? confirmedLabel : ""}</span>
    </>
  );
}
