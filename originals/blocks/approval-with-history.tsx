"use client";

import { useState } from "react";
import { Check, ShieldCheck, X } from "lucide-react";
import { ApprovalRequest } from "../../registry/ui/approval-request";

/* Approval with history: a half-width card pairing one pending approval request with the earlier decisions on the same tool, so a reviewer sees precedent; deciding adds the new entry to the top of the history. */

export type Decision = "approved" | "always" | "denied";

export interface DecisionEntry {
  id: string;
  decision: Decision;
  by: string;
  at: string;
  note?: string;
}

export interface ApprovalWithHistoryProps {
  agent?: string;
  tool?: string;
  title?: string;
  description?: string;
  risk?: "low" | "high";
  details?: { label: string; value: string; mono?: boolean }[];
  history?: DecisionEntry[];
  /** Who is shown as the decider on the entry added by this card. */
  reviewer?: string;
  onDecide?: (decision: Decision) => void;
  className?: string;
}

export const DEMO_HISTORY: DecisionEntry[] = [
  { id: "h1", decision: "approved", by: "Mara Quinn", at: "Yesterday, 16:20", note: "Amount under the $100 limit." },
  { id: "h2", decision: "denied", by: "Jonas Pell", at: "Mon, 09:05", note: "Customer was already refunded." },
  { id: "h3", decision: "approved", by: "Mara Quinn", at: "Oct 28, 11:42" },
];

const LABEL: Record<Decision, string> = { approved: "Approved once", always: "Always allowed", denied: "Denied" };

export function decisionLabel(d: Decision): string {
  return LABEL[d];
}

export function approvalRate(history: DecisionEntry[]): number {
  if (history.length === 0) return 0;
  return Math.round((history.filter((h) => h.decision !== "denied").length / history.length) * 100);
}

export function ApprovalWithHistory({
  agent = "Refunds agent",
  tool = "payments.refund",
  title = "Refund $84.50 to the original card",
  description = "Order 20418 was delivered nine days ago and is inside the 30-day return window.",
  risk = "high",
  details = [{ label: "Tool", value: "payments.refund", mono: true }, { label: "Order", value: "#20418" }, { label: "Amount", value: "$84.50" }],
  history = DEMO_HISTORY,
  reviewer = "You",
  onDecide,
  className = "",
}: ApprovalWithHistoryProps) {
  const [added, setAdded] = useState<DecisionEntry[]>([]);
  const entries = [...added, ...history];

  const decide = (decision: Decision) => {
    setAdded((prev) => [{ id: `new-${prev.length}`, decision, by: reviewer, at: "Just now" }, ...prev]);
    onDecide?.(decision);
  };

  return (
    <section aria-label={`Approval for ${tool}`} className={`@container w-full ${className}`}>
      <ApprovalRequest
        className="max-w-none!"
        overline={agent}
        title={title}
        description={description}
        risk={risk}
        details={details}
        expiry="Expires in 9 min"
        onApprove={(scope) => decide(scope === "once" ? "approved" : "always")}
        onDeny={() => decide("denied")}
      />
      <div className="mt-3 rounded-[20px] bg-surface p-5 shadow-[var(--shadow-card)] dark:bg-raised">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium text-fg">Earlier decisions</h3>
          <span className="inline-flex items-center gap-1 text-xs text-fg-muted"><ShieldCheck size={13} aria-hidden />{approvalRate(entries)}% approved</span>
        </div>
        {entries.length === 0 ? (
          <p className="mt-3 text-sm text-fg-muted">No one has decided on this tool yet.</p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {entries.map((e) => {
              const denied = e.decision === "denied";
              const Icon = denied ? X : Check;
              return (
                <li key={e.id} className="flex items-start gap-3">
                  <span className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full ${denied ? "bg-danger-soft text-danger-text" : "bg-success-soft text-success-text"}`}><Icon size={13} aria-hidden /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-fg"><span className="font-medium">{decisionLabel(e.decision)}</span> by {e.by}</p>
                    <p className="text-xs text-fg-subtle">{e.at}</p>
                    {e.note && <p className="mt-1 text-[13px] text-fg-muted">{e.note}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
