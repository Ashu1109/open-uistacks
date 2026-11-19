"use client";

import { useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";

/* Relay timeline: the chain of handoffs between agents on a task, newest last, each showing who passed what to whom and when. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}
const spring = { type: "spring", stiffness: 480, damping: 36 } as const;

export interface RelayEvent {
  id: string;
  from: string;
  to: string;
  message: string;
  at: string;
}

/** Distinct agents in order of first appearance. */
export function participants(events: RelayEvent[]): string[] {
  const seen: string[] = [];
  for (const e of events) for (const n of [e.from, e.to]) if (!seen.includes(n)) seen.push(n);
  return seen;
}

export interface RelayTimelineProps {
  events: RelayEvent[];
  className?: string;
}

export function RelayTimeline({ events, className = "" }: RelayTimelineProps) {
  const names = participants(events);
  const reduce = useReduce();
  return (
    <section aria-label="Handoffs" className={`rounded-[16px] bg-surface p-4 shadow-[var(--shadow-card)] dark:bg-raised ${className}`}>
      <p className="mb-3 text-xs text-fg-subtle">{events.length} handoffs across {names.length} agents</p>
      <ol className="relative space-y-4 border-l border-track pl-5">
        {events.map((e, i) => (
          <motion.li key={e.id} initial={reduce ? false : { opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ ...spring, delay: i * 0.06 }} className="relative">
            <motion.span aria-hidden initial={reduce ? false : { scale: 0 }} animate={{ scale: 1 }} transition={{ ...spring, delay: 0.05 + i * 0.06 }} className="absolute -left-[25px] top-1.5 size-2 rounded-full bg-select ring-4 ring-surface dark:ring-raised" />
            <p className="flex flex-wrap items-center gap-1.5 text-[13px] font-medium text-fg">
              {e.from}<ArrowRight size={12} aria-hidden className="text-fg-subtle" /><span className="sr-only">hands off to</span>{e.to}
              <time className="ml-auto text-xs font-normal tabular-nums text-fg-subtle">{e.at}</time>
            </p>
            <p className="mt-0.5 text-xs text-fg-muted">{e.message}</p>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}
