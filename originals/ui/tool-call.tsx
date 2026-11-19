"use client";

import { useId, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, ChevronRight, Loader2, Wrench, X } from "lucide-react";

/* Tool call: one tool invocation by an agent, showing name, argument summary, status and duration, expandable to the full arguments and result. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export type ToolCallStatus = "running" | "success" | "error";

/** 420 ms, 3.2 s, 1m 05s. */
export function formatMs(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1).replace(/\.0$/, "")} s`;
  return `${Math.floor(s / 60)}m ${String(Math.round(s % 60)).padStart(2, "0")}s`;
}

/** `query: "cats", limit: 5` clipped to a single line. */
export function summarizeArgs(args: Record<string, unknown>, max = 60): string {
  const text = Object.entries(args)
    .map(([k, v]) => `${k}: ${typeof v === "string" ? JSON.stringify(v) : JSON.stringify(v) ?? String(v)}`)
    .join(", ");
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

const STATUS_TEXT: Record<ToolCallStatus, string> = { running: "Running", success: "Done", error: "Failed" };

export interface ToolCallProps {
  name: string;
  args: Record<string, unknown>;
  result?: unknown;
  status: ToolCallStatus;
  durationMs?: number;
  defaultOpen?: boolean;
  className?: string;
}

export function ToolCall({ name, args, result, status, durationMs, defaultOpen = false, className = "" }: ToolCallProps) {
  const id = useId();
  const reduce = useReduce();
  const [open, setOpen] = useState(defaultOpen);
  const tone = status === "error" ? "bg-danger-soft text-danger-text" : status === "success" ? "bg-success-soft text-success-text" : "bg-select-soft text-select-text";
  const Icon = status === "running" ? Loader2 : status === "success" ? Check : X;
  const body = (label: string, value: unknown) => (
    <div>
      <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-fg-subtle">{label}</p>
      <pre className="max-h-48 overflow-auto rounded-[10px] bg-subtle p-2.5 font-mono text-xs text-fg">{typeof value === "string" ? value : JSON.stringify(value, null, 2)}</pre>
    </div>
  );
  return (
    <div className={`rounded-[14px] bg-surface shadow-[var(--shadow-card)] dark:bg-raised ${className}`}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center gap-2.5 rounded-[14px] px-3 py-2.5 text-left ${ring}`}
      >
        <Wrench size={14} aria-hidden className="shrink-0 text-fg-subtle" />
        <span className="font-mono text-[13px] font-medium text-fg">{name}</span>
        <span className="min-w-0 flex-1 truncate font-mono text-xs text-fg-subtle">{summarizeArgs(args)}</span>
        <span role="status" className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${tone}`}>
          <Icon size={11} aria-hidden className={status === "running" && !reduce ? "animate-spin" : ""} />
          {STATUS_TEXT[status]}
        </span>
        {durationMs !== undefined && <span className="text-xs tabular-nums text-fg-subtle">{formatMs(durationMs)}</span>}
        <ChevronRight size={14} aria-hidden className={`shrink-0 text-fg-subtle transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={id}
            initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 34 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 px-3 pb-3">
              {body("Arguments", args)}
              {result !== undefined && body("Result", result)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
