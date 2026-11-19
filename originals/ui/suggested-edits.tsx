"use client";

import { Check, X } from "lucide-react";
import { useState } from "react";

/* Suggested edits: a list of before/after text changes the assistant proposes, each accepted or rejected on its own or all at once, with a running tally. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface SuggestedEdit {
  id: string;
  before: string;
  after: string;
  reason?: string;
}

export type EditStatus = "pending" | "accepted" | "rejected";

/** Counts per status for a map of decisions; missing ids count as pending. */
export function tally(edits: SuggestedEdit[], decisions: Record<string, EditStatus>): Record<EditStatus, number> {
  const out: Record<EditStatus, number> = { pending: 0, accepted: 0, rejected: 0 };
  for (const e of edits) out[decisions[e.id] ?? "pending"]++;
  return out;
}

export interface SuggestedEditsProps {
  edits: SuggestedEdit[];
  onDecide?: (id: string, status: EditStatus) => void;
  onAcceptAll?: () => void;
  className?: string;
}

export function SuggestedEdits({ edits, onDecide, onAcceptAll, className = "" }: SuggestedEditsProps) {
  const [decisions, setDecisions] = useState<Record<string, EditStatus>>({});
  const counts = tally(edits, decisions);

  const decide = (id: string, status: EditStatus) => {
    setDecisions((d) => ({ ...d, [id]: status }));
    onDecide?.(id, status);
  };
  const acceptAll = () => {
    edits.forEach((e) => (decisions[e.id] ?? "pending") === "pending" && decide(e.id, "accepted"));
    onAcceptAll?.();
  };

  return (
    <section aria-label="Suggested edits" className={`w-full max-w-xl rounded-[20px] bg-surface p-3 shadow-[var(--shadow-card)] ${className}`}>
      <header className="flex items-center justify-between px-1 pb-2">
        <h3 className="text-sm font-medium text-fg">Suggested edits</h3>
        <span role="status" className="text-xs tabular-nums text-fg-muted">{counts.accepted} accepted · {counts.pending} pending</span>
      </header>
      <ul className="grid gap-2">
        {edits.map((e) => {
          const status = decisions[e.id] ?? "pending";
          return (
            <li key={e.id} data-status={status} className={`rounded-[14px] bg-subtle p-3 text-[13px] leading-5 transition-opacity ${status === "rejected" ? "opacity-50" : ""}`}>
              <p className="text-danger-text line-through decoration-[1px]">{e.before}</p>
              <p className="mt-1 text-success-text">{e.after}</p>
              {e.reason && <p className="mt-1 text-xs text-fg-muted">{e.reason}</p>}
              <div className="mt-2 flex gap-1.5">
                <button type="button" aria-pressed={status === "accepted"} aria-label={`Accept edit: ${e.after}`} onClick={() => decide(e.id, "accepted")} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${status === "accepted" ? "bg-success-soft text-success-text" : "bg-surface text-fg shadow-[var(--shadow-btn-secondary)]"} ${ring}`}>
                  <Check size={12} aria-hidden /> Accept
                </button>
                <button type="button" aria-pressed={status === "rejected"} aria-label={`Reject edit: ${e.after}`} onClick={() => decide(e.id, "rejected")} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${status === "rejected" ? "bg-danger-soft text-danger-text" : "bg-surface text-fg shadow-[var(--shadow-btn-secondary)]"} ${ring}`}>
                  <X size={12} aria-hidden /> Reject
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <button type="button" onClick={acceptAll} disabled={counts.pending === 0} className={`mt-3 w-full rounded-full bg-[image:var(--grad-primary)] py-2 text-[13px] font-medium text-[var(--inverse-fg)] shadow-[var(--shadow-btn-primary)] disabled:opacity-40 ${ring}`}>
        Accept all remaining
      </button>
    </section>
  );
}
