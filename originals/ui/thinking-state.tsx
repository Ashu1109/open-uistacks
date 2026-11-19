"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Brain, ChevronRight } from "lucide-react";

/* Thinking state: a shimmering "Thinking" with a running clock while the model reasons, then "Thought for 8s"; the reasoning folds open underneath. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

/** 8s, 1m 05s. */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
}

function useElapsed(running: boolean) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!running) return;
    const start = Date.now();
    const tick = () => setElapsed((Date.now() - start) / 1000);
    setElapsed(0);
    const timer = setInterval(tick, 1000);
    return () => {
      clearInterval(timer);
      tick();
    };
  }, [running]);
  return elapsed;
}

export interface ThinkingStateProps {
  /** True while the model is reasoning. */
  active: boolean;
  /** Seconds spent; leave it out and the component times the active stretch itself. */
  seconds?: number;
  /** Text while active. */
  label?: string;
  /** The reasoning, shown when someone opens it. Without it the row does not open. */
  children?: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function ThinkingState({ active, seconds, label = "Thinking", children, defaultOpen = false, className = "" }: ThinkingStateProps) {
  const reduce = useReduce();
  const [open, setOpen] = useState(defaultOpen);
  const elapsed = useElapsed(active && seconds === undefined);
  const time = formatDuration(seconds ?? elapsed);
  const expandable = Boolean(children);

  return (
    <div className={`w-full ${className}`}>
      <button
        type="button"
        disabled={!expandable}
        aria-expanded={expandable ? open : undefined}
        onClick={() => setOpen((o) => !o)}
        className={`-ml-1 inline-flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2 text-sm text-fg-muted transition-colors enabled:hover:text-fg disabled:cursor-default ${ring}`}
      >
        <Brain size={15} strokeWidth={1.75} aria-hidden />
        <span aria-live="polite">{active ? <Shimmer still={reduce}>{label}</Shimmer> : `Thought for ${time}`}</span>
        {active && (
          <span aria-hidden className="tabular-nums text-fg-subtle">
            {time}
          </span>
        )}
        {expandable && <ChevronRight size={14} aria-hidden className={`transition-transform ${open ? "rotate-90" : ""}`} />}
      </button>
      <AnimatePresence initial={false}>
        {open && expandable && (
          <motion.div
            key="reasoning"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 38 }}
            className="overflow-hidden"
          >
            <div className="ml-[7px] mt-1 border-l border-track pl-4 text-sm leading-6 text-fg-muted">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Shimmer({ children, still }: { children: ReactNode; still: boolean }) {
  if (still) return <span>{children}</span>;
  return (
    <motion.span
      className="bg-[linear-gradient(90deg,var(--fg-subtle)_30%,var(--fg)_50%,var(--fg-subtle)_70%)] bg-[length:200%_100%] bg-clip-text text-transparent"
      animate={{ backgroundPosition: ["100% 0%", "-100% 0%"] }}
      transition={{ duration: 1.8, ease: "linear", repeat: Infinity }}
    >
      {children}
    </motion.span>
  );
}
