"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { CHART_EASE, CHART_SPRING, ChartTip, DrawPath, enter, useChartReduce, Live, XLabels, YGrid, areaPath, extent, focusRing, formatNumber, linePath, linearScale, niceTicks, pointerIndex, useActiveIndex, useChartWidth } from "./chart-utils";

/* Annotated line: one series with numbered event markers pinned to points (a deploy, an outage, a launch); markers are focusable and each reads its note. */

export interface LineAnnotation {
  /** Index into `values`. */
  index: number;
  title: string;
  note?: string;
  tone?: "info" | "success" | "warning" | "danger";
}

export interface AnnotatedLineProps {
  values: number[];
  labels: string[];
  annotations: LineAnnotation[];
  format?: (n: number) => string;
  label?: string;
  className?: string;
}

const H = 280;
const M = { t: 26, r: 16, b: 28, l: 44 };
const TONE: Record<NonNullable<LineAnnotation["tone"]>, string> = { info: "var(--select)", success: "var(--success)", warning: "var(--warning)", danger: "var(--danger)" };

export function AnnotatedLine({ values, labels, annotations, format = formatNumber, label, className = "" }: AnnotatedLineProps) {
  const [ref, W] = useChartWidth(640);
  const reduce = useChartReduce();
  const n = values.length;
  const { active, setActive, focusProps } = useActiveIndex(n);
  const [note, setNote] = useState<number | null>(null);
  const [lo, hi] = extent(values);
  const ticks = niceTicks(Math.min(lo, 0), hi, 4);
  const y = linearScale([ticks[0], ticks[ticks.length - 1]], [H - M.b, M.t]);
  const x = (i: number) => M.l + (n <= 1 ? 0 : (i / (n - 1)) * (W - M.l - M.r));
  const pts = values.map((v, i) => ({ x: x(i), y: y(v) }));
  const marked = annotations.filter((a) => a.index >= 0 && a.index < n);
  const shown = note === null ? null : marked[note];
  const current = active ?? shown?.index ?? null;

  return (
    <figure ref={ref} className={`relative m-0 ${className}`}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={label ?? `Line chart of ${n} values with ${marked.length} annotated events: ${marked.map((a) => a.title).join(", ")}.`}
        className={`block h-auto w-full rounded-[10px] ${focusRing}`}
        onPointerMove={(e) => setActive(pointerIndex(e, n, M.l, W - M.r, W))}
        onPointerLeave={() => setActive(null)}
        {...focusProps}
      >
        <YGrid ticks={ticks} y={y} x0={M.l} x1={W - M.r} format={format} />
        <XLabels labels={labels} x={x} y={H - 8} />
        <motion.path d={areaPath(pts, H - M.b, true)} fill="color-mix(in srgb, var(--series-1) 10%, transparent)" {...enter(reduce, "fade", 0, 0.3)} />
        <DrawPath d={linePath(pts, true)} fill="none" stroke="var(--series-1)" strokeWidth={2} strokeLinecap="round" />
        {marked.map((a, i) => (
          <g key={`${a.index}-${a.title}`}>
            <motion.line {...enter(reduce, "fade", i, 0.6)} x1={x(a.index)} x2={x(a.index)} y1={M.t + 10} y2={H - M.b} stroke={TONE[a.tone ?? "info"]} strokeDasharray="3 3" opacity={0.7} aria-hidden />
            <motion.g
              initial={reduce ? false : { opacity: 0, y: -14, scale: 0.6 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ ...CHART_SPRING, delay: 0.55 + i * 0.08 }}
              style={{ transformBox: "view-box", transformOrigin: `${x(a.index)}px ${M.t}px` }}
              role="button"
              tabIndex={0}
              aria-label={`Event ${i + 1}: ${a.title}${a.note ? `. ${a.note}` : ""}`}
              className={`cursor-pointer ${focusRing}`}
              onPointerEnter={() => setNote(i)}
              onPointerLeave={() => setNote(null)}
              onFocus={() => setNote(i)}
              onBlur={() => setNote(null)}
            >
              <circle cx={x(a.index)} cy={M.t} r={10} fill={TONE[a.tone ?? "info"]} />
              <text x={x(a.index)} y={M.t} textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600} fill="var(--inverse-fg)">{i + 1}</text>
            </motion.g>
          </g>
        ))}
        {current !== null && (
          <g aria-hidden>
            <motion.line initial={false} animate={{ x1: x(current), x2: x(current) }} transition={CHART_EASE} y1={M.t + 10} y2={H - M.b} stroke="var(--fg-subtle)" />
            <motion.circle initial={false} animate={{ cx: x(current), cy: y(values[current]) }} transition={CHART_EASE} r={4.5} fill="var(--surface)" stroke="var(--series-1)" strokeWidth={2} />
          </g>
        )}
      </svg>
      {current !== null && (
        <ChartTip x={x(current)} y={y(values[current])} w={W} h={H}>
          <div className="text-fg-muted">{labels[current]}</div>
          <div className="font-medium tabular-nums">{format(values[current])}</div>
          {shown && <div className="mt-1 max-w-48 whitespace-normal border-t border-track pt-1"><span className="font-medium">{shown.title}</span>{shown.note && <span className="block text-fg-muted">{shown.note}</span>}</div>}
        </ChartTip>
      )}
      <Live>{shown ? `${shown.title}. ${shown.note ?? ""}` : active !== null ? `${labels[active]}: ${format(values[active])}` : ""}</Live>
    </figure>
  );
}
