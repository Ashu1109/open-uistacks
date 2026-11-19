"use client";

import { useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Pin, Search, Trash2 } from "lucide-react";
import { Leaving, gone } from "./chart-utils";

/* Memory list: what an agent remembers about you, searchable, with pin and forget actions; pinned memories float to the top. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}
const spring = { type: "spring", stiffness: 480, damping: 36 } as const;

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface MemoryItem {
  id: string;
  text: string;
  source: string;
  at: string;
  pinned?: boolean;
}

/** Case-insensitive text match, pinned items first, otherwise original order. */
export function filterMemories(items: MemoryItem[], query: string): MemoryItem[] {
  const q = query.trim().toLowerCase();
  const hits = q ? items.filter((m) => m.text.toLowerCase().includes(q) || m.source.toLowerCase().includes(q)) : items;
  return [...hits].sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)));
}

export interface MemoryListProps {
  memories: MemoryItem[];
  onTogglePin?: (id: string) => void;
  onForget?: (id: string) => void;
  className?: string;
}

export function MemoryList({ memories, onTogglePin, onForget, className = "" }: MemoryListProps) {
  const [query, setQuery] = useState("");
  const [forgotten, setForgotten] = useState<string | null>(null);
  const reduce = useReduce();
  const shown = filterMemories(memories, query);
  return (
    <section aria-label="Memories" className={`rounded-[16px] bg-surface p-3 shadow-[var(--shadow-card)] dark:bg-raised ${className}`}>
      <label className="flex h-9 items-center gap-2 rounded-[10px] bg-subtle px-3">
        <Search size={14} aria-hidden className="text-fg-subtle" />
        <input type="search" aria-label="Search memories" placeholder="Search memories" value={query} onChange={(e) => { setForgotten(null); setQuery(e.target.value); }} className="flex-1 bg-transparent text-[13px] text-fg outline-none placeholder:text-fg-subtle" />
      </label>
      <ul className="mt-2" aria-live="polite">
        <AnimatePresence custom={forgotten}>
        {shown.map((m, i) => (
          <Leaving key={m.id}>{(leaving) => (
          <motion.li
            {...gone(leaving)}
            layout={reduce ? false : "position"}
            custom={forgotten}
            variants={{ exit: (id: string | null) => (reduce ? { opacity: 0, transition: { duration: 0.1 } } : { opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0, x: id === m.id ? 24 : 0, transition: { duration: 0.2, ease: "easeOut" } }) }}
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit="exit"
            transition={{ ...spring, delay: Math.min(i, 8) * 0.04 }}
            className="group flex items-start gap-2 overflow-hidden rounded-[12px] px-2 py-2 transition-colors hover:bg-[color-mix(in_srgb,var(--fg)_4%,var(--surface))]"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[13px] text-fg">{m.text}</p>
              <p className="text-xs text-fg-subtle">{m.source} · {m.at}</p>
            </div>
            {onTogglePin && <motion.button type="button" whileTap={reduce ? undefined : { scale: 0.88 }} aria-label={`${m.pinned ? "Unpin" : "Pin"} memory: ${m.text}`} aria-pressed={Boolean(m.pinned)} onClick={() => onTogglePin(m.id)} className={`grid size-7 place-items-center rounded-[8px] transition-colors hover:bg-subtle ${m.pinned ? "text-select" : "text-fg-subtle"} ${ring}`}><motion.span animate={{ rotate: m.pinned ? 0 : -35 }} transition={spring} className="grid"><Pin size={13} aria-hidden /></motion.span></motion.button>}
            {onForget && <motion.button type="button" whileTap={reduce ? undefined : { scale: 0.88 }} aria-label={`Forget memory: ${m.text}`} onClick={() => { setForgotten(m.id); onForget(m.id); }} className={`grid size-7 place-items-center rounded-[8px] text-fg-subtle transition-colors hover:bg-danger-soft hover:text-danger-text ${ring}`}><Trash2 size={13} aria-hidden /></motion.button>}
          </motion.li>
          )}</Leaving>
        ))}
        </AnimatePresence>
        {shown.length === 0 && <li className="px-2 py-4 text-center text-[13px] text-fg-subtle">No memories match.</li>}
      </ul>
    </section>
  );
}
