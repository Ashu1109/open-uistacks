"use client";

import { useState, useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Pencil } from "lucide-react";

/* Extracted fields: key/value pairs an agent pulled out of a document, each with a confidence meter; low-confidence values are flagged and any value can be corrected inline. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}
const spring = { type: "spring", stiffness: 480, damping: 36 } as const;

export const LOW_CONFIDENCE = 0.7;

export interface ExtractedField {
  key: string;
  label: string;
  value: string;
  /** 0 to 1. */
  confidence: number;
}

export function confidenceLevel(c: number): "high" | "medium" | "low" {
  return c >= 0.9 ? "high" : c >= LOW_CONFIDENCE ? "medium" : "low";
}

const BAR = { high: "var(--success)", medium: "var(--warning)", low: "var(--danger)" };

export interface ExtractedFieldsProps {
  fields: ExtractedField[];
  /** Called with the corrected value; the caller owns the data. */
  onEdit?: (key: string, value: string) => void;
  className?: string;
}

export function ExtractedFields({ fields, onEdit, className = "" }: ExtractedFieldsProps) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const reduce = useReduce();
  const commit = (key: string) => {
    onEdit?.(key, draft.trim());
    setEditing(null);
  };
  return (
    <dl className={`divide-y divide-track rounded-[16px] bg-surface shadow-[var(--shadow-card)] dark:bg-raised ${className}`}>
      {fields.map((f, i) => {
        const level = confidenceLevel(f.confidence);
        return (
          <motion.div key={f.key} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: i * 0.04 }} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[color-mix(in_srgb,var(--fg)_3%,transparent)]">
            <dt className="w-28 shrink-0 text-xs text-fg-subtle">{f.label}</dt>
            <dd className="min-w-0 flex-1">
              {editing === f.key ? (
                <input
                  autoFocus
                  aria-label={`Edit ${f.label}`}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={() => commit(f.key)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commit(f.key);
                    if (e.key === "Escape") setEditing(null);
                  }}
                  className={`h-7 w-full rounded-[8px] bg-subtle px-2 text-[13px] text-fg ${ring}`}
                />
              ) : (
                <span className="text-[13px] text-fg">{f.value}</span>
              )}
            </dd>
            <div
              role="meter"
              aria-label={`${f.label} confidence`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(f.confidence * 100)}
              className="flex w-20 items-center gap-1.5"
            >
              <span className="h-1 flex-1 overflow-hidden rounded-full bg-track">
                <motion.span className="block h-full rounded-full" initial={reduce ? false : { width: 0 }} animate={{ width: `${f.confidence * 100}%` }} transition={{ ...spring, stiffness: 160, damping: 26, delay: 0.12 + i * 0.04 }} style={{ background: BAR[level] }} />
              </span>
              <span className={`w-8 text-right text-[11px] tabular-nums ${level === "low" ? "text-danger-text" : "text-fg-subtle"}`}>{Math.round(f.confidence * 100)}%</span>
            </div>
            {onEdit && (
              <button
                type="button"
                aria-label={`Edit ${f.label}`}
                onClick={() => { setDraft(f.value); setEditing(f.key); }}
                className={`grid size-7 place-items-center rounded-[8px] text-fg-subtle transition-colors hover:bg-subtle hover:text-fg active:scale-95 ${ring}`}
              >
                <Pencil size={13} aria-hidden />
              </button>
            )}
          </motion.div>
        );
      })}
    </dl>
  );
}
