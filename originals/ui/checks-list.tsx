"use client";

import { Check, Loader2, Minus, X } from "lucide-react";
import { formatMs } from "./tool-call";

/* Checks list: CI-style results for an agent's work, one row per check with state and duration, failing rows expanded with their detail and a tally header. */

export type CheckState = "pass" | "fail" | "running" | "skipped";
export interface CheckItem {
  id: string;
  name: string;
  state: CheckState;
  durationMs?: number;
  detail?: string;
}

export function tallyChecks(items: CheckItem[]): Record<CheckState, number> {
  const t: Record<CheckState, number> = { pass: 0, fail: 0, running: 0, skipped: 0 };
  for (const i of items) t[i.state] += 1;
  return t;
}

const LABEL: Record<CheckState, string> = { pass: "Passed", fail: "Failed", running: "Running", skipped: "Skipped" };

function StateIcon({ state }: { state: CheckState }) {
  if (state === "pass") return <Check size={14} aria-hidden className="text-success" />;
  if (state === "fail") return <X size={14} aria-hidden className="text-danger" />;
  if (state === "running") return <Loader2 size={14} aria-hidden className="animate-spin text-select motion-reduce:animate-none" />;
  return <Minus size={14} aria-hidden className="text-fg-subtle" />;
}

export interface ChecksListProps {
  items: CheckItem[];
  className?: string;
}

export function ChecksList({ items, className = "" }: ChecksListProps) {
  const t = tallyChecks(items);
  return (
    <section aria-label="Checks" className={`overflow-hidden rounded-[16px] bg-surface shadow-[var(--shadow-card)] dark:bg-raised ${className}`}>
      <p aria-live="polite" className={`px-4 py-2.5 text-[13px] font-medium ${t.fail ? "bg-danger-soft text-danger-text" : t.running ? "bg-select-soft text-select-text" : "bg-success-soft text-success-text"}`}>
        {t.fail ? `${t.fail} failing` : t.running ? `${t.running} still running` : "All checks passed"}
        <span className="font-normal opacity-80"> · {t.pass} passed{t.skipped ? `, ${t.skipped} skipped` : ""}</span>
      </p>
      <ul className="divide-y divide-track">
        {items.map((i) => (
          <li key={i.id} className="px-4 py-2.5">
            <div className="flex items-center gap-2.5">
              <StateIcon state={i.state} />
              <span className="flex-1 text-[13px] text-fg">{i.name}<span className="sr-only"> — {LABEL[i.state]}</span></span>
              {i.durationMs !== undefined && <span className="text-xs tabular-nums text-fg-subtle">{formatMs(i.durationMs)}</span>}
            </div>
            {i.state === "fail" && i.detail && <pre className="mt-2 overflow-x-auto rounded-[8px] bg-danger-soft p-2 font-mono text-xs text-danger-text">{i.detail}</pre>}
          </li>
        ))}
      </ul>
    </section>
  );
}
