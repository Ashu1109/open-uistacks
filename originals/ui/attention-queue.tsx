"use client";

import { useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

/* Attention queue: things agents are waiting on a human for, most severe first, each with Approve and Dismiss; resolved items animate out. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export type Severity = "high" | "medium" | "low";
export interface AttentionItem {
  id: string;
  title: string;
  reason: string;
  agent: string;
  severity: Severity;
}

const ORDER: Record<Severity, number> = { high: 0, medium: 1, low: 2 };

export function sortBySeverity(items: AttentionItem[]): AttentionItem[] {
  return [...items].sort((a, b) => ORDER[a.severity] - ORDER[b.severity]);
}

const TONE: Record<Severity, string> = { high: "bg-danger-soft text-danger-text", medium: "bg-warning-soft text-warning-text", low: "bg-subtle text-fg-muted" };

export interface AttentionQueueProps {
  items: AttentionItem[];
  onResolve?: (id: string, outcome: "approved" | "dismissed") => void;
  className?: string;
}

export function AttentionQueue({ items, onResolve, className = "" }: AttentionQueueProps) {
  const reduce = useReduce();
  const [gone, setGone] = useState<string[]>([]);
  const visible = sortBySeverity(items).filter((i) => !gone.includes(i.id));
  const resolve = (id: string, outcome: "approved" | "dismissed") => {
    setGone((g) => [...g, id]);
    onResolve?.(id, outcome);
  };
  return (
    <section aria-label="Needs your attention" className={`rounded-[16px] bg-surface p-3 shadow-[var(--shadow-card)] dark:bg-raised ${className}`}>
      <h4 className="px-1 pb-2 text-sm font-medium text-fg">Needs attention <span className="text-fg-subtle tabular-nums">({visible.length})</span></h4>
      {visible.length === 0 && <p className="px-1 py-4 text-center text-[13px] text-fg-subtle">Nothing is waiting on you.</p>}
      <ul className="space-y-2" aria-live="polite">
        <AnimatePresence initial={false}>
          {visible.map((i) => (
            <motion.li
              key={i.id}
              layout={!reduce}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, x: 24 }}
              transition={{ type: "spring", stiffness: 500, damping: 34 }}
              className="rounded-[12px] bg-subtle p-3"
            >
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${TONE[i.severity]}`}>{i.severity}</span>
                <span className="text-[13px] font-medium text-fg">{i.title}</span>
              </div>
              <p className="mt-1 text-xs text-fg-muted">{i.agent}: {i.reason}</p>
              <div className="mt-2 flex gap-2">
                <button type="button" aria-label={`Approve ${i.title}`} onClick={() => resolve(i.id, "approved")} className={`h-7 rounded-[8px] bg-success-soft px-2.5 text-xs text-success-text ${ring}`}>Approve</button>
                <button type="button" aria-label={`Dismiss ${i.title}`} onClick={() => resolve(i.id, "dismissed")} className={`h-7 rounded-[8px] px-2.5 text-xs text-fg-muted hover:bg-track ${ring}`}>Dismiss</button>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </section>
  );
}
