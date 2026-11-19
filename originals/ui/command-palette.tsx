"use client";

import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Search } from "lucide-react";
import { ModalFrame, useControlled } from "./dialog";

/* Command palette: a modal search box that fuzzy-filters grouped commands as you type; arrow keys move, Enter runs, Escape closes, and an optional hotkey (default Cmd/Ctrl+K) toggles it. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const spring = { type: "spring", stiffness: 480, damping: 34 } as const;

export interface FuzzyMatch {
  score: number;
  /** Positions in the text that matched the query, for highlighting. */
  indices: number[];
}

const isBoundary = (text: string, i: number) => i === 0 || /[\s\-_/.:]/.test(text[i - 1]);

function scoreFrom(query: string, text: string, start: number): FuzzyMatch | null {
  const indices: number[] = [];
  let score = 0;
  let from = start;
  for (const ch of query) {
    const at = text.indexOf(ch, from);
    if (at < 0) return null;
    score += 1;
    if (at === 0) score += 10;
    else if (isBoundary(text, at)) score += 8;
    if (indices.length && at === indices[indices.length - 1] + 1) score += 5;
    score -= Math.min(at - from, 6) * 0.5;
    indices.push(at);
    from = at + 1;
  }
  return { score, indices };
}

/** Scores `query` as a case-insensitive subsequence of `text`: consecutive runs, word starts and early hits score higher. Null when it does not match. */
export function fuzzyScore(query: string, text: string): FuzzyMatch | null {
  const q = query.toLowerCase().replace(/\s+/g, "");
  if (!q) return { score: 0, indices: [] };
  const t = text.toLowerCase();
  let best: FuzzyMatch | null = null;
  for (let start = t.indexOf(q[0]); start >= 0; start = t.indexOf(q[0], start + 1)) {
    const hit = scoreFrom(q, t, start);
    if (hit && (!best || hit.score > best.score)) best = hit;
  }
  return best;
}

export interface Command {
  id: string;
  label: string;
  group?: string;
  /** Extra words that match the query without being shown. */
  keywords?: string[];
  shortcut?: string;
  icon?: ReactNode;
  onSelect: () => void;
}

export interface RankedCommand {
  command: Command;
  indices: number[];
}

/** Commands matching `query`, best first; an empty query keeps the original order. */
export function filterCommands(commands: Command[], query: string): RankedCommand[] {
  if (!query.trim()) return commands.map((command) => ({ command, indices: [] }));
  return commands
    .flatMap((command) => {
      const byLabel = fuzzyScore(query, command.label);
      const byWord = byLabel ? null : fuzzyScore(query, (command.keywords ?? []).join(" "));
      const score = byLabel ? byLabel.score : byWord ? byWord.score * 0.5 : null;
      return score === null ? [] : [{ command, indices: byLabel?.indices ?? [], score }];
    })
    .sort((a, b) => b.score - a.score)
    .map(({ command, indices }) => ({ command, indices }));
}

/** Buckets ranked commands by group, in order of each group's first appearance. */
export function groupCommands(ranked: RankedCommand[]): { name: string; items: RankedCommand[] }[] {
  const groups = new Map<string, RankedCommand[]>();
  for (const item of ranked) {
    const name = item.command.group ?? "";
    groups.set(name, [...(groups.get(name) ?? []), item]);
  }
  return Array.from(groups, ([name, items]) => ({ name, items }));
}

function Highlighted({ text, indices }: { text: string; indices: number[] }) {
  if (!indices.length) return <>{text}</>;
  const hit = new Set(indices);
  return (
    <>
      {Array.from(text).map((ch, i) =>
        hit.has(i) ? <span key={i} className="font-semibold text-select-text">{ch}</span> : ch,
      )}
    </>
  );
}

export interface CommandPaletteProps {
  commands: Command[];
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  placeholder?: string;
  emptyText?: string;
  /** Key that toggles the palette together with Cmd/Ctrl; pass null to disable the global shortcut. */
  hotkey?: string | null;
  /** Names the dialog for screen readers. */
  label?: string;
}

