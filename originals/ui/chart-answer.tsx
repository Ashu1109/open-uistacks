"use client";

import { useId, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";


/* Chart answer: an assistant reply that pairs a sentence with a small bar or line chart drawn in SVG, plus a "Show data" table for screen readers and checking the numbers. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}
const spring = { type: "spring", stiffness: 480, damping: 34 } as const;

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface ChartDatum {
  label: string;
  value: number;
}

export interface ChartGeometry {
  x: number;
  y: number;
  /** Bar height in px; 0 for line points. */
  h: number;
  value: number;
  label: string;
}

/** Maps data into a width x height box with `pad` margins and a zero baseline; bars share the width evenly. */
export function layoutChart(data: ChartDatum[], width: number, height: number, pad = 8): ChartGeometry[] {
  if (data.length === 0) return [];
  const max = Math.max(...data.map((d) => d.value), 0) || 1;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const step = innerW / data.length;
  return data.map((d, i) => {
    const h = Math.max(0, (d.value / max) * innerH);
    return { x: pad + step * (i + 0.5), y: pad + innerH - h, h, value: d.value, label: d.label };
  });
}

export function linePath(points: ChartGeometry[]): string {
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
}

export interface ChartAnswerProps {
  answer: string;
  title: string;
  data: ChartDatum[];
  type?: "bar" | "line";
  unit?: string;
  className?: string;
}

const W = 320;
const H = 140;

export function ChartAnswer({ answer, title, data, type = "bar", unit = "", className = "" }: ChartAnswerProps) {
  const reduce = useReduce();
  const tableId = useId();
  const [hover, setHover] = useState<string | null>(null);
  const [table, setTable] = useState(false);
  const points = layoutChart(data, W, H);
  const barW = Math.min(36, (W / Math.max(data.length, 1)) * 0.6);

  return (
    <motion.figure initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={spring} className={`w-full max-w-md rounded-[20px] bg-surface p-4 shadow-[var(--shadow-card)] ${className}`}>
      <p className="text-[14px] leading-6 text-fg">{answer}</p>
      <figcaption className="mt-3 text-xs font-medium text-fg-muted">{title}</figcaption>
      <svg viewBox={`0 0 ${W} ${H + 18}`} role="img" aria-label={`${title}: ${data.map((d) => `${d.label} ${d.value}${unit}`).join(", ")}`} className="mt-1 w-full">
        <line x1="8" x2={W - 8} y1={H - 8} y2={H - 8} stroke="var(--track-strong)" />
        {type === "line" ? (
          <>
            <motion.path d={linePath(points)} initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, ease: "easeOut" }} fill="none" stroke="var(--series-1)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            {points.map((p, i) => <motion.circle key={p.label} cx={p.x} cy={p.y} r="3.5" fill="var(--surface)" stroke="var(--series-1)" strokeWidth="2" style={{ transformBox: "fill-box", transformOrigin: "center" }} initial={reduce ? false : { scale: 0 }} animate={{ scale: hover === p.label ? 1.4 : 1 }} transition={{ ...spring, delay: reduce || hover ? 0 : 0.25 + i * 0.07 }} onMouseEnter={() => setHover(p.label)} onMouseLeave={() => setHover(null)} />)}
          </>
        ) : (
          points.map((p, i) => <motion.rect key={p.label} x={p.x - barW / 2} width={barW} rx="5" fill="var(--series-1)" initial={reduce ? false : { y: H - 8, height: 0 }} animate={{ y: p.y, height: p.h, opacity: hover && hover !== p.label ? 0.6 : 1 }} transition={{ ...spring, delay: reduce ? 0 : i * 0.06 }} onMouseEnter={() => setHover(p.label)} onMouseLeave={() => setHover(null)} />)
        )}
        {points.map((p) => <text key={p.label} x={p.x} y={H + 10} textAnchor="middle" fontSize="10" fill="var(--fg-subtle)">{p.label}</text>)}
        <AnimatePresence>
          {points.filter((p) => p.label === hover).map((p) => <motion.text key="tip" aria-hidden x={p.x} y={Math.max(p.y - 6, 12)} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--fg)" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.14 }} style={{ pointerEvents: "none" }}>{p.value}{unit}</motion.text>)}
        </AnimatePresence>
      </svg>
      <motion.button type="button" aria-expanded={table} aria-controls={tableId} whileTap={reduce ? undefined : { scale: 0.96 }} onClick={() => setTable(!table)} className={`mt-1 rounded-full text-xs font-medium text-select-text ${ring}`}>{table ? "Hide data" : "Show data"}</motion.button>
      <table id={tableId} hidden={!table} className="mt-2 w-full text-left text-xs">
        <thead><tr className="text-fg-subtle"><th className="py-1 font-medium">Label</th><th className="py-1 text-right font-medium">Value</th></tr></thead>
        <tbody>{data.map((d) => <tr key={d.label} className="border-t border-track text-fg"><td className="py-1">{d.label}</td><td className="py-1 text-right tabular-nums">{d.value}{unit}</td></tr>)}</tbody>
      </table>
    </motion.figure>
  );
}
