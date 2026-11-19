"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { animate, motion, useReducedMotion } from "motion/react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { CountUp } from "./chart-utils";

/* Eval scorecard: an overall score plus per-metric bars for an evaluation run, marking each against a pass threshold and showing change from a baseline. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}
const spring = { type: "spring", stiffness: 480, damping: 36 } as const;

/** Tweens to a new value on change; the first render shows the value as is. */
function useTween(value: number, reduce: boolean): number {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    if (from.current === value) return;
    if (reduce) { from.current = value; setShown(value); return; }
    const controls = animate(from.current, value, { duration: 0.5, ease: "easeOut", onUpdate: (v) => { from.current = v; setShown(v); } });
    return () => controls.stop();
  }, [value, reduce]);
  return shown;
}

export interface EvalMetric {
  label: string;
  /** 0 to 1. */
  score: number;
  baseline?: number;
}

export function overallScore(metrics: EvalMetric[]): number {
  return metrics.length ? metrics.reduce((sum, m) => sum + m.score, 0) / metrics.length : 0;
}

/** Percentage-point change, rounded: 0.82 vs 0.75 is +7. */
export function scoreDelta(score: number, baseline: number): number {
  return Math.round((score - baseline) * 100);
}

export interface EvalScorecardProps {
  title?: string;
  metrics: EvalMetric[];
  /** Score at or above this passes. */
  threshold?: number;
  className?: string;
}

function Delta({ delta }: { delta: number }) {
  const Icon = delta > 0 ? ArrowUp : delta < 0 ? ArrowDown : Minus;
  const tone = delta > 0 ? "text-success-text" : delta < 0 ? "text-danger-text" : "text-fg-subtle";
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] tabular-nums ${tone}`}>
      <Icon size={10} aria-hidden />
      {Math.abs(delta)}
      <span className="sr-only"> points {delta > 0 ? "up" : delta < 0 ? "down" : "unchanged"} from baseline</span>
    </span>
  );
}

export function EvalScorecard({ title = "Evaluation", metrics, threshold = 0.8, className = "" }: EvalScorecardProps) {
  const overall = overallScore(metrics);
  const pass = overall >= threshold;
  const reduce = useReduce();
  const shownOverall = useTween(Math.round(overall * 100), reduce);
  return (
    <section aria-label={title} className={`rounded-[16px] bg-surface p-4 shadow-[var(--shadow-card)] dark:bg-raised ${className}`}>
      <div className="flex items-end justify-between">
        <div>
          <h4 className="text-xs text-fg-subtle">{title}</h4>
          <p className="text-3xl font-semibold tabular-nums text-fg"><CountUp text={String(Math.round(shownOverall))} /><span className="text-base font-normal text-fg-subtle">/100</span></p>
        </div>
        <motion.span key={String(pass)} initial={reduce ? false : { opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={spring} className={`rounded-full px-2.5 py-1 text-xs font-medium ${pass ? "bg-success-soft text-success-text" : "bg-danger-soft text-danger-text"}`}>{pass ? "Passing" : "Below threshold"}</motion.span>
      </div>
      <ul className="mt-4 space-y-3">
        {metrics.map((m, i) => {
          const ok = m.score >= threshold;
          return (
            <motion.li key={m.label} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: i * 0.05 }}>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-fg">{m.label}</span>
                <span className="flex items-center gap-2 tabular-nums text-fg-muted">
                  {m.baseline !== undefined && <Delta delta={scoreDelta(m.score, m.baseline)} />}
                  {Math.round(m.score * 100)}
                </span>
              </div>
              <div role="meter" aria-label={m.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(m.score * 100)} className="relative mt-1 h-1.5 rounded-full bg-track">
                <motion.div className="h-full rounded-full" initial={reduce ? false : { width: 0 }} animate={{ width: `${m.score * 100}%` }} transition={{ ...spring, stiffness: 140, damping: 24, delay: 0.1 + i * 0.05 }} style={{ background: ok ? "var(--success)" : "var(--warning)" }} />
                <span aria-hidden className="absolute -top-0.5 h-2.5 w-px bg-fg-subtle" style={{ left: `${threshold * 100}%` }} />
              </div>
            </motion.li>
          );
        })}
      </ul>
    </section>
  );
}
