"use client";

import { ArrowRight } from "lucide-react";

/* Agent handoff: a card showing one agent passing a task to another, with the reason, the context being carried over, and a status with approve / cancel actions while pending. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export type HandoffStatus = "pending" | "accepted" | "declined";

export interface HandoffAgent {
  name: string;
  role?: string;
}

export interface AgentHandoffProps {
  from: HandoffAgent;
  to: HandoffAgent;
  reason: string;
  /** What travels with the task: files, memory, summaries. */
  context?: string[];
  status: HandoffStatus;
  onApprove?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

const STATUS: Record<HandoffStatus, { label: string; tone: string }> = {
  pending: { label: "Waiting for approval", tone: "bg-warning-soft text-warning-text" },
  accepted: { label: "Handed off", tone: "bg-success-soft text-success-text" },
  declined: { label: "Cancelled", tone: "bg-danger-soft text-danger-text" },
};

function Party({ agent, tone }: { agent: HandoffAgent; tone: string }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1.5 text-center">
      <span aria-hidden className={`grid size-11 place-items-center rounded-full text-sm font-medium ${tone}`}>{initials(agent.name)}</span>
      <p className="max-w-full truncate text-[13px] font-medium text-fg">{agent.name}</p>
      {agent.role && <p className="max-w-full truncate text-xs text-fg-subtle">{agent.role}</p>}
    </div>
  );
}

export function AgentHandoff({ from, to, reason, context = [], status, onApprove, onCancel, className = "" }: AgentHandoffProps) {
  const s = STATUS[status];
  return (
    <article aria-label={`Handoff from ${from.name} to ${to.name}`} className={`w-full max-w-md rounded-[20px] bg-surface p-5 shadow-[var(--shadow-card)] dark:bg-raised ${className}`}>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <Party agent={from} tone="bg-subtle text-fg-muted" />
        <ArrowRight size={18} aria-hidden className={status === "pending" ? "animate-pulse text-select motion-reduce:animate-none" : "text-fg-subtle"} />
        <Party agent={to} tone="bg-select-soft text-select-text" />
      </div>
      <p className="mt-4 text-sm leading-relaxed text-fg-muted">{reason}</p>
      {context.length > 0 && (
        <ul aria-label="Carried context" className="mt-3 flex flex-wrap gap-1.5">
          {context.map((c) => (
            <li key={c} className="rounded-full bg-subtle px-2.5 py-1 text-xs text-fg-muted">{c}</li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-track pt-3">
        <span role="status" className={`rounded-full px-2.5 py-1 text-xs font-medium ${s.tone}`}>{s.label}</span>
        {status === "pending" && (
          <div className="flex gap-2">
            {onCancel && <button type="button" onClick={onCancel} className={`h-8 rounded-[10px] px-3 text-[13px] text-fg-muted hover:bg-subtle ${ring}`}>Cancel</button>}
            {onApprove && <button type="button" onClick={onApprove} className={`h-8 rounded-[10px] bg-[image:var(--grad-primary)] px-3 text-[13px] font-medium text-[var(--inverse-fg)] shadow-[var(--shadow-btn-primary)] ${ring}`}>Approve</button>}
          </div>
        )}
      </div>
    </article>
  );
}