export function CommandPalette({ commands, open, defaultOpen, onOpenChange, placeholder = "Search commands…", emptyText = "No matching commands", hotkey = "k", label = "Command palette" }: CommandPaletteProps) {
  const id = useId();
  const reduce = useReduce();
  const [isOpen, setOpen] = useControlled(open, defaultOpen ?? false, onOpenChange);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const toggle = useRef(() => {});
  toggle.current = () => setOpen(!isOpen);

  const ranked = useMemo(() => filterCommands(commands, query), [commands, query]);
  const groups = useMemo(() => groupCommands(ranked), [ranked]);
  const flat = groups.flatMap((g) => g.items);
  const optionId = (i: number) => `${id}-option-${i}`;

  useEffect(() => {
    if (!hotkey) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === hotkey.toLowerCase()) {
        e.preventDefault();
        toggle.current();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [hotkey]);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setActive(0);
    }
  }, [isOpen]);

  useEffect(() => {
    document.getElementById(optionId(active))?.scrollIntoView?.({ block: "nearest" });
  });

  const run = (i: number) => {
    const item = flat[i];
    if (!item) return;
    setOpen(false);
    item.command.onSelect();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (!flat.length) return;
    const moves: Record<string, () => void> = {
      ArrowDown: () => setActive((a) => (a + 1) % flat.length),
      ArrowUp: () => setActive((a) => (a - 1 + flat.length) % flat.length),
      Home: () => setActive(0),
      End: () => setActive(flat.length - 1),
      Enter: () => run(active),
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    move();
  };

  let offset = 0;
  return (
    <ModalFrame open={isOpen} onClose={() => setOpen(false)} placement="palette" label={label} className="w-full max-w-xl overflow-hidden rounded-[20px] bg-surface shadow-[var(--shadow-overlay)] dark:bg-raised" onKeyDown={onKeyDown}>
      <div className="flex items-center gap-3 border-b border-track px-4">
        <Search size={18} strokeWidth={2} aria-hidden className="shrink-0 text-fg-muted" />
        <input
          data-autofocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          role="combobox"
          aria-expanded="true"
          aria-controls={`${id}-list`}
          aria-activedescendant={flat.length ? optionId(active) : undefined}
          aria-autocomplete="list"
          aria-label={placeholder}
          placeholder={placeholder}
          className="h-14 min-w-0 flex-1 bg-transparent text-[15px] text-fg outline-none placeholder:text-fg-subtle"
        />
      </div>
      <div id={`${id}-list`} role="listbox" aria-label={label} className="max-h-[min(24rem,60vh)] overflow-y-auto p-2">
        {flat.length === 0 && <p className="px-3 py-8 text-center text-sm text-fg-muted">{emptyText}</p>}
        {groups.map((group) => {
          const start = offset;
          offset += group.items.length;
          return (
            <div key={group.name} role="group" aria-label={group.name || undefined}>
              {group.name && <div aria-hidden className="px-3 pb-1 pt-2 text-xs font-medium text-fg-subtle">{group.name}</div>}
              {group.items.map(({ command, indices }, i) => {
                const index = start + i;
                return (
                  <motion.div
                    key={command.id}
                    initial={reduce ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...spring, delay: Math.min(index, 8) * 0.025 }}
                    whileTap={reduce ? undefined : { scale: 0.985 }}
                    id={optionId(index)}
                    role="option"
                    aria-selected={index === active}
                    onPointerMove={() => setActive(index)}
                    onClick={() => run(index)}
                    className="relative flex cursor-default items-center gap-3 rounded-[10px] px-3 py-2 text-sm text-fg"
                  >
                    {index === active && <motion.span aria-hidden layoutId={`${id}-active`} transition={reduce ? { duration: 0 } : spring} className="absolute inset-0 rounded-[10px] bg-[color-mix(in_srgb,var(--fg)_6%,transparent)]" />}
                    {command.icon && <span className="relative shrink-0 text-fg-muted">{command.icon}</span>}
                    <span className="relative min-w-0 flex-1 truncate"><Highlighted text={command.label} indices={indices} /></span>
                    {command.shortcut && <kbd className="relative shrink-0 rounded-md bg-subtle px-1.5 font-sans text-xs leading-5 text-fg-muted">{command.shortcut}</kbd>}
                  </motion.div>
                );
              })}
            </div>
          );
        })}
      </div>
      <div role="status" className="sr-only">{`${flat.length} result${flat.length === 1 ? "" : "s"}`}</div>
    </ModalFrame>
  );
}
