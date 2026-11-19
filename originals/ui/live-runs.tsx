"use client";

import { useEffect, useState } from "react";
import { CircleAlert, CircleCheck, Clock, LoaderCircle, X } from "lucide-react";

/* Live runs: a list of agent runs with status, a ticking elapsed timer for running ones, an optional progress bar and a cancel button. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export type RunStatus = "queued" | "running" | "done" | "failed";

export interface Run {
  id: string;
  name: string;
  status: RunStatus;
  /** Epoch ms the run started. */
  startedAt: number;
  /** 0 to 1. */
  progress?: number;
  /** Step or error text under the name. */
  detail?: string;
  /** Final duration in ms for finished runs. */
  durationMs?: number;
}

export interface LiveRunsProps {
  runs: Run[];
  onCancel?: (id: string) => void;
  /** Clock override, mainly for tests and stories. */
  now?: () => number;
  className?: string;
}

/** 4s, 1m 05s, 1h 02m. */
export function formatElapsed(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
  return `${Math.floor(s / 3600)}h ${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}m`;
}

const STATUS = {
  queued: { icon: Clock, label: "Queued", tone: "text-fg-subtle" },
  running: { icon: LoaderCircle, label: "Running", tone: "text-select-text" },
  done: { icon: CircleCheck, label: "Done", tone: "text-success-text" },
  failed: { icon: CircleAlert, label: "Failed", tone: "text-danger-text" },
} as const;

export function LiveRuns({ runs, onCancel, now = Date.now, className = "" }: LiveRunsProps) {
  const [tick, setTick] = useState(() => now());
  const anyRunning = runs.some((r) => r.status === "running");
  useEffect(() => {
    if (!anyRunning) return;
    const timer = setInterval(() => setTick(now()), 1000);
    return () => clearInterval(timer);
  }, [anyRunning, now]);

  return (
    <ul aria-label="Runs" aria-live="polite" className={`divide-y divide-track overflow-hidden rounded-[16px] bg-surface shadow-[var(--shadow-card)] dark:bg-raised ${className}`}>
      {runs.map((r) => {
        const { icon: Icon, label, tone } = STATUS[r.status];
        const elapsed = r.status === "running" ? Math.max(tick, r.startedAt) - r.startedAt : r.durationMs;
        return (
          <li key={r.id} className="flex items-center gap-3 px-4 py-3">
            <Icon size={16} aria-hidden className={`${tone} ${r.status === "running" ? "animate-spin motion-reduce:animate-none" : ""}`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <p className="truncate text-[13px] font-medium text-fg">{r.name}</p>
                <span className="shrink-0 text-xs tabular-nums text-fg-subtle">
                  <span className={tone}>{label}</span>
                  {elapsed !== undefined && ` · ${formatElapsed(elapsed)}`}
                </span>
              </div>
              {r.detail && <p className="truncate text-xs text-fg-muted">{r.detail}</p>}
              {r.status === "running" && r.progress !== undefined && (
                <div role="progressbar" aria-label={`${r.name} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(r.progress * 100)} className="mt-2 h-1 overflow-hidden rounded-full bg-track">
                  <div className="h-full rounded-full bg-select transition-[width]" style={{ width: `${Math.round(Math.min(Math.max(r.progress, 0), 1) * 100)}%` }} />
                </div>
              )}
            </div>
            {onCancel && (r.status === "running" || r.status === "queued") && (
              <button type="button" aria-label={`Cancel ${r.name}`} onClick={() => onCancel(r.id)} className={`grid size-8 place-items-center rounded-lg text-fg-muted hover:bg-subtle ${ring}`}>
                <X size={15} aria-hidden />
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
