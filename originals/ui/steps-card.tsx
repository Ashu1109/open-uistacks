"use client";

import { useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "motion/react";

/* StepsCard: a numbered, vertical list of steps joined by a line; steps before `current` show a check, the current one is highlighted. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

export type StepState = "done" | "current" | "upcoming";

export function stepState(index: number, current: number): StepState {
  if (index < current) return "done";
  return index === current ? "current" : "upcoming";
}

export interface Step {
  title: string;
  description?: string;
}

export interface StepsCardProps {
  steps: readonly Step[];
  /** Zero-based index of the active step; omit for a plain numbered list. */
  current?: number;
  title?: string;
  className?: string;
}

export function StepsCard({ steps, current = -1, title, className = "" }: StepsCardProps) {
  const reduce = useReduce();
  return (
    <section aria-label={title ?? "Steps"} className={`w-full max-w-md rounded-[20px] bg-surface p-6 shadow-[var(--shadow-card)] ${className}`}>
      {title && <h4 className="mb-4 text-[15px] font-semibold text-fg">{title}</h4>}
      <ol>
        {steps.map((step, i) => {
          const state = stepState(i, current);
          const last = i === steps.length - 1;
          return (
            <motion.li key={step.title} initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 480, damping: 34, delay: i * 0.06 }} aria-current={state === "current" ? "step" : undefined} className="relative flex gap-3 pb-6 last:pb-0">
              {!last && (
                <span aria-hidden className="absolute left-[13px] top-7 h-[calc(100%-1.75rem)] w-px overflow-hidden bg-track">
                  <motion.span initial={reduce ? false : { scaleY: 0 }} animate={{ scaleY: state === "done" ? 1 : 0 }} transition={{ duration: 0.4, ease: "easeOut", delay: i * 0.06 + 0.2 }} style={{ transformOrigin: "top" }} className="block size-full bg-select" />
                </span>
              )}
              <span aria-hidden className={`z-10 grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold transition-colors duration-300 ${state === "done" ? "bg-select text-white" : state === "current" ? "bg-select-soft text-select-text ring-2 ring-[var(--select)]" : "bg-subtle text-fg-muted"}`}>
                {state === "done" ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><motion.path initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3, ease: "easeOut", delay: i * 0.06 + 0.1 }} d="M20 6 9 17l-5-5" /></svg>
                ) : i + 1}
              </span>
              <div className="pt-0.5">
                <p className={`text-sm font-medium ${state === "upcoming" ? "text-fg-muted" : "text-fg"}`}>
                  {step.title}
                  {state === "done" && <span className="sr-only"> (completed)</span>}
                </p>
                {step.description && <p className="mt-0.5 text-[13px] leading-[18px] text-fg-muted">{step.description}</p>}
              </div>
            </motion.li>
          );
        })}
      </ol>
    </section>
  );
}
