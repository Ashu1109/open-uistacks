"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { animate, motion, useReducedMotion } from "motion/react";
import { Check } from "lucide-react";

/* Order tracker: a vertical list of fulfilment steps with done, current and upcoming states, optional timestamps, and a "Step n of m" summary for screen readers. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const spring = { type: "spring", stiffness: 480, damping: 34 } as const;

/** A percentage that tweens between values; React renders the final text, frames overwrite it until the tween lands. */
function Percent({ value, reduce }: { value: number; reduce: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef(value);
  useEffect(() => {
    if (reduce || shown.current === value) {
      shown.current = value;
      return;
    }
    const controls = animate(shown.current, value, {
      duration: 0.5,
      ease: "easeOut",
      onUpdate: (v) => {
        shown.current = v;
        if (ref.current) ref.current.textContent = `${Math.round(v)}%`;
      },
      onComplete: () => { shown.current = value; },
    });
    return () => controls.stop();
  }, [value, reduce]);
  return <span ref={ref}>{value}%</span>;
}

export interface TrackerStep {
  id: string;
  label: string;
  detail?: string;
  /** Display text such as "Nov 12, 9:41 AM". */
  at?: string;
}

export interface OrderTrackerProps {
  steps: TrackerStep[];
  /** Index of the step in progress; all steps before it are done, and steps.length means everything is done. */
  current: number;
  className?: string;
}

export type StepStatus = "done" | "current" | "upcoming";

export function stepStatus(index: number, current: number): StepStatus {
  return index < current ? "done" : index === current ? "current" : "upcoming";
}

/** Completed share of the journey, 0 to 100. */
export function orderProgress(total: number, current: number): number {
  return total > 0 ? Math.round((Math.min(Math.max(current, 0), total) / total) * 100) : 0;
}

export function OrderTracker({ steps, current, className = "" }: OrderTrackerProps) {
  const reduce = useReduce();
  const finished = current >= steps.length;
  return (
    <div className={`grid gap-3 ${className}`}>
      <p role="status" className="text-sm font-medium text-fg">
        {finished ? "Delivered" : `Step ${current + 1} of ${steps.length}: ${steps[current]?.label}`}
        <span className="ml-2 font-normal tabular-nums text-fg-subtle"><Percent value={orderProgress(steps.length, current)} reduce={reduce} /></span>
      </p>
      <ol aria-label="Order progress" className="grid">
        {steps.map((s, i) => {
          const status = stepStatus(i, current);
          return (
            <motion.li key={s.id} initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: i * 0.05 }} aria-current={status === "current" ? "step" : undefined} className="relative flex gap-3 pb-6 last:pb-0">
              {i < steps.length - 1 && (
                <span aria-hidden className="absolute bottom-0 left-[11px] top-6 w-0.5 overflow-hidden bg-track">
                  <motion.span initial={false} animate={{ scaleY: status === "done" ? 1 : 0 }} transition={reduce ? { duration: 0 } : { duration: 0.4, ease: "easeOut" }} style={{ transformOrigin: "top" }} className="block size-full bg-success" />
                </span>
              )}
              <motion.span initial={false} animate={{ scale: reduce ? 1 : status === "current" ? 1.08 : 1 }} transition={spring} className={`relative grid size-6 shrink-0 place-items-center rounded-full text-xs transition-colors duration-300 ${status === "done" ? "bg-success text-white" : status === "current" ? "bg-select-soft text-select-text shadow-[0_0_0_2px_var(--select)]" : "bg-subtle text-fg-subtle"}`}>
                {status === "current" && !reduce && <motion.span aria-hidden initial={{ opacity: 0.5, scale: 1 }} animate={{ opacity: 0, scale: 1.8 }} transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }} className="absolute inset-0 rounded-full bg-[var(--select)]" />}
                {status === "done" ? <motion.span initial={reduce ? false : { scale: 0 }} animate={{ scale: 1 }} transition={spring} className="grid"><Check size={13} strokeWidth={3} aria-hidden /></motion.span> : <span aria-hidden>{i + 1}</span>}
              </motion.span>
              <div className="min-w-0 pt-0.5">
                <p className={`text-sm font-medium ${status === "upcoming" ? "text-fg-subtle" : "text-fg"}`}>
                  {s.label}<span className="sr-only">, {status === "done" ? "completed" : status === "current" ? "in progress" : "upcoming"}</span>
                </p>
                {(s.at || s.detail) && <p className="text-xs text-fg-muted">{[s.at, s.detail].filter(Boolean).join(" · ")}</p>}
              </div>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
