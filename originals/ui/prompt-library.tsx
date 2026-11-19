"use client";

import { Search } from "lucide-react";
import { useMemo, useState, useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "motion/react";


/* Prompt library: a searchable list of saved prompts with tag filter chips; choosing one hands its text to the composer. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}
const spring = { type: "spring", stiffness: 480, damping: 34 } as const;

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface LibraryPrompt {
  id: string;
  title: string;
  text: string;
  tags?: string[];
}

/** Prompts matching the query in title or text, and carrying `tag` when one is set. */
export function filterPrompts(prompts: LibraryPrompt[], query: string, tag: string | null): LibraryPrompt[] {
  const q = query.trim().toLowerCase();
  return prompts.filter((p) => (!tag || p.tags?.includes(tag)) && (!q || `${p.title} ${p.text}`.toLowerCase().includes(q)));
}

export function allTags(prompts: LibraryPrompt[]): string[] {
  return [...new Set(prompts.flatMap((p) => p.tags ?? []))].sort();
}

export interface PromptLibraryProps {
  prompts: LibraryPrompt[];
  onUse?: (prompt: LibraryPrompt) => void;
  className?: string;
}

export function PromptLibrary({ prompts, onUse, className = "" }: PromptLibraryProps) {
  const reduce = useReduce();
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const tags = useMemo(() => allTags(prompts), [prompts]);
  const shown = filterPrompts(prompts, query, tag);

  return (
    <motion.section aria-label="Prompt library" initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={spring} className={`w-full max-w-md rounded-[20px] bg-surface p-3 shadow-[var(--shadow-card)] ${className}`}>
      <label className="flex items-center gap-2 rounded-full bg-subtle px-3 py-1.5 focus-within:ring-2 focus-within:ring-[var(--select)]">
        <Search size={14} className="text-fg-subtle" aria-hidden />
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search prompts" aria-label="Search prompts" className="min-w-0 flex-1 bg-transparent text-[13px] text-fg outline-none placeholder:text-fg-subtle" />
      </label>
      <div role="group" aria-label="Filter by tag" className="mt-2 flex flex-wrap gap-1.5">
        {tags.map((t, i) => (
          <motion.button key={t} type="button" aria-pressed={tag === t} initial={reduce ? false : { opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ ...spring, delay: reduce ? 0 : 0.05 + i * 0.03 }} whileTap={reduce ? undefined : { scale: 0.94 }} onClick={() => setTag(tag === t ? null : t)} className={`rounded-full px-2.5 py-1 text-xs transition-colors ${tag === t ? "bg-select-soft font-medium text-select-text" : "bg-subtle text-fg-muted hover:bg-track"} ${ring}`}>{t}</motion.button>
        ))}
      </div>
      <ul className="mt-2 grid max-h-72 gap-1 overflow-auto">
        {shown.map((p, i) => (
          <motion.li key={p.id} layout={reduce ? false : "position"} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: reduce ? 0 : Math.min(i, 8) * 0.04 }}>
            <motion.button type="button" whileHover={reduce ? undefined : { x: 2 }} whileTap={reduce ? undefined : { scale: 0.98 }} onClick={() => onUse?.(p)} className={`block w-full rounded-[12px] px-3 py-2 text-left transition-colors hover:bg-[color-mix(in_srgb,var(--fg)_4%,var(--surface))] ${ring}`}>
              <span className="block text-[13px] font-medium text-fg">{p.title}</span>
              <span className="line-clamp-2 text-xs leading-4 text-fg-muted">{p.text}</span>
            </motion.button>
          </motion.li>
        ))}
      </ul>
      {shown.length === 0 && <p role="status" className="px-2 py-4 text-center text-[13px] text-fg-muted">No prompts match</p>}
    </motion.section>
  );
}
