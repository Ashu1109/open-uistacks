"use client";

import { useState } from "react";
import { CircleAlert, CircleCheck, Clock, LoaderCircle } from "lucide-react";
import { SegmentedControl } from "../ui/segmented-control";

/* LLM ops agent runs: a full-width (12 columns) table of recent agent runs with status, steps, cost and duration, filterable by status, with the visible cost totalled. */

export type AgentRunStatus = "running" | "succeeded" | "failed" | "queued";

export interface AgentRunRow {
  id: string;
  agent: string;
  /** What the run was asked to do. */
  task: string;
  status: AgentRunStatus;
  steps: number;
  costUsd: number;
  durationMs: number;
  startedAt: string;
}

export const DEMO_AGENT_RUNS: AgentRunRow[] = [
  { id: "run_8f2a", agent: "Refund triage", task: "Classify 42 open refund tickets", status: "succeeded", steps: 14, costUsd: 0.184, durationMs: 38_400, startedAt: "2 min ago" },
  { id: "run_8f29", agent: "Contract reviewer", task: "Extract renewal terms from 9 PDFs", status: "running", steps: 7, costUsd: 0.412, durationMs: 95_000, startedAt: "4 min ago" },
  { id: "run_8f27", agent: "Release notes", task: "Draft notes for build 2.14", status: "failed", steps: 5, costUsd: 0.061, durationMs: 12_900, startedAt: "9 min ago" },
  { id: "run_8f24", agent: "Data cleaner", task: "Deduplicate vendor records", status: "succeeded", steps: 31, costUsd: 0.927, durationMs: 214_000, startedAt: "17 min ago" },
  { id: "run_8f22", agent: "Support digest", task: "Summarise overnight conversations", status: "queued", steps: 0, costUsd: 0, durationMs: 0, startedAt: "just now" },
  { id: "run_8f1e", agent: "Refund triage", task: "Classify 17 escalated tickets", status: "succeeded", steps: 9, costUsd: 0.097, durationMs: 21_600, startedAt: "26 min ago" },
  { id: "run_8f1a", agent: "Contract reviewer", task: "Flag unusual indemnity clauses", status: "failed", steps: 12, costUsd: 0.338, durationMs: 71_200, startedAt: "41 min ago" },
];

export function formatRunCost(usd: number): string {
  return usd === 0 ? "$0.00" : usd < 0.01 ? "<$0.01" : `$${usd.toFixed(usd < 1 ? 3 : 2)}`;
}

export function formatRunDuration(ms: number): string {
  if (ms <= 0) return "-";
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
}

export type AgentRunFilter = "all" | AgentRunStatus;

export function filterAgentRuns(runs: AgentRunRow[], filter: AgentRunFilter): AgentRunRow[] {
  return filter === "all" ? runs : runs.filter((r) => r.status === filter);
}

export function totalRunCost(runs: AgentRunRow[]): number {
  return runs.reduce((sum, r) => sum + r.costUsd, 0);
}

const STATUS = {
  running: { icon: LoaderCircle, label: "Running", tone: "text-select-text" },
  succeeded: { icon: CircleCheck, label: "Succeeded", tone: "text-success-text" },
  failed: { icon: CircleAlert, label: "Failed", tone: "text-danger-text" },
  queued: { icon: Clock, label: "Queued", tone: "text-fg-subtle" },
} as const;

export interface LlmOpsAgentRunsProps {
  runs?: AgentRunRow[];
  onOpenRun?: (id: string) => void;
  className?: string;
}

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export function LlmOpsAgentRuns({ runs = DEMO_AGENT_RUNS, onOpenRun, className = "" }: LlmOpsAgentRunsProps) {
  const [filter, setFilter] = useState<AgentRunFilter>("all");
  const shown = filterAgentRuns(runs, filter);
  const options = [
    { value: "all", label: "All" },
    { value: "running", label: "Running" },
    { value: "failed", label: "Failed" },
  ];

  return (
    <section aria-label="Recent agent runs" className={`@container rounded-[20px] bg-surface p-5 shadow-[var(--shadow-card)] dark:bg-raised ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold text-fg">Recent agent runs</h3>
          <p className="text-[13px] text-fg-muted">
            {shown.length} {shown.length === 1 ? "run" : "runs"} · <span className="tabular-nums">{formatRunCost(totalRunCost(shown))}</span> total
          </p>
        </div>
        <SegmentedControl label="Filter runs by status" size="sm" options={options} value={filter} onValueChange={(v) => setFilter(v as AgentRunFilter)} />
      </div>
      {shown.length === 0 ? (
        <p className="py-10 text-center text-[13px] text-fg-muted">No runs match this filter.</p>
      ) : (
        <ul className="mt-3 divide-y divide-[var(--track)]">
          {shown.map((run) => {
            const s = STATUS[run.status];
            const Icon = s.icon;
            return (
              <li key={run.id}>
                <button
                  type="button"
                  onClick={() => onOpenRun?.(run.id)}
                  aria-label={`${run.agent}, ${run.task}, ${s.label}`}
                  className={`grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 rounded-[10px] px-2 py-2.5 text-left hover:bg-[color-mix(in_srgb,var(--fg)_4%,var(--surface))] @[640px]:grid-cols-[minmax(0,1fr)_110px_60px_80px_80px_90px] ${ring}`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-medium text-fg">{run.agent}</span>
                    <span className="block truncate text-[12px] text-fg-muted">{run.task}</span>
                  </span>
                  <span className={`inline-flex items-center gap-1.5 text-[13px] ${s.tone}`}>
                    <Icon size={14} aria-hidden className={run.status === "running" ? "motion-safe:animate-spin" : ""} />
                    {s.label}
                  </span>
                  <span className="hidden text-right text-[13px] tabular-nums text-fg-muted @[640px]:block">{run.steps} steps</span>
                  <span className="hidden text-right text-[13px] tabular-nums text-fg @[640px]:block">{formatRunCost(run.costUsd)}</span>
                  <span className="hidden text-right text-[13px] tabular-nums text-fg-muted @[640px]:block">{formatRunDuration(run.durationMs)}</span>
                  <span className="hidden text-right text-[12px] text-fg-subtle @[640px]:block">{run.startedAt}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
