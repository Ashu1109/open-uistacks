"use client";

import { useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "motion/react";

/* CycleCard: a sprint or cycle summary with its date range, a status chip, days left, a stacked progress bar of completed, started and remaining scope, and counts. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

export type CycleStatus = "upcoming" | "active" | "completed";

const DAY = 86_400_000;

export function cycleStatus(start: Date, end: Date, now: Date = new Date()): CycleStatus {
  if (now < start) return "upcoming";
  return now > end ? "completed" : "active";
}

/** Whole days remaining, rounded up; 0 once the cycle is over. */
export function daysLeft(end: Date, now: Date = new Date()): number {
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / DAY));
}

export function scopeShares({ completed, started, total }: { completed: number; started: number; total: number }) {
  if (total <= 0) return { done: 0, doing: 0 };
  const done = Math.min(completed / total, 1);
  return { done, doing: Math.min(started / total, 1 - done) };
}

const range = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

export interface CycleCardProps {
  name: string;
  number?: number;
  start: Date;
  end: Date;
  total: number;
  started: number;
  completed: number;
  /** Overrides "now" for the status and days left. */
  now?: Date;
  className?: string;
}

const CHIP: Record<CycleStatus, string> = {
  upcoming: "bg-subtle text-fg-muted",
  active: "bg-select-soft text-select-text",
  completed: "bg-success-soft text-success-text",
};

export function CycleCard({ name, number, start, end, total, started, completed, now, className = "" }: CycleCardProps) {
  const reduce = useReduce();
  const status = cycleStatus(start, end, now);
  const grow = { type: "spring", stiffness: 160, damping: 26 } as const;
  const { done, doing } = scopeShares({ completed, started, total });
  const pct = Math.round(done * 100);
  return (
    <motion.article initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 420, damping: 36 }} aria-label={name} className={`w-full max-w-sm rounded-[20px] bg-surface p-5 shadow-[var(--shadow-card)] ${className}`}>
      <header className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-[15px] font-semibold text-fg">{number === undefined ? name : `${name} ${number}`}</h4>
          <p className="mt-0.5 text-[13px] text-fg-muted">{range.format(start)} – {range.format(end)}</p>
        </div>
        <motion.span initial={reduce ? false : { opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 480, damping: 30, delay: 0.15 }} className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${CHIP[status]}`}>{status}</motion.span>
      </header>
      <div role="progressbar" aria-label={`${name} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="mt-4 flex h-2 overflow-hidden rounded-full bg-track">
        <motion.span initial={reduce ? false : { width: 0 }} animate={{ width: `${done * 100}%` }} transition={reduce ? { duration: 0 } : { ...grow, delay: 0.1 }} className="bg-success" />
        <motion.span initial={reduce ? false : { width: 0 }} animate={{ width: `${doing * 100}%` }} transition={reduce ? { duration: 0 } : { ...grow, delay: 0.2 }} className="bg-select" />
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
        {[["Scope", total], ["Started", started], ["Completed", completed]].map(([k, v]) => (
          <div key={k}>
            <dt className="text-fg-muted">{k}</dt>
            <dd className="mt-0.5 text-sm font-medium tabular-nums text-fg">{v}</dd>
          </div>
        ))}
      </dl>
      {status === "active" && <p className="mt-3 text-xs text-fg-muted">{`${daysLeft(end, now)} days left · ${pct}% complete`}</p>}
    </motion.article>
  );
}
