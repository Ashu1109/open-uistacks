"use client";

import { Check, Circle, Loader2, X } from "lucide-react";

/* Plan card: the steps an agent intends to take, each with a status, and Approve / Reject buttons while the plan awaits a decision. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export type PlanStepStatus = "pending" | "active" | "done" | "skipped";
export interface PlanStep {
  id: string;
  title: string;
  detail?: string;
  status: PlanStepStatus;
}

export function planProgress(steps: PlanStep[]): { done: number; total: number } {
  return { done: steps.filter((s) => s.status === "done").length, total: steps.length };
}

export interface PlanCardProps {
  title: string;
  steps: PlanStep[];
  /** Shows the decision buttons when provided. */
  onApprove?: () => void;
  onReject?: () => void;
  className?: string;
}

function StepIcon({ status }: { status: PlanStepStatus }) {
  if (status === "done") return <span className="grid size-5 place-items-center rounded-full bg-success text-[var(--inverse-fg)]"><Check size={12} aria-hidden /></span>;
  if (status === "active") return <Loader2 size={20} aria-hidden className="animate-spin text-select motion-reduce:animate-none" />;
  if (status === "skipped") return <X size={20} aria-hidden className="text-fg-subtle" />;
  return <Circle size={20} aria-hidden className="text-track-strong" />;
}

export function PlanCard({ title, steps, onApprove, onReject, className = "" }: PlanCardProps) {
  const { done, total } = planProgress(steps);
  return (
    <section aria-label={title} className={`rounded-[16px] bg-surface p-4 shadow-[var(--shadow-card)] dark:bg-raised ${className}`}>
      <div className="flex items-baseline justify-between">
        <h4 className="text-sm font-medium text-fg">{title}</h4>
        <span className="text-xs tabular-nums text-fg-subtle">{done}/{total}</span>
      </div>
      <ol className="mt-3 space-y-3">
        {steps.map((s) => (
          <li key={s.id} aria-current={s.status === "active" ? "step" : undefined} className="flex gap-3">
            <StepIcon status={s.status} />
            <div className="min-w-0">
              <p className={`text-[13px] ${s.status === "done" || s.status === "skipped" ? "text-fg-muted" : "text-fg"} ${s.status === "skipped" ? "line-through" : ""}`}>
                {s.title}
                <span className="sr-only"> ({s.status})</span>
              </p>
              {s.detail && <p className="text-xs text-fg-subtle">{s.detail}</p>}
            </div>
          </li>
        ))}
      </ol>
      {(onApprove || onReject) && (
        <div className="mt-4 flex justify-end gap-2">
          {onReject && <button type="button" onClick={onReject} className={`h-8 rounded-[10px] px-3 text-[13px] text-fg-muted hover:bg-subtle ${ring}`}>Reject</button>}
          {onApprove && (
            <button type="button" onClick={onApprove} className={`h-8 rounded-[10px] bg-[image:var(--grad-primary)] px-3 text-[13px] text-[var(--inverse-fg)] shadow-[var(--shadow-btn-primary)] ${ring}`}>Approve plan</button>
          )}
        </div>
      )}
    </section>
  );
}
