"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CircleAlert, CircleCheck, Info, TriangleAlert, X, type LucideIcon } from "lucide-react";

/* Toast: call toast() from anywhere to queue a message and render <Toaster /> once; toasts auto-dismiss, pause while hovered or focused, show at most a few at a time with the rest queued, and are announced through a live region. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export type ToastVariant = "default" | "success" | "error" | "warning" | "info";

export interface ToastOptions {
  title?: ReactNode;
  description?: ReactNode;
  variant?: ToastVariant;
  /** Milliseconds before auto-dismiss; 0 keeps it until dismissed. */
  duration?: number;
  action?: { label: string; onClick: () => void };
}

export interface ToastRecord extends ToastOptions {
  id: string;
  variant: ToastVariant;
  duration: number;
}

const DEFAULT_DURATION = 4000;

let records: ToastRecord[] = [];
let counter = 0;
const listeners = new Set<() => void>();

const publish = (next: ToastRecord[]) => {
  records = next;
  listeners.forEach((listener) => listener());
};
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const snapshot = () => records;

function push(input: string | ToastOptions, variant?: ToastVariant): string {
  const options = typeof input === "string" ? { title: input } : input;
  const id = `toast-${++counter}`;
  publish([...records, { ...options, id, variant: variant ?? options.variant ?? "default", duration: options.duration ?? DEFAULT_DURATION }]);
  return id;
}

/** Closes one toast, or every toast when called without an id. */
function dismiss(id?: string) {
  publish(id ? records.filter((t) => t.id !== id) : []);
}

/** Queues a toast and returns its id; a string is shorthand for `{ title }`. */
export const toast = Object.assign((input: string | ToastOptions) => push(input), {
  success: (input: string | ToastOptions) => push(input, "success"),
  error: (input: string | ToastOptions) => push(input, "error"),
  warning: (input: string | ToastOptions) => push(input, "warning"),
  info: (input: string | ToastOptions) => push(input, "info"),
  dismiss,
});

const ICON: Record<ToastVariant, { Icon: LucideIcon; tone: string } | null> = {
  default: null,
  success: { Icon: CircleCheck, tone: "text-success-text" },
  error: { Icon: CircleAlert, tone: "text-danger-text" },
  warning: { Icon: TriangleAlert, tone: "text-warning-text" },
  info: { Icon: Info, tone: "text-select-text" },
};

function ToastItem({ record, reduce }: { record: ToastRecord; reduce: boolean }) {
  const [paused, setPaused] = useState(false);
  const remaining = useRef(record.duration);
  const startedAt = useRef(0);
  const icon = ICON[record.variant];

  useEffect(() => {
    if (record.duration <= 0 || paused) return;
    startedAt.current = Date.now();
    const timer = window.setTimeout(() => dismiss(record.id), remaining.current);
    return () => {
      window.clearTimeout(timer);
      remaining.current -= Date.now() - startedAt.current;
    };
  }, [record.id, record.duration, paused]);

  return (
    <motion.li
      layout={!reduce}
      role={record.variant === "error" ? "alert" : "status"}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 500, damping: 34 }}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="pointer-events-auto flex w-full items-start gap-3 rounded-[16px] bg-surface p-3.5 pr-10 shadow-[var(--shadow-overlay)] dark:bg-raised"
      style={{ position: "relative" }}
    >
      {icon && <icon.Icon size={18} strokeWidth={2} aria-hidden className={`mt-0.5 shrink-0 ${icon.tone}`} />}
      <div className="min-w-0 flex-1">
        {record.title && <p className="text-sm font-medium text-fg">{record.title}</p>}
        {record.description && <p className="mt-0.5 text-[13px] leading-[18px] text-fg-muted">{record.description}</p>}
        {record.action && (
          <button
            type="button"
            onClick={() => {
              record.action?.onClick();
              dismiss(record.id);
            }}
            className={`mt-2 rounded-full bg-subtle px-3 py-1 text-[13px] font-medium text-fg transition-colors hover:bg-track ${ring}`}
          >
            {record.action.label}
          </button>
        )}
      </div>
      <button type="button" aria-label="Dismiss notification" onClick={() => dismiss(record.id)} className={`absolute right-2 top-2 grid size-7 place-items-center rounded-full text-fg-subtle transition-colors hover:bg-subtle hover:text-fg ${ring}`}>
        <X size={14} strokeWidth={2} aria-hidden />
      </button>
    </motion.li>
  );
}

const POSITION = {
  "top-left": "top-4 left-4 items-start",
  "top-center": "top-4 left-1/2 -translate-x-1/2 items-center",
  "top-right": "top-4 right-4 items-end",
  "bottom-left": "bottom-4 left-4 items-start",
  "bottom-center": "bottom-4 left-1/2 -translate-x-1/2 items-center",
  "bottom-right": "bottom-4 right-4 items-end",
};

export interface ToasterProps {
  position?: keyof typeof POSITION;
  /** Toasts shown at once; the rest wait their turn and start their timers when they appear. */
  max?: number;
  label?: string;
}

export function Toaster({ position = "bottom-right", max = 3, label = "Notifications" }: ToasterProps) {
  const reduce = useReduce();
  const all = useSyncExternalStore(subscribe, snapshot, snapshot);
  return (
    <section aria-label={label} aria-live="polite" className={`pointer-events-none fixed z-[90] flex w-[22rem] max-w-[calc(100vw-2rem)] flex-col ${POSITION[position]}`}>
      <ul className="flex w-full flex-col gap-2">
        <AnimatePresence initial={false}>
          {all.slice(0, max).map((record) => <ToastItem key={record.id} record={record} reduce={reduce} />)}
        </AnimatePresence>
      </ul>
    </section>
  );
}
