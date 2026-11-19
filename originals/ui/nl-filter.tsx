"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Sparkles, X } from "lucide-react";
import { Leaving, gone } from "./chart-utils";

/* Natural-language filter: type a sentence like "open bugs over 5 comments from last week" and it becomes removable filter chips via a small rule-based parser over your field schema. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}
const spring = { type: "spring", stiffness: 480, damping: 36 } as const;

export type FilterField =
  | { key: string; label: string; type: "enum"; options: string[] }
  | { key: string; label: string; type: "number"; /** Words that name the number, e.g. ["comments"]. */ units: string[] }
  | { key: string; label: string; type: "date" };

export interface Filter {
  field: string;
  op: "is" | ">" | "<" | ">=" | "<=" | "within";
  value: string;
  /** Human text shown on the chip. */
  label: string;
}

export interface NlFilterProps {
  fields: FilterField[];
  value?: Filter[];
  defaultValue?: Filter[];
  onValueChange?: (filters: Filter[]) => void;
  placeholder?: string;
  className?: string;
}

const NUMBER_OPS: [RegExp, Filter["op"], string][] = [
  [/(?:more than|over|above|greater than|>)/, ">", "more than"],
  [/(?:fewer than|less than|under|below|<)/, "<", "fewer than"],
  [/(?:at least|>=)/, ">=", "at least"],
  [/(?:at most|<=)/, "<=", "at most"],
];

const DATE_RANGES: [RegExp, string][] = [
  [/\btoday\b/, "today"],
  [/\byesterday\b/, "yesterday"],
  [/\b(?:last|past) (?:7 days|week)\b/, "last 7 days"],
  [/\b(?:last|past) (?:30 days|month)\b/, "last 30 days"],
  [/\bthis month\b/, "this month"],
];

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Turns free text into filters for the fields in the schema; unmatched words are returned in `rest`. */
export function parseFilters(text: string, fields: FilterField[]): { filters: Filter[]; rest: string } {
  let remaining = ` ${text.toLowerCase()} `;
  const filters: Filter[] = [];
  const take = (re: RegExp) => {
    const m = remaining.match(re);
    if (m) remaining = remaining.replace(m[0], " ");
    return m;
  };
  for (const f of fields) {
    if (f.type === "number") {
      for (const [opRe, op, word] of NUMBER_OPS) {
        const units = f.units.map(escape).join("|");
        const m = take(new RegExp(`\\s${opRe.source}\\s*(\\d+(?:\\.\\d+)?)\\s*(?:${units})\\b`));
        if (m) filters.push({ field: f.key, op, value: m[1], label: `${f.label} ${word} ${m[1]}` });
      }
    } else if (f.type === "date") {
      for (const [re, name] of DATE_RANGES) {
        if (take(re)) filters.push({ field: f.key, op: "within", value: name, label: `${f.label}: ${name}` });
      }
    } else {
      for (const option of f.options) {
        if (take(new RegExp(`\\s${escape(option.toLowerCase())}\\b`))) filters.push({ field: f.key, op: "is", value: option, label: `${f.label}: ${option}` });
      }
    }
  }
  return { filters, rest: remaining.replace(/\b(?:from|with|that|are|the|and|in|of)\b/g, " ").replace(/\s+/g, " ").trim() };
}

export function NlFilter({ fields, value, defaultValue = [], onValueChange, placeholder = "Describe what to show…", className = "" }: NlFilterProps) {
  const [inner, setInner] = useState(defaultValue);
  const [text, setText] = useState("");
  const filters = value ?? inner;
  const reduce = useReduce();
  const preview = useMemo(() => parseFilters(text, fields), [text, fields]);
  const commit = (next: Filter[]) => {
    if (value === undefined) setInner(next);
    onValueChange?.(next);
  };
  const apply = () => {
    if (preview.filters.length === 0) return;
    const keep = filters.filter((f) => !preview.filters.some((p) => p.field === f.field && p.op === f.op && p.value === f.value));
    commit([...keep, ...preview.filters]);
    setText("");
  };

  return (
    <div className={`grid w-full max-w-xl gap-2 ${className}`}>
      <div className="flex items-center gap-2 rounded-[14px] bg-surface px-3 shadow-[var(--shadow-card)] focus-within:shadow-[0_0_0_2px_var(--select)] dark:bg-raised">
        <motion.span animate={{ scale: preview.filters.length && !reduce ? 1.25 : 1, rotate: preview.filters.length && !reduce ? 15 : 0 }} transition={spring} className="grid"><Sparkles size={15} aria-hidden className="text-select-text" /></motion.span>
        <input aria-label="Filter in plain English" value={text} placeholder={placeholder} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && apply()} className="h-11 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-fg-subtle" />
      </div>
      <p aria-live="polite" className="min-h-4 px-1 text-xs text-fg-subtle">
        {text && (preview.filters.length ? `Press Enter to add ${preview.filters.map((f) => f.label).join(", ")}` : "No filters recognised yet")}
      </p>
      <ul aria-label="Active filters" className="flex flex-wrap gap-1.5">
        <AnimatePresence>
        {filters.map((f) => (
          <Leaving key={`${f.field}-${f.op}-${f.value}`}>{(out) => (
          <motion.li {...gone(out)} layout={reduce ? false : "position"} initial={reduce ? false : { opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={reduce ? { opacity: 0, transition: { duration: 0.1 } } : { opacity: 0, scale: 0.7, transition: { duration: 0.14, ease: "easeIn" } }} transition={{ ...spring, stiffness: 520, damping: 30 }} className="inline-flex items-center gap-1 rounded-full bg-select-soft py-1 pl-3 pr-1 text-xs font-medium text-select-text">
            {f.label}
            <motion.button type="button" whileTap={reduce ? undefined : { scale: 0.85 }} aria-label={`Remove ${f.label}`} onClick={() => commit(filters.filter((x) => x !== f))} className="grid size-5 place-items-center rounded-full outline-none transition-colors hover:bg-select/15 focus-visible:ring-2 focus-visible:ring-[var(--select)]">
              <X size={12} aria-hidden />
            </motion.button>
          </motion.li>
          )}</Leaving>
        ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
