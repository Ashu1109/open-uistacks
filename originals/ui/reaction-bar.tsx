"use client";

import { useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { SmilePlus } from "lucide-react";

/* Reaction bar: emoji pills with counts that toggle your own reaction, plus a small picker to add a new one. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface Reaction {
  emoji: string;
  count: number;
  /** Whether the current user has reacted. */
  reacted: boolean;
}

export interface ReactionBarProps {
  reactions: Reaction[];
  onToggle?: (emoji: string) => void;
  /** Emoji offered by the add button. */
  palette?: string[];
  className?: string;
}

/** Flips your reaction on one emoji, adding it when absent and dropping it when the count reaches zero. */
export function toggleReaction(reactions: Reaction[], emoji: string): Reaction[] {
  const found = reactions.find((r) => r.emoji === emoji);
  if (!found) return [...reactions, { emoji, count: 1, reacted: true }];
  return reactions
    .map((r) => (r.emoji === emoji ? { ...r, reacted: !r.reacted, count: r.count + (r.reacted ? -1 : 1) } : r))
    .filter((r) => r.count > 0);
}

export function ReactionBar({ reactions, onToggle, palette = ["👍", "❤️", "🎉", "😄", "👀", "🚀"], className = "" }: ReactionBarProps) {
  const reduce = useReduce();
  const [open, setOpen] = useState(false);
  return (
    <div role="group" aria-label="Reactions" className={`relative flex flex-wrap items-center gap-1.5 ${className}`}>
      <AnimatePresence initial={false}>
        {reactions.map((r) => (
          <motion.button
            key={r.emoji}
            type="button"
            layout={!reduce}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 500, damping: 34 }}
            aria-pressed={r.reacted}
            aria-label={`${r.emoji} ${r.count}`}
            onClick={() => onToggle?.(r.emoji)}
            className={`flex h-7 items-center gap-1.5 rounded-full px-2.5 text-sm tabular-nums ${r.reacted ? "bg-select-soft text-select-text shadow-[0_0_0_1px_var(--select)]" : "bg-subtle text-fg-muted hover:text-fg"} ${ring}`}
          >
            <span aria-hidden>{r.emoji}</span>
            {r.count}
          </motion.button>
        ))}
      </AnimatePresence>
      <button
        type="button"
        aria-label="Add reaction"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        className={`grid size-7 place-items-center rounded-full bg-subtle text-fg-muted hover:text-fg ${ring}`}
      >
        <SmilePlus size={15} aria-hidden />
      </button>
      {open && (
        <div role="group" aria-label="Pick a reaction" onKeyDown={(e) => e.key === "Escape" && setOpen(false)} className="absolute left-0 top-full z-10 mt-2 flex gap-1 rounded-[14px] bg-surface p-1.5 shadow-[var(--shadow-overlay)] dark:bg-raised">
          {palette.map((emoji) => (
            <button key={emoji} type="button" aria-label={`React with ${emoji}`} onClick={() => { onToggle?.(emoji); setOpen(false); }} className={`grid size-8 place-items-center rounded-[10px] text-base hover:bg-[color-mix(in_srgb,var(--fg)_6%,var(--surface))] ${ring}`}>
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
