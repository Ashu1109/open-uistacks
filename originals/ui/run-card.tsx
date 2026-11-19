"use client";

import { CircleCheck, CircleX, Loader2, Square } from "lucide-react";
import { formatMs } from "./tool-call";

/* Run card: summary of one agent run with status, step progress, elapsed time and cost, plus Stop while running and Open details. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export type RunStatus = "running" | "succeeded" | "failed" | "stopped";

export function runProgress(done: number, total: number): number {
  return total > 0 ? Math.min(Math.max(done / total, 0), 1) : 0;
}

export function formatCost(usd: number): string {
  return usd < 0.01 && usd > 0 ? "<$0.01" : `$${usd.toFixed(2)}`;
}

const STATUS: Record<RunStatus, { label: string; tone: string; bar: string }> = {
  running: { label: "Running", tone: "bg-select-soft text-select-text", bar: "var(--select)" },
  succeeded: { label: "Succeeded", tone: "bg-success-soft text-success-text", bar: "var(--success)" },
  failed: { label: "Failed", tone: "bg-danger-soft text-danger-text", bar: "var(--danger)" },
  stopped: { label: "Stopped", tone: "bg-subtle text-fg-muted", bar: "var(--series-3)" },
};

export interface RunCardProps {
  title: string;
  agent: string;
  status: RunStatus;
  stepsDone: number;
  stepsTotal: number;
  elapsedMs: number;
  costUsd?: number;
  onStop?: () => void;
  onOpen?: () => void;
  className?: string;
}

export function RunCard({ title, agent, status, stepsDone, stepsTotal, elapsedMs, costUsd, onStop, onOpen, className = "" }: RunCardProps) {
  const s = STATUS[status];
  const pct = Math.round(runProgress(stepsDone, stepsTotal) * 100);
  const Icon = status === "running" ? Loader2 : status === "succeeded" ? CircleCheck : status === "failed" ? CircleX : Square;
  return (
    <article aria-label={`Run: ${title}`} className={`rounded-[16px] bg-surface p-4 shadow-[var(--shadow-card)] dark:bg-raised ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="truncate text-sm font-medium text-fg">{title}</h4>
          <p className="text-xs text-fg-subtle">{agent}</p>
        </div>
        <span role="status" className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${s.tone}`}>
          <Icon size={11} aria-hidden className={status === "running" ? "animate-spin motion-reduce:animate-none" : ""} />
          {s.label}
        </span>
      </div>
      <div role="progressbar" aria-label="Steps completed" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="mt-3 h-1.5 overflow-hidden rounded-full bg-track">
        <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${pct}%`, background: s.bar }} />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs tabular-nums text-fg-muted">
        <span>{stepsDone} of {stepsTotal} steps</span>
        <span>{formatMs(elapsedMs)}{costUsd !== undefined && ` · ${formatCost(costUsd)}`}</span>
      </div>
      {(onStop || onOpen) && (
        <div className="mt-3 flex justify-end gap-2">
          {onStop && status === "running" && (
            <button type="button" onClick={onStop} className={`h-8 rounded-[10px] px-3 text-[13px] text-danger-text hover:bg-danger-soft ${ring}`}>Stop</button>
          )}
          {onOpen && (
            <button type="button" onClick={onOpen} className={`h-8 rounded-[10px] bg-subtle px-3 text-[13px] text-fg hover:bg-track ${ring}`}>Open details</button>
          )}
        </div>
      )}
    </article>
  );
}
