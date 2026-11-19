"use client";

import type { ReactNode } from "react";
import { CheckCircle2, CircleDashed, Loader2, MinusCircle, XCircle } from "lucide-react";

/* Data pipelines nightly run: a full-width section drawing the nightly run as a timeline, one bar per task positioned by start offset and duration, so the critical path and failures read at a glance. */

export type RunTaskStatus = "success" | "failed" | "running" | "skipped" | "queued";

export interface RunTask {
  id: string;
  name: string;
  /** Minutes after the run began. */
  startMinute: number;
  durationMinutes: number;
  status: RunTaskStatus;
}

export interface DataPipelinesNightlyRunProps {
  tasks?: RunTask[];
  /** e.g. "Nightly run, Nov 17". */
  title?: string;
  /** e.g. "Started 1:00 AM". */
  startedLabel?: string;
  className?: string;
}

export const DEMO_RUN_TASKS: RunTask[] = [
  { id: "r1", name: "Extract orders", startMinute: 0, durationMinutes: 14, status: "success" },
  { id: "r2", name: "Extract billing", startMinute: 0, durationMinutes: 9, status: "success" },
  { id: "r3", name: "Extract support desk", startMinute: 0, durationMinutes: 6, status: "failed" },
  { id: "r4", name: "Stage and dedupe", startMinute: 14, durationMinutes: 18, status: "success" },
  { id: "r5", name: "Build models", startMinute: 32, durationMinutes: 26, status: "success" },
  { id: "r6", name: "Run data tests", startMinute: 58, durationMinutes: 11, status: "running" },
  { id: "r7", name: "Refresh dashboards", startMinute: 69, durationMinutes: 8, status: "queued" },
  { id: "r8", name: "Support rollups", startMinute: 32, durationMinutes: 0, status: "skipped" },
];

const toneVar: Record<RunTaskStatus, string> = {
  success: "var(--success)",
  failed: "var(--danger)",
  running: "var(--select)",
  skipped: "var(--fg-subtle)",
  queued: "var(--track)",
};
const NAME: Record<RunTaskStatus, string> = { success: "Succeeded", failed: "Failed", running: "Running", skipped: "Skipped", queued: "Queued" };
const ICON: Record<RunTaskStatus, ReactNode> = {
  success: <CheckCircle2 size={15} className="text-success-text" aria-hidden />,
  failed: <XCircle size={15} className="text-danger-text" aria-hidden />,
  running: <Loader2 size={15} className="animate-spin text-select-text motion-reduce:animate-none" aria-hidden />,
  skipped: <MinusCircle size={15} className="text-fg-subtle" aria-hidden />,
  queued: <CircleDashed size={15} className="text-fg-subtle" aria-hidden />,
};

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/** Each task's left offset and width as percentages of the whole run, and the run's length in minutes. */
export function layoutRun(tasks: readonly RunTask[]) {
  const total = Math.max(1, ...tasks.map((t) => t.startMinute + t.durationMinutes));
  const bars = tasks.map((t) => ({
    id: t.id,
    left: (t.startMinute / total) * 100,
    width: Math.max((t.durationMinutes / total) * 100, 1),
  }));
  return { total, bars };
}

export function DataPipelinesNightlyRun({ tasks = DEMO_RUN_TASKS, title = "Nightly run", startedLabel = "Started 1:00 AM", className = "" }: DataPipelinesNightlyRunProps) {
  const { total, bars } = layoutRun(tasks);
  const failed = tasks.filter((t) => t.status === "failed").length;
  const running = tasks.some((t) => t.status === "running");
  const summary = failed ? `${failed} failed` : running ? "In progress" : "Complete";
  return (
    <section aria-label="Nightly run timeline" className={`@container grid content-start gap-4 rounded-[20px] bg-surface p-5 shadow-[var(--shadow-card)] ${className}`}>
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-[15px] font-semibold text-fg">{title}</h2>
          <p className="text-[13px] text-fg-muted">
            {startedLabel} · {formatMinutes(total)} elapsed
          </p>
        </div>
        <p className={`text-sm font-medium ${failed ? "text-danger-text" : "text-fg-muted"}`}>{summary}</p>
      </header>
      <ol className="grid gap-1">
        {tasks.map((t, i) => (
          <li key={t.id} className="grid items-center gap-1 @[560px]:grid-cols-[minmax(0,200px)_1fr] @[560px]:gap-4">
            <span className="flex min-w-0 items-center gap-2 text-sm text-fg">
              {ICON[t.status]}
              <span className="truncate">{t.name}</span>
              <span className="sr-only">
                {NAME[t.status]}, starts at minute {t.startMinute}, {formatMinutes(t.durationMinutes)}
              </span>
            </span>
            <span className="relative h-5 rounded-[6px] bg-subtle" aria-hidden>
              <span
                className="absolute inset-y-1 rounded-[4px]"
                style={{ left: `${bars[i].left}%`, width: `${bars[i].width}%`, background: toneVar[t.status], opacity: t.status === "queued" ? 0.6 : 1 }}
              />
            </span>
          </li>
        ))}
      </ol>
      <div className="flex justify-between text-[12px] tabular-nums text-fg-subtle @[560px]:ml-[216px]" aria-hidden>
        <span>0</span>
        <span>{formatMinutes(total / 2)}</span>
        <span>{formatMinutes(total)}</span>
      </div>
    </section>
  );
}
