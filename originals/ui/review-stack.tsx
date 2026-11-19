"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, X } from "lucide-react";
import { useState, useSyncExternalStore, type KeyboardEvent } from "react";

/* Review stack: AI drafts piled like cards; approve or reject the top one (buttons, or Right and Left arrows) and the next slides up, with a progress count. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface ReviewItem {
  id: string;
  title: string;
  body: string;
}

export type ReviewDecision = "approve" | "reject";

/** Decision for an arrow key, or null. */
export function decisionForKey(key: string): ReviewDecision | null {
  if (key === "ArrowRight") return "approve";
  if (key === "ArrowLeft") return "reject";
  return null;
}

export interface ReviewStackProps {
  items: ReviewItem[];
  onDecision?: (id: string, decision: ReviewDecision) => void;
  onDone?: () => void;
  className?: string;
}

export function ReviewStack({ items, onDecision, onDone, className = "" }: ReviewStackProps) {
  const reduce = useReduce();
  const [index, setIndex] = useState(0);
  const [lastExit, setLastExit] = useState<ReviewDecision>("approve");
  const remaining = items.slice(index, index + 3);
  const total = items.length;

  const decide = (decision: ReviewDecision) => {
    const top = items[index];
    if (!top) return;
    setLastExit(decision);
    setIndex(index + 1);
    onDecision?.(top.id, decision);
    if (index + 1 >= total) onDone?.();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const d = decisionForKey(e.key);
    if (d) {
      e.preventDefault();
      decide(d);
    }
  };

  if (index >= total) return <p role="status" className={`rounded-[20px] bg-subtle p-6 text-center text-sm text-fg-muted ${className}`}>All {total} reviewed</p>;

  return (
    <div role="group" aria-label="Review stack" onKeyDown={onKeyDown} className={`w-full max-w-sm ${className}`}>
      <p role="status" className="mb-2 text-xs tabular-nums text-fg-muted">{index + 1} of {total}</p>
      <div className="relative h-44">
        <AnimatePresence initial={false} custom={lastExit}>
          {remaining.map((item, depth) => (
            <motion.article
              key={item.id}
              custom={lastExit}
              tabIndex={depth === 0 ? 0 : -1}
              aria-hidden={depth > 0}
              aria-label={depth === 0 ? item.title : undefined}
              initial={false}
              animate={{ y: depth * 10, scale: 1 - depth * 0.05, opacity: 1 - depth * 0.25 }}
              exit={reduce ? { opacity: 0 } : { x: lastExit === "approve" ? 120 : -120, opacity: 0, rotate: lastExit === "approve" ? 6 : -6 }}
              transition={{ type: "spring", stiffness: 500, damping: 34 }}
              style={{ zIndex: 3 - depth }}
              className={`absolute inset-x-0 top-0 h-40 overflow-hidden rounded-[20px] bg-surface p-4 shadow-[var(--shadow-card)] ${ring}`}
            >
              <h3 className="text-sm font-medium text-fg">{item.title}</h3>
              <p className="mt-1 line-clamp-5 text-[13px] leading-5 text-fg-muted">{item.body}</p>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>
      <div className="mt-3 flex justify-center gap-3">
        <button type="button" onClick={() => decide("reject")} aria-label="Reject" className={`grid size-10 place-items-center rounded-full bg-danger-soft text-danger-text ${ring}`}><X size={18} aria-hidden /></button>
        <button type="button" onClick={() => decide("approve")} aria-label="Approve" className={`grid size-10 place-items-center rounded-full bg-success-soft text-success-text ${ring}`}><Check size={18} aria-hidden /></button>
      </div>
    </div>
  );
}
