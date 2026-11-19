"use client";

import { useState } from "react";
import { Check, Quote } from "lucide-react";

/* Action items: tasks an AI extracted from a call or thread, as a checklist with owner, due date (overdue in red) and the source quote, plus a done counter. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface ActionItem {
  id: string;
  text: string;
  owner?: string;
  /** ISO date, YYYY-MM-DD. */
  due?: string;
  done?: boolean;
  /** Where in the source this came from. */
  quote?: string;
}

export interface ActionItemsProps {
  items?: ActionItem[];
  defaultItems?: ActionItem[];
  onItemsChange?: (items: ActionItem[]) => void;
  /** Clock override for the overdue check. */
  today?: string;
  className?: string;
}

export function isOverdue(item: ActionItem, today: string): boolean {
  return !item.done && item.due !== undefined && item.due < today;
}

export function formatDue(due: string): string {
  const [y, m, d] = due.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en", { month: "short", day: "numeric", timeZone: "UTC" });
}

export function ActionItems({ items, defaultItems = [], onItemsChange, today = new Date().toISOString().slice(0, 10), className = "" }: ActionItemsProps) {
  const [inner, setInner] = useState(defaultItems);
  const list = items ?? inner;
  const toggle = (id: string) => {
    const next = list.map((i) => (i.id === id ? { ...i, done: !i.done } : i));
    if (items === undefined) setInner(next);
    onItemsChange?.(next);
  };
  const doneCount = list.filter((i) => i.done).length;

  return (
    <section aria-label="Action items" className={`overflow-hidden rounded-[18px] bg-surface shadow-[var(--shadow-card)] dark:bg-raised ${className}`}>
      <header className="flex items-center justify-between border-b border-track px-4 py-3">
        <h4 className="text-[13px] font-medium text-fg">Action items</h4>
        <span aria-live="polite" className="text-xs tabular-nums text-fg-subtle">{doneCount} of {list.length} done</span>
      </header>
      <ul className="divide-y divide-track">
        {list.map((i) => (
          <li key={i.id} className="flex items-start gap-3 px-4 py-3">
            <button type="button" role="checkbox" aria-checked={Boolean(i.done)} aria-label={i.text} onClick={() => toggle(i.id)} className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-[6px] transition-colors ${i.done ? "bg-select text-[var(--inverse-fg)]" : "bg-track hover:bg-track-strong text-transparent"} ${ring}`}>
              <Check size={13} aria-hidden />
            </button>
            <div className="min-w-0 flex-1">
              <p className={`text-sm ${i.done ? "text-fg-subtle line-through" : "text-fg"}`}>{i.text}</p>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-fg-subtle">
                {i.owner && <span>{i.owner}</span>}
                {i.due && <span className={isOverdue(i, today) ? "text-danger-text" : ""}>{isOverdue(i, today) ? "Overdue · " : "Due "}{formatDue(i.due)}</span>}
              </p>
              {i.quote && (
                <p className="mt-1.5 flex items-start gap-1.5 text-xs italic text-fg-muted">
                  <Quote size={11} aria-hidden className="mt-0.5 shrink-0" />
                  {i.quote}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
