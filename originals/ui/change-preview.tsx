"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";

/* Change preview: proposed edits shown as before and after, each accepted or rejected on its own, with an Apply button that reports the accepted ids. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export type ChangeDecision = "accepted" | "rejected";
export interface ProposedChange {
  id: string;
  label: string;
  before: string;
  after: string;
}

export function acceptedIds(decisions: Record<string, ChangeDecision>, changes: ProposedChange[]): string[] {
  return changes.filter((c) => decisions[c.id] !== "rejected").map((c) => c.id);
}

export interface ChangePreviewProps {
  changes: ProposedChange[];
  onApply?: (acceptedIds: string[]) => void;
  className?: string;
}

export function ChangePreview({ changes, onApply, className = "" }: ChangePreviewProps) {
  const [decisions, setDecisions] = useState<Record<string, ChangeDecision>>({});
  const accepted = acceptedIds(decisions, changes);
  const decide = (id: string, d: ChangeDecision) => setDecisions((cur) => {
      const { [id]: prev, ...rest } = cur;
      return prev === d ? rest : { ...rest, [id]: d };
    });
  return (
    <section aria-label="Proposed changes" className={`rounded-[16px] bg-surface p-4 shadow-[var(--shadow-card)] dark:bg-raised ${className}`}>
      <ul className="space-y-3">
        {changes.map((c) => {
          const d = decisions[c.id];
          return (
            <li key={c.id} className={`rounded-[12px] bg-subtle p-3 transition-opacity ${d === "rejected" ? "opacity-50" : ""}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-medium text-fg">{c.label}</span>
                <span className="flex gap-1">
                  <button type="button" aria-label={`Accept ${c.label}`} aria-pressed={d === "accepted"} onClick={() => decide(c.id, "accepted")}
                    className={`grid size-7 place-items-center rounded-[8px] ${d === "accepted" ? "bg-success-soft text-success-text" : "text-fg-subtle hover:bg-track"} ${ring}`}><Check size={14} aria-hidden /></button>
                  <button type="button" aria-label={`Reject ${c.label}`} aria-pressed={d === "rejected"} onClick={() => decide(c.id, "rejected")}
                    className={`grid size-7 place-items-center rounded-[8px] ${d === "rejected" ? "bg-danger-soft text-danger-text" : "text-fg-subtle hover:bg-track"} ${ring}`}><X size={14} aria-hidden /></button>
                </span>
              </div>
              <p className="mt-2 rounded-[8px] bg-danger-soft px-2 py-1 text-xs text-danger-text line-through"><span className="sr-only">Before: </span>{c.before}</p>
              <p className="mt-1 rounded-[8px] bg-success-soft px-2 py-1 text-xs text-success-text"><span className="sr-only">After: </span>{c.after}</p>
            </li>
          );
        })}
      </ul>
      {onApply && (
        <button type="button" disabled={accepted.length === 0} onClick={() => onApply(accepted)}
          className={`mt-4 h-9 w-full rounded-[10px] bg-[image:var(--grad-primary)] text-[13px] text-[var(--inverse-fg)] shadow-[var(--shadow-btn-primary)] disabled:opacity-40 ${ring}`}>
          Apply {accepted.length} {accepted.length === 1 ? "change" : "changes"}
        </button>
      )}
    </section>
  );
}
