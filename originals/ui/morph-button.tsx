"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, LoaderCircle, X } from "lucide-react";

/* Morph button: a button that runs an async action and morphs through idle, loading, success and error, resizing around its label and announcing each state. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export type MorphStatus = "idle" | "loading" | "success" | "error";

export const DEFAULT_LABELS: Record<MorphStatus, string> = { idle: "Save changes", loading: "Saving", success: "Saved", error: "Failed, retry" };

export interface MorphButtonProps {
  /** Runs on click; a rejection puts the button in the error state. */
  onAction: () => Promise<unknown> | void;
  labels?: Partial<Record<MorphStatus, string>>;
  /** Milliseconds before success or error returns to idle. */
  resetAfter?: number;
  disabled?: boolean;
  className?: string;
}

const STATUS_STYLE: Record<MorphStatus, string> = {
  idle: "bg-[image:var(--grad-primary)] text-[var(--inverse-fg)] shadow-[var(--shadow-btn-primary)]",
  loading: "bg-[image:var(--grad-primary)] text-[var(--inverse-fg)] opacity-80 shadow-[var(--shadow-btn-primary)]",
  success: "bg-success-soft text-success-text",
  error: "bg-danger-soft text-danger-text",
};

export function MorphButton({ onAction, labels, resetAfter = 1800, disabled = false, className = "" }: MorphButtonProps) {
  const reduce = useReduce();
  const [status, setStatus] = useState<MorphStatus>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const text = { ...DEFAULT_LABELS, ...labels };
  useEffect(() => () => clearTimeout(timer.current), []);

  const run = async () => {
    if (status !== "idle" || disabled) return;
    setStatus("loading");
    let next: MorphStatus = "success";
    try {
      await onAction();
    } catch {
      next = "error";
    }
    setStatus(next);
    timer.current = setTimeout(() => setStatus("idle"), resetAfter);
  };

  const Icon = status === "loading" ? LoaderCircle : status === "success" ? Check : status === "error" ? X : null;

  return (
    <>
      <motion.button
        type="button"
        layout={!reduce}
        onClick={run}
        disabled={disabled}
        aria-busy={status === "loading"}
        transition={{ type: "spring", stiffness: 500, damping: 34 }}
        className={`inline-flex h-10 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium transition-colors disabled:opacity-50 ${STATUS_STYLE[status]} ${ring} ${className}`}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {Icon && (
            <motion.span key={status} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} className="inline-flex">
              <Icon className={`size-4 ${status === "loading" ? "animate-spin" : ""}`} aria-hidden />
            </motion.span>
          )}
        </AnimatePresence>
        <motion.span layout={reduce ? false : "position"}>{text[status]}</motion.span>
      </motion.button>
      <span role="status" className="sr-only">{status === "idle" ? "" : text[status]}</span>
    </>
  );
}
