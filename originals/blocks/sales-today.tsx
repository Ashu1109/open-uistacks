"use client";

import { useState } from "react";
import { Calendar, Mail, Phone, SquareCheck } from "lucide-react";
import { Progress } from "../../registry/ui/progress";

/* Sales today: a half-width card with today's calls, meetings, emails and tasks as a checklist; ticking one off updates the "done of total" progress. */

export type TodayKind = "call" | "meeting" | "email" | "task";

export interface TodayItem {
  id: string;
  kind: TodayKind;
  title: string;
  /** Display time, e.g. "10:30". */
  time?: string;
  contact?: string;
  done?: boolean;
}

export const DEMO_TODAY: TodayItem[] = [
  { id: "t1", kind: "call", title: "Intro call", time: "09:30", contact: "Priya Raman", done: true },
  { id: "t2", kind: "meeting", title: "Contract review", time: "11:00", contact: "Brightwell Foods" },
  { id: "t3", kind: "email", title: "Send revised proposal", time: "13:00", contact: "Northfield Labs" },
  { id: "t4", kind: "call", title: "Renewal check-in", time: "14:15", contact: "Tom Lindqvist" },
  { id: "t5", kind: "task", title: "Update forecast notes", contact: "Pipeline" },
];

const ICONS = { call: Phone, meeting: Calendar, email: Mail, task: SquareCheck } as const;

export function completion(items: readonly TodayItem[]): { done: number; total: number; percent: number } {
  const done = items.filter((i) => i.done).length;
  return { done, total: items.length, percent: items.length === 0 ? 0 : Math.round((done / items.length) * 100) };
}

export function toggleItem(items: readonly TodayItem[], id: string): TodayItem[] {
  return items.map((i) => (i.id === id ? { ...i, done: !i.done } : i));
}

export interface SalesTodayProps {
  items?: TodayItem[];
  onToggle?: (id: string, done: boolean) => void;
  className?: string;
}

export function SalesToday({ items: initial = DEMO_TODAY, onToggle, className = "" }: SalesTodayProps) {
  const [items, setItems] = useState(initial);
  const { done, total, percent } = completion(items);
  return (
    <section aria-label="Sales today" className={`@container rounded-[20px] bg-surface p-4 shadow-[var(--shadow-card)] ${className}`}>
      <header className="flex items-baseline justify-between gap-3 pb-3">
        <h2 className="text-[15px] font-semibold text-fg">Today</h2>
        <p role="status" className="text-sm tabular-nums text-fg-muted">{done} of {total} done</p>
      </header>
      <Progress value={percent} label="Today's progress" showValue={false} size="sm" />
      <ul className="mt-3 grid gap-0.5">
        {items.map((item) => {
          const Icon = ICONS[item.kind];
          return (
            <li key={item.id}>
              <label className="flex cursor-pointer items-center gap-3 rounded-[12px] px-2 py-2 hover:bg-[color-mix(in_srgb,var(--fg)_4%,var(--surface))]">
                <input
                  type="checkbox"
                  checked={Boolean(item.done)}
                  onChange={() => {
                    setItems((cur) => toggleItem(cur, item.id));
                    onToggle?.(item.id, !item.done);
                  }}
                  className="size-4 shrink-0 cursor-pointer rounded accent-[var(--select)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
                />
                <Icon size={15} aria-hidden className="shrink-0 text-fg-subtle" />
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-sm ${item.done ? "text-fg-subtle line-through" : "font-medium text-fg"}`}>{item.title}</span>
                  {item.contact && <span className="block truncate text-xs text-fg-muted">{item.contact}</span>}
                </span>
                {item.time && <span className="text-xs tabular-nums text-fg-muted">{item.time}</span>}
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
