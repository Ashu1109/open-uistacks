"use client";

import { useId, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

/* Context meter: a small ring for how full the model's context window is, amber from 70 %, red from 90 %, with a details card on hover or focus. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export const WARN_AT = 0.7;
export const DANGER_AT = 0.9;

export type ContextLevel = "ok" | "warning" | "danger";

const STROKE: Record<ContextLevel, string> = { ok: "var(--select)", warning: "var(--warning)", danger: "var(--danger)" };
const TEXT: Record<ContextLevel, string> = { ok: "text-fg-muted", warning: "text-warning-text", danger: "text-danger-text" };

export function contextLevel(ratio: number): ContextLevel {
  if (ratio >= DANGER_AT) return "danger";
  if (ratio >= WARN_AT) return "warning";
  return "ok";
}

const trim = (x: number, digits: number) => x.toFixed(digits).replace(/\.0$/, "");

/** 950, 12.4k, 128k, 1.2M. */
export function formatTokens(n: number): string {
  const abs = Math.max(0, n);
  if (abs < 1000) return String(Math.round(abs));
  const k = abs / 1000;
  const kText = trim(k, k < 100 ? 1 : 0);
  if (Number(kText) < 1000) return `${kText}k`;
  return `${trim(abs / 1_000_000, 1)}M`;
}

export interface ContextSegment {
  label: string;
  tokens: number;
}

export interface ContextMeterProps {
  used: number;
  limit: number;
  /** Ring diameter in px. */
  size?: number;
  /** Show the percentage beside the ring. */
  showLabel?: boolean;
  /** Where the tokens went, listed in the details card: system prompt, files, messages. */
  segments?: ContextSegment[];
  /** Side the details card opens on. */
  placement?: "top" | "bottom";
  className?: string;
}

export function ContextMeter({ used, limit, size = 20, showLabel = false, segments, placement = "top", className = "" }: ContextMeterProps) {
  const id = useId();
  const reduce = useReduce();
  const [open, setOpen] = useState(false);
  const ratio = limit > 0 ? Math.min(Math.max(used / limit, 0), 1) : 0;
  const pct = Math.round(ratio * 100);
  const level = contextLevel(ratio);
  const stroke = Math.max(2, size / 8);
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const hidden = reduce ? { opacity: 0 } : { opacity: 0, y: placement === "top" ? 4 : -4 };

  return (
    <span className={`relative inline-flex ${className}`} onPointerEnter={() => setOpen(true)} onPointerLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-label={`Context window ${pct}% used`}
        aria-describedby={open ? id : undefined}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        className={`inline-flex h-8 items-center gap-1.5 rounded-full px-1.5 text-xs tabular-nums transition-colors hover:bg-subtle ${TEXT[level]} ${ring}`}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track)" strokeWidth={stroke} />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={false}
            animate={{ strokeDashoffset: circumference * (1 - ratio), stroke: STROKE[level] }}
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 140, damping: 24 }}
          />
        </svg>
        {showLabel && <span>{pct}%</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            id={id}
            role="tooltip"
            initial={hidden}
            animate={{ opacity: 1, y: 0 }}
            exit={hidden}
            transition={{ type: "spring", stiffness: 520, damping: 34 }}
            className={`absolute right-0 z-50 w-60 rounded-[14px] bg-surface p-3 shadow-[var(--shadow-overlay)] dark:bg-raised ${placement === "top" ? "bottom-full mb-2" : "top-full mt-2"}`}
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[13px] font-medium text-fg">Context window</span>
              <span className={`text-xs tabular-nums ${TEXT[level]}`}>{pct}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-track">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: STROKE[level] }} />
            </div>
            <p className="mt-2 text-xs tabular-nums text-fg-muted">
              {formatTokens(used)} of {formatTokens(limit)} tokens · {formatTokens(Math.max(limit - used, 0))} left
            </p>
            {segments && segments.length > 0 && (
              <ul className="mt-2.5 space-y-1 border-t border-track pt-2.5">
                {segments.map((s) => (
                  <li key={s.label} className="flex justify-between gap-3 text-xs">
                    <span className="text-fg-muted">{s.label}</span>
                    <span className="tabular-nums text-fg">{formatTokens(s.tokens)}</span>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}
