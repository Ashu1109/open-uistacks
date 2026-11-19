"use client";

import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { motion } from "motion/react";
import { CountUp, DrawPath, enter, extent, useChartReduce, useTween, formatNumber, linePath, linearScale } from "./chart-utils";

/* Since last visit: what changed in each metric since the user was last here, as a signed delta with a sparkline that marks the visit and tints everything after it. */

export interface VisitMetric {
  id: string;
  label: string;
  values: number[];
  format?: (n: number) => string;
  /** A drop counts as an improvement, e.g. error rate. */
  lowerIsBetter?: boolean;
}

export interface SinceLastVisitProps {
  metrics: VisitMetric[];
  /** Index in each metric's values that was the latest when the user last visited. */
  visitIndex: number;
  /** Human text such as "3 days ago". */
  since: string;
  className?: string;
}

export function deltaSince(values: number[], visitIndex: number): { abs: number; pct: number } {
  if (values.length === 0) return { abs: 0, pct: 0 };
  const before = values[Math.min(Math.max(visitIndex, 0), values.length - 1)];
  const abs = values[values.length - 1] - before;
  return { abs, pct: before === 0 ? 0 : abs / Math.abs(before) };
}

const SW = 96;
const SH = 28;

function Value({ value, fmt, reduce }: { value: number; fmt: (n: number) => string; reduce: boolean }) {
  return <CountUp text={fmt(useTween(value, reduce))} />;
}

function Spark({ values, visitIndex, tone }: { values: number[]; visitIndex: number; tone: string }) {
  const [lo, hi] = extent(values);
  const y = linearScale([lo, hi === lo ? lo + 1 : hi], [SH - 3, 3]);
  const x = (i: number) => (values.length <= 1 ? 0 : (i / (values.length - 1)) * SW);
  const pts = values.map((v, i) => ({ x: x(i), y: y(v) }));
  const at = Math.min(Math.max(visitIndex, 0), Math.max(values.length - 1, 0));
  const reduce = useChartReduce();
  return (
    <svg viewBox={`0 0 ${SW} ${SH}`} aria-hidden className="h-7 w-24">
      <DrawPath d={linePath(pts.slice(0, at + 1), true)} fill="none" stroke="var(--fg-subtle)" strokeWidth={1.5} strokeLinecap="round" duration={0.4} delay={0.1} />
      <DrawPath d={linePath(pts.slice(at), true)} fill="none" stroke={tone} strokeWidth={2} strokeLinecap="round" duration={0.4} delay={0.4} />
      <motion.line {...enter(reduce, "fade", 0, 0.3)} x1={x(at)} x2={x(at)} y1={0} y2={SH} stroke="var(--track-strong)" strokeDasharray="2 2" />
      {pts[at] && <motion.circle {...enter(reduce, "pop", 0, 0.35)} cx={pts[at].x} cy={pts[at].y} r={2.5} fill="var(--surface)" stroke="var(--fg-subtle)" strokeWidth={1.5} />}
    </svg>
  );
}

export function SinceLastVisit({ metrics, visitIndex, since, className = "" }: SinceLastVisitProps) {
  const reduce = useChartReduce();
  const rows = metrics.map((m) => {
    const d = deltaSince(m.values, visitIndex);
    const good = m.lowerIsBetter ? d.abs < 0 : d.abs > 0;
    const tone = d.abs === 0 ? "flat" : good ? "good" : "bad";
    return { m, d, tone } as const;
  });
  const color = { good: "var(--success)", bad: "var(--danger)", flat: "var(--fg-subtle)" };
  const text = { good: "text-success-text", bad: "text-danger-text", flat: "text-fg-muted" };

  return (
    <section aria-label="Since your last visit" className={`rounded-[20px] bg-surface p-4 shadow-[var(--shadow-card)] ${className}`}>
      <header className="mb-2 flex items-baseline justify-between">
        <h4 className="m-0 text-sm font-medium text-fg">Since your last visit</h4>
        <span className="text-xs text-fg-muted">{since}</span>
      </header>
      <ul className="m-0 divide-y divide-track p-0">
        {rows.map(({ m, d, tone }, ri) => {
          const fmt = m.format ?? formatNumber;
          const Icon = tone === "flat" ? Minus : d.abs > 0 ? ArrowUpRight : ArrowDownRight;
          const sign = d.abs > 0 ? "+" : d.abs < 0 ? "−" : "";
          return (
            <motion.li key={m.id} {...enter(reduce, "rise", ri)} className="grid list-none grid-cols-[1fr_auto_auto] items-center gap-4 py-2.5">
              <div>
                <div className="text-[13px] text-fg-muted">{m.label}</div>
                <div className="text-lg font-semibold tabular-nums text-fg"><Value value={m.values[m.values.length - 1] ?? 0} fmt={fmt} reduce={reduce} /></div>
              </div>
              <Spark values={m.values} visitIndex={visitIndex} tone={color[tone]} />
              <motion.span {...enter(reduce, "pop", ri, 0.2)} style={{ transformOrigin: "100% 50%" }} className={`inline-flex min-w-[5.5rem] items-center justify-end gap-1 text-[13px] font-medium tabular-nums ${text[tone]}`} aria-label={d.abs === 0 ? `${m.label} unchanged since your last visit` : `${m.label} ${d.abs > 0 ? "up" : "down"} ${fmt(Math.abs(d.abs))} since your last visit`}>
                <Icon className="size-4" aria-hidden />
                {sign}{fmt(Math.abs(d.abs))}
                <span className="font-normal opacity-80">({(Math.abs(d.pct) * 100).toFixed(1)}%)</span>
              </motion.span>
            </motion.li>
          );
        })}
      </ul>
    </section>
  );
}
