"use client";

import { useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { History } from "lucide-react";

/* Restore points: checkpoints an agent saved along the way; Restore asks for a second click to confirm before rolling back, and the newest is marked current. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}
const spring = { type: "spring", stiffness: 480, damping: 36 } as const;

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface RestorePoint {
  id: string;
  label: string;
  at: string;
  summary?: string;
}

export interface RestorePointsProps {
  points: RestorePoint[];
  onRestore?: (id: string) => void;
  className?: string;
}

export function RestorePoints({ points, onRestore, className = "" }: RestorePointsProps) {
  const [confirming, setConfirming] = useState<string | null>(null);
  const reduce = useReduce();
  const swap = reduce ? { opacity: 1 } : { opacity: 0, scale: 0.92 };
  return (
    <section aria-label="Restore points" className={`rounded-[16px] bg-surface p-2 shadow-[var(--shadow-card)] dark:bg-raised ${className}`}>
      <ul>
        {points.map((p, i) => (
          <motion.li key={p.id} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: i * 0.05 }} className="flex items-center gap-3 rounded-[12px] px-3 py-2.5 transition-colors hover:bg-[color-mix(in_srgb,var(--fg)_4%,var(--surface))]">
            <History size={14} aria-hidden className="shrink-0 text-fg-subtle" />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] text-fg">{p.label}{i === 0 && <motion.span initial={reduce ? false : { opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ ...spring, delay: 0.15 }} className="ml-2 inline-block rounded-full bg-select-soft px-1.5 py-0.5 text-[11px] text-select-text">Current</motion.span>}</p>
              <p className="text-xs text-fg-subtle">{p.at}{p.summary && ` · ${p.summary}`}</p>
            </div>
            {i > 0 && onRestore && (
              <span className="relative flex">
                <AnimatePresence mode="popLayout" initial={false}>
                {confirming === p.id ? (
              <motion.span key="confirm" initial={swap} animate={{ opacity: 1, scale: 1 }} exit={swap} transition={{ duration: 0.15 }} className="flex gap-1">
                <button type="button" autoFocus aria-label={`Confirm restore to ${p.label}`} onClick={() => { onRestore(p.id); setConfirming(null); }} className={`h-7 rounded-[8px] bg-danger-soft px-2 text-xs text-danger-text transition-colors hover:brightness-95 active:scale-95 ${ring}`}>Confirm</button>
                <button type="button" onClick={() => setConfirming(null)} className={`h-7 rounded-[8px] px-2 text-xs text-fg-muted transition-colors hover:bg-subtle active:scale-95 ${ring}`}>Cancel</button>
              </motion.span>
            ) : (
              <motion.span key="restore" initial={swap} animate={{ opacity: 1, scale: 1 }} exit={swap} transition={{ duration: 0.15 }}>
              <button type="button" aria-label={`Restore ${p.label}`} onClick={() => setConfirming(p.id)} className={`h-7 rounded-[8px] px-2 text-xs text-fg transition-colors hover:bg-subtle active:scale-95 ${ring}`}>Restore</button>
              </motion.span>
            )}
                </AnimatePresence>
              </span>
            )}
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
