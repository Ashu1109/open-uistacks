"use client";

import { useId, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";

/* People picker: a multi-select combobox that searches people by name or email, shows chosen people as removable chips, and handles arrows, Enter, Backspace and Escape. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const spring = { type: "spring", stiffness: 480, damping: 34 } as const;

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface Person {
  id: string;
  name: string;
  email?: string;
}

export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? "") + (words.length > 1 ? words[words.length - 1][0] : "")).toUpperCase();
}

/** People matching the query in name or email, name prefixes first, never the excluded ids. */
export function filterPeople(people: Person[], query: string, excludeIds: readonly string[] = []): Person[] {
  const q = query.trim().toLowerCase();
  const pool = people.filter((p) => !excludeIds.includes(p.id));
  if (!q) return pool;
  const hits = pool.filter((p) => p.name.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q));
  const starts = (p: Person) => (p.name.toLowerCase().split(/\s+/).some((w) => w.startsWith(q)) ? 0 : 1);
  return [...hits].sort((a, b) => starts(a) - starts(b));
}

function Avatar({ name, size = "size-6" }: { name: string; size?: string }) {
  return <span aria-hidden className={`relative inline-flex ${size} shrink-0 items-center justify-center rounded-full bg-select-soft text-[10px] font-medium text-select-text`}>{initials(name)}</span>;
}

export interface PeoplePickerProps {
  people: Person[];
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (ids: string[]) => void;
  /** Most people that can be chosen. */
  max?: number;
  label?: string;
  placeholder?: string;
  className?: string;
}

export function PeoplePicker({ people, value: controlled, defaultValue = [], onValueChange, max, label = "People", placeholder = "Add people", className = "" }: PeoplePickerProps) {
  const id = useId();
  const reduce = useReduce();
  const [inner, setInner] = useState<string[]>(defaultValue);
  const ids = controlled ?? inner;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const full = max !== undefined && ids.length >= max;
  const options = full ? [] : filterPeople(people, query, ids);
  const chosen = ids.map((i) => people.find((p) => p.id === i)).filter((p): p is Person => Boolean(p));

  const commit = (next: string[]) => {
    setInner(next);
    onValueChange?.(next);
  };
  const add = (p: Person) => {
    commit([...ids, p.id]);
    setQuery("");
    setActive(0);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      if (options.length) setActive((a) => (a + (e.key === "ArrowDown" ? 1 : -1) + options.length) % options.length);
    } else if (e.key === "Enter" && open && options[active]) {
      e.preventDefault();
      add(options[active]);
    } else if (e.key === "Backspace" && query === "" && ids.length) {
      commit(ids.slice(0, -1));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className={`relative w-80 ${className}`}>
      <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-[12px] bg-surface p-1.5 shadow-[var(--shadow-card)] focus-within:ring-2 focus-within:ring-[var(--select)]">
        <AnimatePresence initial={false}>
        {chosen.map((p) => (
          <motion.span key={p.id} layout={!reduce} initial={reduce ? false : { opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: reduce ? 1 : 0.7, transition: { duration: 0.12 } }} transition={spring} className="inline-flex h-7 items-center gap-1.5 rounded-full bg-subtle pl-1 pr-1.5 text-sm text-fg">
            <Avatar name={p.name} size="size-5" />
            {p.name}
            <button type="button" aria-label={`Remove ${p.name}`} onClick={() => commit(ids.filter((i) => i !== p.id))} className={`inline-flex size-4 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-track ${ring}`}>
              <X className="size-3" aria-hidden />
            </button>
          </motion.span>
        ))}
        </AnimatePresence>
        <input
          role="combobox"
          aria-label={label}
          aria-expanded={open && options.length > 0}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={open && options[active] ? `${id}-${options[active].id}` : undefined}
          autoComplete="off"
          disabled={full}
          value={query}
          placeholder={chosen.length || full ? "" : placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          className="h-7 min-w-24 flex-1 bg-transparent px-1.5 text-sm text-fg outline-none placeholder:text-fg-subtle"
        />
      </div>
      <span role="status" className="sr-only">{`${ids.length} selected`}</span>
      {open && !full && (
        <motion.ul initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.16 }} id={`${id}-list`} role="listbox" aria-label={`${label} suggestions`} aria-multiselectable className="absolute left-0 right-0 top-full z-50 mt-2 max-h-56 overflow-auto rounded-[14px] bg-surface p-1 shadow-[var(--shadow-overlay)] dark:bg-raised">
          {options.length === 0 && <li role="presentation" className="px-2.5 py-2 text-sm text-fg-muted">No one found</li>}
          {options.map((p, i) => (
            <motion.li key={p.id} id={`${id}-${p.id}`} role="option" aria-selected={false} initial={reduce ? false : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: Math.min(i, 8) * 0.03 }} onMouseDown={(e) => e.preventDefault()} onClick={() => add(p)} onPointerEnter={() => setActive(i)} className="relative flex cursor-default items-center gap-2.5 rounded-[10px] px-2.5 py-1.5">
              {i === active && <motion.span aria-hidden layoutId={`${id}-active`} transition={reduce ? { duration: 0 } : spring} className="absolute inset-0 rounded-[10px] bg-[color-mix(in_srgb,var(--fg)_6%,var(--surface))]" />}
              <Avatar name={p.name} size="size-7" />
              <span className="relative min-w-0">
                <span className="block truncate text-sm text-fg">{p.name}</span>
                {p.email && <span className="block truncate text-xs text-fg-muted">{p.email}</span>}
              </span>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </div>
  );
}
