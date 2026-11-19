"use client";

import { useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "motion/react";
import { formatMs } from "./tool-call";

/* Trace waterfall: spans of an agent run laid out on a shared time axis, indented by depth, each bar positioned by start and length with its duration. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}
const spring = { type: "spring", stiffness: 480, damping: 36 } as const;

export interface TraceSpan {
  id: string;
  name: string;
  /** Milliseconds from trace start. */
  start: number;
  duration: number;
  depth?: number;
  status?: "ok" | "error";
}

export interface SpanLayout {
  left: number;
  width: number;
}

/** Percent offset and width of each span, with a minimum visible width. */
export function layoutSpans(spans: TraceSpan[], minWidth = 0.6): { total: number; layouts: SpanLayout[] } {
  const total = Math.max(1, ...spans.map((s) => s.start + s.duration));
  const layouts = spans.map((s) => ({ left: (s.start / total) * 100, width: Math.max((s.duration / total) * 100, minWidth) }));
  return { total, layouts };
}

export type LabelSide = "right" | "left" | "inside";

/** Where a span's duration label goes: after the bar, before it, or inside it when the bar is wide and ends near the edge. */
export function labelSide(startPct: number, endPct: number, edge = 75, insideMin = 18): LabelSide {
  if (endPct <= edge) return "right";
  return endPct - startPct >= insideMin ? "inside" : "left";
}

export interface TraceWaterfallProps {
  spans: TraceSpan[];
  className?: string;
}

export function TraceWaterfall({ spans, className = "" }: TraceWaterfallProps) {
  const { total, layouts } = layoutSpans(spans);
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const reduce = useReduce();
  return (
    <div role="table" aria-label="Trace waterfall" className={`rounded-[16px] bg-surface p-4 shadow-[var(--shadow-card)] dark:bg-raised ${className}`}>
      <div role="row" className="mb-2 flex text-[11px] tabular-nums text-fg-subtle">
        <span role="columnheader" className="w-44 shrink-0">Span</span>
        <div role="columnheader" aria-label="Timeline" className="relative h-4 flex-1">
          {ticks.map((t) => (
            <span key={t} className="absolute whitespace-nowrap -translate-x-1/2 first:translate-x-0 last:-translate-x-full" style={{ left: `${t * 100}%` }}>{formatMs(total * t)}</span>
          ))}
        </div>
      </div>
      {spans.map((s, i) => {
        const err = s.status === "error";
        const { left, width } = layouts[i];
        const side = labelSide(left, left + width);
        const label = formatMs(s.duration);
        return (
          <motion.div key={s.id} role="row" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25, delay: i * 0.05 }} className="flex items-center py-1 transition-colors hover:bg-[color-mix(in_srgb,var(--fg)_4%,var(--surface))]">
            <span role="cell" className="w-44 shrink-0 truncate text-[13px] text-fg" style={{ paddingLeft: (s.depth ?? 0) * 14 }}>{s.name}</span>
            <div role="cell" className="relative h-5 flex-1 border-l border-track">
              <motion.div
                aria-label={`${s.name} starts at ${formatMs(s.start)}, lasts ${formatMs(s.duration)}${err ? ", failed" : ""}`}
                role="img"
                className="absolute top-0.5 flex h-4 origin-left items-center justify-end overflow-hidden rounded-[5px] px-1.5 text-[10px] tabular-nums text-[var(--inverse-fg)]"
                initial={reduce ? false : { scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ ...spring, stiffness: 240, damping: 30, delay: 0.1 + i * 0.06 }}
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  background: err ? "var(--danger)" : "color-mix(in srgb, var(--series-1) 85%, var(--series-3) 15%)",
                }}
              >
                {side === "inside" && <span aria-hidden className="whitespace-nowrap">{label}</span>}
              </motion.div>
              {side !== "inside" && (
                <motion.span
                  initial={reduce ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: 0.3 + i * 0.06 }}
                  aria-hidden
                  data-side={side}
                  className="absolute top-0.5 whitespace-nowrap text-[11px] leading-4 tabular-nums text-fg-muted"
                  style={side === "right" ? { left: `calc(${left + width}% + 6px)` } : { right: `calc(${100 - left}% + 6px)` }}
                >
                  {label}
                </motion.span>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
