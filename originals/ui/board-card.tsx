"use client";

import { useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Calendar, MessageSquare } from "lucide-react";

/* Board card: the compact work item shown on a kanban board, with labels, title, due date, comment count and an assignee avatar. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

export type LabelTone = "neutral" | "info" | "success" | "warning" | "danger";

const TONE: Record<LabelTone, string> = {
  neutral: "bg-subtle text-fg-muted",
  info: "bg-select-soft text-select-text",
  success: "bg-success-soft text-success-text",
  warning: "bg-warning-soft text-warning-text",
  danger: "bg-danger-soft text-danger-text",
};

export interface BoardCardLabel {
  text: string;
  tone?: LabelTone;
}

export interface BoardCardProps {
  title: string;
  labels?: BoardCardLabel[];
  assignee?: string;
  /** Short display text such as "Nov 24". */
  due?: string;
  overdue?: boolean;
  comments?: number;
  /** Renders the title as a button when given. */
  onOpen?: () => void;
  className?: string;
}

export function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join("");
}

export function BoardCard({ title, labels, assignee, due, overdue, comments, onOpen, className = "" }: BoardCardProps) {
  const reduce = useReduce();
  const heading = onOpen ? (
    <button type="button" onClick={onOpen} className="text-left outline-none focus-visible:underline">{title}</button>
  ) : title;
  return (
    <motion.div
      whileHover={reduce ? undefined : { y: -2 }}
      transition={{ type: "spring", stiffness: 520, damping: 34 }}
      className={`grid gap-2.5 rounded-[14px] bg-surface p-3 shadow-[var(--shadow-card)] transition-shadow duration-150 hover:shadow-[0_6px_18px_-8px_color-mix(in_srgb,var(--fg)_30%,transparent)] dark:bg-raised ${className}`}
    >
      {labels && labels.length > 0 && (
        <ul aria-label="Labels" className="flex flex-wrap gap-1">
          {labels.map((l) => <li key={l.text} className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${TONE[l.tone ?? "neutral"]}`}>{l.text}</li>)}
        </ul>
      )}
      <p className="text-sm font-medium leading-5 text-fg">{heading}</p>
      <div className="flex items-center gap-3 text-xs text-fg-muted">
        {due && (
          <span className={`flex items-center gap-1 ${overdue ? "text-danger-text" : ""}`}>
            <Calendar size={13} aria-hidden /> <span className="sr-only">{overdue ? "Overdue, due" : "Due"}</span>{due}
          </span>
        )}
        {comments !== undefined && comments > 0 && (
          <span className="flex items-center gap-1"><MessageSquare size={13} aria-hidden /> <span className="sr-only">Comments </span>{comments}</span>
        )}
        {assignee && (
          <span title={assignee} className="ml-auto grid size-6 place-items-center rounded-full bg-select-soft text-[10px] font-medium text-select-text">
            <span aria-hidden>{initials(assignee)}</span>
            <span className="sr-only">Assigned to {assignee}</span>
          </span>
        )}
      </div>
    </motion.div>
  );
}
