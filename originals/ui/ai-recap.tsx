"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowDown, Sparkles, X } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { useReducedMotion } from "motion/react";

/* AI recap: a dismissible "while you were away" card that lists what changed in the conversation since the last visit, with a jump-to-latest action. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface RecapItem {
  id: string;
  text: string;
}

export interface AiRecapProps {
  items: RecapItem[];
  /** Phrase after "Since", such as "9:40 AM" or "yesterday". */
  since?: string;
  onJump?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function AiRecap({ items, since = "you left", onJump, onDismiss, className = "" }: AiRecapProps) {
  const reduce = useReduce();
  const [open, setOpen] = useState(true);
  const dismiss = () => {
    setOpen(false);
    onDismiss?.();
  };
  return (
    <AnimatePresence>
      {open && (
        <motion.section
          aria-label="Recap"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, height: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 34 }}
          className={`rounded-[20px] bg-select-soft p-4 shadow-[var(--shadow-hairline)] ${className}`}
        >
          <header className="flex items-center gap-2">
            <Sparkles size={15} className="text-select-text" aria-hidden />
            <h3 className="flex-1 text-sm font-medium text-fg">Since {since}</h3>
            <button type="button" onClick={dismiss} aria-label="Dismiss recap" className={`grid size-7 place-items-center rounded-full text-fg-muted hover:bg-subtle ${ring}`}>
              <X size={14} aria-hidden />
            </button>
          </header>
          <ul className="mt-2 grid gap-1.5 pl-1">
            {items.map((item) => (
              <li key={item.id} className="flex gap-2 text-[13px] leading-5 text-fg-muted">
                <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-select" />
                {item.text}
              </li>
            ))}
          </ul>
          {onJump && (
            <button type="button" onClick={onJump} className={`mt-3 inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-[13px] font-medium text-fg shadow-[var(--shadow-btn-secondary)] ${ring}`}>
              <ArrowDown size={14} aria-hidden /> Jump to latest
            </button>
          )}
        </motion.section>
      )}
    </AnimatePresence>
  );
}
