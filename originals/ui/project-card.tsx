"use client";

import { initials } from "./board-card";

/* Project card: a project summary with status badge, description, task progress bar, due date and member avatars; becomes a link or button when given href or onOpen. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export type ProjectStatus = "on-track" | "at-risk" | "off-track" | "done";

const STATUS: Record<ProjectStatus, { label: string; tone: string }> = {
  "on-track": { label: "On track", tone: "bg-success-soft text-success-text" },
  "at-risk": { label: "At risk", tone: "bg-warning-soft text-warning-text" },
  "off-track": { label: "Off track", tone: "bg-danger-soft text-danger-text" },
  done: { label: "Done", tone: "bg-select-soft text-select-text" },
};

export interface ProjectCardProps {
  name: string;
  description?: string;
  status?: ProjectStatus;
  tasksDone: number;
  tasksTotal: number;
  due?: string;
  members?: string[];
  href?: string;
  onOpen?: () => void;
  className?: string;
}

export function projectProgress(done: number, total: number): number {
  return total > 0 ? Math.min(Math.max(Math.round((done / total) * 100), 0), 100) : 0;
}

export function ProjectCard({ name, description, status = "on-track", tasksDone, tasksTotal, due, members = [], href, onOpen, className = "" }: ProjectCardProps) {
  const pct = projectProgress(tasksDone, tasksTotal);
  const badge = STATUS[status];
  const title = <span className="text-[15px] font-medium text-fg">{name}</span>;
  const heading = href ? (
    <a href={href} className={`rounded after:absolute after:inset-0 after:rounded-[20px] ${ring}`}>{title}</a>
  ) : onOpen ? (
    <button type="button" onClick={onOpen} className={`rounded text-left after:absolute after:inset-0 after:rounded-[20px] ${ring}`}>{title}</button>
  ) : title;

  return (
    <article className={`relative grid gap-3.5 rounded-[20px] bg-surface p-5 shadow-[var(--shadow-card)] dark:bg-raised ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <h4>{heading}</h4>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${badge.tone}`}>{badge.label}</span>
      </div>
      {description && <p className="line-clamp-2 text-sm leading-5 text-fg-muted">{description}</p>}
      <div className="grid gap-1.5">
        <div className="flex justify-between text-xs text-fg-muted tabular-nums">
          <span>{tasksDone} of {tasksTotal} tasks</span>
          <span>{pct}%</span>
        </div>
        <div role="progressbar" aria-label={`${name} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="h-1.5 overflow-hidden rounded-full bg-track">
          <div className="h-full rounded-full bg-select transition-[width] duration-300" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-fg-muted">
        <span>{due ? `Due ${due}` : "No due date"}</span>
        {members.length > 0 && (
          <ul aria-label="Members" className="flex -space-x-1.5">
            {members.slice(0, 4).map((m) => (
              <li key={m} title={m} className="grid size-6 place-items-center rounded-full bg-select-soft text-[10px] font-medium text-select-text ring-2 ring-[var(--surface)]">
                <span aria-hidden>{initials(m)}</span><span className="sr-only">{m}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
