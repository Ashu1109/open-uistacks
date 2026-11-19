"use client";

import { useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check, Circle, CircleDashed, CircleDot, CircleX, SignalHigh, SignalLow, SignalMedium, TriangleAlert, type LucideIcon } from "lucide-react";
import { initials } from "./board-card";
import { formatRelativeTime } from "./activity-feed";

/* Issue row: one line of an issue tracker with its key, status icon, title, labels, priority, assignee and last-updated time. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-inset";

export type IssueStatus = "backlog" | "todo" | "in-progress" | "done" | "canceled";
export type IssuePriority = "urgent" | "high" | "medium" | "low" | "none";

export const STATUS_META: Record<IssueStatus, { label: string; icon: LucideIcon; tone: string }> = {
  backlog: { label: "Backlog", icon: CircleDashed, tone: "text-fg-subtle" },
  todo: { label: "Todo", icon: Circle, tone: "text-fg-muted" },
  "in-progress": { label: "In progress", icon: CircleDot, tone: "text-warning" },
  done: { label: "Done", icon: Check, tone: "text-success" },
  canceled: { label: "Canceled", icon: CircleX, tone: "text-fg-subtle" },
};

export const PRIORITY_META: Record<IssuePriority, { label: string; icon: LucideIcon | null; tone: string }> = {
  urgent: { label: "Urgent", icon: TriangleAlert, tone: "text-danger-text" },
  high: { label: "High", icon: SignalHigh, tone: "text-fg" },
  medium: { label: "Medium", icon: SignalMedium, tone: "text-fg-muted" },
  low: { label: "Low", icon: SignalLow, tone: "text-fg-subtle" },
  none: { label: "No priority", icon: null, tone: "text-fg-subtle" },
};

export interface Issue {
  id: string;
  /** Short tracker key such as "ENG-142". */
  key: string;
  title: string;
  status: IssueStatus;
  priority?: IssuePriority;
  assignee?: string;
  labels?: string[];
  updatedAt?: Date | number;
}

export interface IssueRowProps {
  issue: Issue;
  selected?: boolean;
  onOpen?: (issue: Issue) => void;
  now?: Date | number;
  className?: string;
}

export function IssueRow({ issue, selected, onOpen, now, className = "" }: IssueRowProps) {
  const status = STATUS_META[issue.status];
  const priority = PRIORITY_META[issue.priority ?? "none"];
  const reduce = useReduce();
  const StatusIcon = status.icon;
  const PriorityIcon = priority.icon;
  return (
    <motion.button
      type="button"
      whileTap={reduce ? undefined : { scale: 0.99 }}
      transition={{ type: "spring", stiffness: 520, damping: 34 }}
      data-issue-row
      aria-current={selected ? "true" : undefined}
      onClick={() => onOpen?.(issue)}
      className={`relative isolate flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-[color-mix(in_srgb,var(--fg)_4%,var(--surface))] ${ring} ${className}`}
    >
      {selected && (
        <motion.span
          aria-hidden
          layoutId={reduce ? undefined : "issue-selected"}
          transition={{ type: "spring", stiffness: 500, damping: 38 }}
          className="absolute inset-0 -z-10 bg-select-soft"
        />
      )}
      <span title={priority.label} className={`grid w-4 shrink-0 place-items-center ${priority.tone}`}>
        {PriorityIcon ? <PriorityIcon size={15} aria-hidden /> : <span aria-hidden>–</span>}
        <span className="sr-only">Priority: {priority.label}</span>
      </span>
      <span className="w-16 shrink-0 text-xs tabular-nums text-fg-subtle">{issue.key}</span>
      <motion.span key={issue.status} initial={reduce ? false : { scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 520, damping: 22 }} title={status.label} className={`shrink-0 ${status.tone}`}>
        <StatusIcon size={16} aria-hidden />
        <span className="sr-only">Status: {status.label}</span>
      </motion.span>
      <span className="min-w-0 flex-1 truncate text-sm text-fg">{issue.title}</span>
      {issue.labels?.map((l) => <span key={l} className="hidden shrink-0 rounded-full bg-subtle px-2 py-0.5 text-[11px] text-fg-muted sm:inline">{l}</span>)}
      {issue.updatedAt !== undefined && <span className="hidden w-14 shrink-0 text-right text-xs text-fg-subtle sm:block">{formatRelativeTime(issue.updatedAt, now)}</span>}
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-select-soft text-[10px] font-medium text-select-text" title={issue.assignee ?? "Unassigned"}>
        <span aria-hidden>{issue.assignee ? initials(issue.assignee) : ""}</span>
        <span className="sr-only">{issue.assignee ? `Assigned to ${issue.assignee}` : "Unassigned"}</span>
      </span>
    </motion.button>
  );
}
