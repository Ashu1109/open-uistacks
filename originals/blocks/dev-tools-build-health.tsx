"use client";

import { CircleCheck, CircleX, LoaderCircle, GitBranch } from "lucide-react";
import { Badge } from "../../registry/ui/badge";

/* Dev tools build health: CI status per branch with the last twelve runs as a strip and the pass rate. A card, 1/2 width of a 12-column grid (6 columns), responsive to its container. */

export type BuildState = "passing" | "failing" | "running";

export interface BranchBuild {
  branch: string;
  state: BuildState;
  commit: string;
  durationSec: number;
  /** Most recent last; true means the run passed. */
  history: boolean[];
}

export interface DevToolsBuildHealthProps {
  branches?: BranchBuild[];
  onOpenBranch?: (branch: string) => void;
  className?: string;
}

export const DEMO_BRANCHES: BranchBuild[] = [
  { branch: "main", state: "passing", commit: "a41f9c2", durationSec: 412, history: [true, true, true, false, true, true, true, true, true, true, true, true] },
  { branch: "release/2.8", state: "passing", commit: "7be03d1", durationSec: 438, history: [true, true, true, true, true, true, false, true, true, true, true, true] },
  { branch: "feat/billing-retries", state: "running", commit: "c9d2e70", durationSec: 187, history: [false, true, false, true, true, false, true, true, true, false, true, true] },
  { branch: "fix/queue-deadlock", state: "failing", commit: "02aa6f8", durationSec: 354, history: [true, true, false, false, true, false, false, true, false, false, false, false] },
  { branch: "chore/upgrade-node", state: "passing", commit: "e18b4a5", durationSec: 396, history: [true, false, true, true, true, true, true, true, false, true, true, true] },
];

export function passRate(history: boolean[]): number {
  return history.length === 0 ? 0 : Math.round((history.filter(Boolean).length / history.length) * 100);
}

export function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

const STATE_UI = {
  passing: { label: "Passing", tone: "success", Icon: CircleCheck },
  failing: { label: "Failing", tone: "danger", Icon: CircleX },
  running: { label: "Running", tone: "accent", Icon: LoaderCircle },
} as const;

export function DevToolsBuildHealth({ branches = DEMO_BRANCHES, onOpenBranch, className = "" }: DevToolsBuildHealthProps) {
  const failing = branches.filter((b) => b.state === "failing").length;
  return (
    <section aria-label="Build health" className={`@container rounded-[20px] bg-surface p-4 shadow-[var(--shadow-card)] @[480px]:p-5 ${className}`}>
      <header className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-[15px] font-semibold text-fg">Build health</h2>
        <Badge tone={failing ? "danger" : "success"} dot>
          {failing ? `${failing} failing` : "All green"}
        </Badge>
      </header>
      <ul className="grid gap-1">
        {branches.map((b) => {
          const ui = STATE_UI[b.state];
          return (
            <li key={b.branch}>
              <button
                type="button"
                onClick={() => onOpenBranch?.(b.branch)}
                aria-label={`${b.branch}, ${ui.label}, pass rate ${passRate(b.history)} percent`}
                className={`flex w-full items-center gap-3 rounded-[12px] px-2 py-2 text-left hover:bg-[color-mix(in_srgb,var(--fg)_4%,var(--surface))] ${ring}`}
              >
                <ui.Icon size={18} aria-hidden className={`${b.state === "running" ? "animate-spin motion-reduce:animate-none" : ""} shrink-0`} style={{ color: b.state === "passing" ? "var(--success)" : b.state === "failing" ? "var(--danger)" : "var(--select)" }} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-[14px] font-medium text-fg">
                    <GitBranch size={13} aria-hidden className="shrink-0 text-fg-subtle" />
                    <span className="truncate">{b.branch}</span>
                  </span>
                  <span className="block truncate text-[12px] text-fg-muted">
                    {b.commit} · {formatDuration(b.durationSec)}
                  </span>
                </span>
                <span aria-hidden className="hidden items-end gap-[3px] @[400px]:flex">
                  {b.history.map((ok, i) => (
                    <span key={i} className="w-[5px] rounded-full" style={{ height: ok ? 18 : 10, background: ok ? "var(--success)" : "var(--danger)", opacity: 0.35 + (i / b.history.length) * 0.65 }} />
                  ))}
                </span>
                <span className="w-10 text-right text-[13px] font-medium tabular-nums text-fg-muted">{passRate(b.history)}%</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
