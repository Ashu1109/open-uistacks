"use client";

import { useId, useState, useSyncExternalStore, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, ChevronDown, PartyPopper, X } from "lucide-react";
import { useControlled } from "./dialog";

/* Onboarding checklist: a card of getting-started tasks with a progress bar, check-off toggles, per-task actions, a collapse control and a celebratory finish state with dismiss. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface ChecklistTask {
  id: string;
  title: string;
  description?: string;
  /** Button shown on an unfinished task. */
  action?: { label: string; onClick: () => void };
}

/** Completed count, total and whole-number percent, ignoring completed ids that match no task. */
export function progressOf(tasks: ChecklistTask[], completed: string[]) {
  const done = tasks.filter((t) => completed.includes(t.id)).length;
  return { done, total: tasks.length, percent: tasks.length === 0 ? 0 : Math.round((done / tasks.length) * 100) };
}

export interface OnboardingChecklistProps {
  tasks: ChecklistTask[];
  /** Ids of finished tasks. */
  completed?: string[];
  defaultCompleted?: string[];
  onCompletedChange?: (completed: string[]) => void;
  title?: string;
  description?: ReactNode;
  defaultCollapsed?: boolean;
  /** Shows a close button; it also appears as "Dismiss" once everything is done. */
  onDismiss?: () => void;
  className?: string;
}

export function OnboardingChecklist({ tasks, completed: completedProp, defaultCompleted = [], onCompletedChange, title = "Get started", description, defaultCollapsed = false, onDismiss, className = "" }: OnboardingChecklistProps) {
  const id = useId();
  const reduce = useReduce();
  const [completed, setCompleted] = useControlled(completedProp, defaultCompleted, onCompletedChange);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const { done, total, percent } = progressOf(tasks, completed);
  const finished = total > 0 && done === total;
  const toggle = (taskId: string) => setCompleted(completed.includes(taskId) ? completed.filter((c) => c !== taskId) : [...completed, taskId]);

  return (
    <section aria-labelledby={`${id}-title`} className={`w-full max-w-sm rounded-[20px] bg-surface p-4 shadow-[var(--shadow-card)] dark:bg-raised ${className}`}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 id={`${id}-title`} className="text-sm font-semibold text-fg">{title}</h3>
          {description && <p className="mt-0.5 text-[13px] leading-[18px] text-fg-muted">{description}</p>}
        </div>
        <button type="button" aria-label={collapsed ? "Expand checklist" : "Collapse checklist"} aria-expanded={!collapsed} aria-controls={`${id}-body`} onClick={() => setCollapsed((c) => !c)} className={`grid size-7 place-items-center rounded-full text-fg-muted transition-colors hover:bg-subtle hover:text-fg ${ring}`}>
          <ChevronDown size={16} strokeWidth={2} aria-hidden className={`transition-transform ${collapsed ? "" : "rotate-180"}`} />
        </button>
        {onDismiss && (
          <button type="button" aria-label="Dismiss checklist" onClick={onDismiss} className={`grid size-7 place-items-center rounded-full text-fg-muted transition-colors hover:bg-subtle hover:text-fg ${ring}`}>
            <X size={15} strokeWidth={2} aria-hidden />
          </button>
        )}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div role="progressbar" aria-label={`${title} progress`} aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-valuetext={`${done} of ${total} complete`} className="h-1.5 flex-1 overflow-hidden rounded-full bg-track">
          <motion.div initial={false} animate={{ width: `${percent}%` }} transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 34 }} className={`h-full rounded-full ${finished ? "bg-success" : "bg-select"}`} />
        </div>
        <span className="text-xs tabular-nums text-fg-muted">{done} of {total}</span>
      </div>
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            id={`${id}-body`}
            initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 34 }}
            className="overflow-hidden"
          >
            {finished && (
              <div role="status" className="mt-3 flex items-center gap-2 rounded-[12px] bg-success-soft px-3 py-2 text-sm text-success-text">
                <PartyPopper size={16} strokeWidth={2} aria-hidden />
                <span className="flex-1">All set. Nice work.</span>
                {onDismiss && <button type="button" onClick={onDismiss} className={`rounded-full px-2 py-0.5 font-medium underline-offset-2 hover:underline ${ring}`}>Dismiss</button>}
              </div>
            )}
            <ul className="mt-2 grid gap-0.5">
              {tasks.map((task) => {
                const isDone = completed.includes(task.id);
                return (
                  <li key={task.id} className="flex items-start gap-3 rounded-[12px] px-1 py-2">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={isDone}
                      aria-labelledby={`${id}-${task.id}`}
                      onClick={() => toggle(task.id)}
                      className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full transition-colors ${isDone ? "bg-success text-white" : "bg-subtle shadow-[inset_0_0_0_1.5px_var(--track-strong)] hover:bg-track"} ${ring}`}
                    >
                      {isDone && <Check size={12} strokeWidth={3.5} aria-hidden />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p id={`${id}-${task.id}`} className={`text-sm ${isDone ? "text-fg-subtle line-through" : "font-medium text-fg"}`}>{task.title}</p>
                      {task.description && !isDone && <p className="mt-0.5 text-[13px] leading-[18px] text-fg-muted">{task.description}</p>}
                      {task.action && !isDone && (
                        <button type="button" onClick={task.action.onClick} className={`mt-2 rounded-full bg-select-soft px-3 py-1 text-[13px] font-medium text-select-text transition-opacity hover:opacity-80 ${ring}`}>
                          {task.action.label}
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
