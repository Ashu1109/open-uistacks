"use client";

import { GanttRow, barGeometry, daysBetween } from "./gantt-row";

/* GanttChart: a timeline of tasks as bars across a date range, with week gridlines, a month header and a vertical line for today. */

export interface GanttTask {
  id: string;
  label: string;
  start: Date;
  end: Date;
  progress?: number;
  color?: string;
}

/** The earliest start and latest end across tasks. */
export function taskRange(tasks: readonly GanttTask[]): { start: Date; end: Date } {
  const starts = tasks.map((t) => t.start.getTime());
  const ends = tasks.map((t) => t.end.getTime());
  return { start: new Date(Math.min(...starts)), end: new Date(Math.max(...ends)) };
}

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const weekFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

export interface GanttChartProps {
  tasks: readonly GanttTask[];
  /** Visible range; defaults to the span of the tasks. */
  rangeStart?: Date;
  rangeEnd?: Date;
  /** Draws the today line; defaults to the current date. */
  today?: Date;
  labelWidth?: number;
  className?: string;
}

export function GanttChart({ tasks, rangeStart, rangeEnd, today = new Date(), labelWidth = 160, className = "" }: GanttChartProps) {
  if (tasks.length === 0) return <p className="text-sm text-fg-muted">No tasks</p>;
  const span = taskRange(tasks);
  const start = rangeStart ?? span.start;
  const end = rangeEnd ?? span.end;
  const total = daysBetween(start, end) + 1;
  const ticks = Array.from({ length: Math.ceil(total / 7) }, (_, i) => addDays(start, i * 7));
  const todayLeft = barGeometry(today, today, start, end);
  const todayVisible = today >= start && today <= addDays(end, 1);

  return (
    <div role="table" aria-label="Project timeline" className={`overflow-x-auto rounded-[20px] bg-surface p-4 shadow-[var(--shadow-card)] ${className}`}>
      <div className="relative min-w-[560px]">
        <div role="row" className="flex h-7 text-[11px] text-fg-subtle">
          <div role="columnheader" style={{ width: labelWidth }} className="shrink-0">Task</div>
          <div role="columnheader" className="relative flex-1">
            {ticks.map((t) => (
              <span key={t.toISOString()} style={{ left: `${(daysBetween(start, t) / total) * 100}%` }} className="absolute whitespace-nowrap pl-1.5">{weekFmt.format(t)}</span>
            ))}
          </div>
        </div>
        <div style={{ left: labelWidth }} className="pointer-events-none absolute inset-y-7 right-0" aria-hidden>
          {ticks.map((t) => <span key={t.toISOString()} style={{ left: `${(daysBetween(start, t) / total) * 100}%` }} className="absolute inset-y-0 w-px bg-track" />)}
          {todayVisible && (
            <span data-testid="today-line" style={{ left: `${todayLeft.left}%` }} className="absolute inset-y-0 w-0.5 bg-danger">
              <span className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rounded-full bg-danger" />
            </span>
          )}
        </div>
        {tasks.map((t, i) => (
          <GanttRow key={t.id} label={t.label} start={t.start} end={t.end} rangeStart={start} rangeEnd={end} progress={t.progress} color={t.color} labelWidth={labelWidth} delay={i * 0.06} />
        ))}
      </div>
    </div>
  );
}
