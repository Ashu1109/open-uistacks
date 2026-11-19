"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { ChartTip, enter, useChartReduce, Live, XLabels, YGrid, boxStats, extent, focusRing, formatNumber, linearScale, niceTicks, seriesColor, type BoxStats, useChartWidth } from "./chart-utils";

/* Box plot: each group's distribution as a box from first to third quartile with the median, Tukey whiskers at 1.5 IQR and outliers as dots. */

export interface BoxGroup {
  label: string;
  values: number[];
}

export interface BoxPlotProps {
  groups: BoxGroup[];
  format?: (n: number) => string;
  label?: string;
  className?: string;
}

const H = 300;
const M = { t: 14, r: 16, b: 28, l: 48 };

export function BoxPlot({ groups, format = formatNumber, label, className = "" }: BoxPlotProps) {
  const [ref, W] = useChartWidth(640);
  const reduce = useChartReduce();
  const [active, setActive] = useState<number | null>(null);
  const stats = groups.map((g) => boxStats(g.values));
  const [lo, hi] = extent(stats.flatMap((s) => (s ? [s.min, s.max] : [])));
  const ticks = niceTicks(lo, hi, 5);
  const y = linearScale([ticks[0], ticks[ticks.length - 1]], [H - M.b, M.t]);
  const slot = (W - M.l - M.r) / Math.max(groups.length, 1);
  const x = (i: number) => M.l + slot * (i + 0.5);
  const boxW = Math.min(56, slot * 0.5);
  const describe = (g: BoxGroup, s: BoxStats) => `${g.label}: median ${format(s.median)}, quartiles ${format(s.q1)} to ${format(s.q3)}, whiskers ${format(s.whiskerLow)} to ${format(s.whiskerHigh)}, ${s.outliers.length} outliers, ${s.count} values`;
  const focused = active === null ? null : stats[active];

  return (
    <figure ref={ref} className={`relative m-0 ${className}`}>
      <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label={label ?? `Box plot comparing ${groups.length} groups.`} className="block h-auto w-full">
        <YGrid ticks={ticks} y={y} x0={M.l} x1={W - M.r} format={format} />
        <XLabels labels={groups.map((g) => g.label)} x={x} y={H - 8} max={groups.length} />
        {groups.map((g, i) => {
          const s = stats[i];
          if (!s) return null;
          const color = seriesColor(i);
          return (
            <g
              key={g.label}
              role="img"
              tabIndex={0}
              aria-label={describe(g, s)}
              className={`rounded-[4px] transition-opacity duration-150 ${focusRing}`}
              opacity={active === null || active === i ? 1 : 0.55}
              onPointerEnter={() => setActive(i)}
              onPointerLeave={() => setActive(null)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
            >
              <rect x={x(i) - slot / 2} y={M.t} width={slot} height={H - M.t - M.b} fill="transparent" />
              <motion.g {...enter(reduce, "growY", i, 0, { y: y(s.median) })}>
              <line x1={x(i)} x2={x(i)} y1={y(s.whiskerHigh)} y2={y(s.q3)} stroke={color} strokeWidth={1.5} />
              <line x1={x(i)} x2={x(i)} y1={y(s.q1)} y2={y(s.whiskerLow)} stroke={color} strokeWidth={1.5} />
              <line x1={x(i) - boxW / 4} x2={x(i) + boxW / 4} y1={y(s.whiskerHigh)} y2={y(s.whiskerHigh)} stroke={color} strokeWidth={1.5} />
              <line x1={x(i) - boxW / 4} x2={x(i) + boxW / 4} y1={y(s.whiskerLow)} y2={y(s.whiskerLow)} stroke={color} strokeWidth={1.5} />
              <rect x={x(i) - boxW / 2} y={y(s.q3)} width={boxW} height={Math.max(1, y(s.q1) - y(s.q3))} rx={4} fill={`color-mix(in srgb, ${color} 22%, var(--surface))`} stroke={color} strokeWidth={1.5} />
              <line x1={x(i) - boxW / 2} x2={x(i) + boxW / 2} y1={y(s.median)} y2={y(s.median)} stroke={color} strokeWidth={2.5} />
              {s.outliers.map((o, k) => <circle key={k} cx={x(i)} cy={y(o)} r={3} fill="none" stroke={color} strokeWidth={1.5} />)}
              </motion.g>
            </g>
          );
        })}
      </svg>
      {focused && active !== null && (
        <ChartTip x={x(active)} y={y(focused.q3)} w={W} h={H}>
          <div className="mb-1 font-medium">{groups[active].label} <span className="font-normal text-fg-muted">n={focused.count}</span></div>
          <dl className="m-0 grid grid-cols-[auto_auto] gap-x-4 tabular-nums">
            {([["Max", focused.whiskerHigh], ["Q3", focused.q3], ["Median", focused.median], ["Q1", focused.q1], ["Min", focused.whiskerLow]] as const).map(([k, v]) => (
              <div key={k} className="contents"><dt className="text-fg-muted">{k}</dt><dd className="m-0 text-right">{format(v)}</dd></div>
            ))}
          </dl>
          {focused.outliers.length > 0 && <div className="mt-1 text-fg-muted">{focused.outliers.length} outlier{focused.outliers.length === 1 ? "" : "s"}</div>}
        </ChartTip>
      )}
      <Live>{active !== null && focused ? describe(groups[active], focused) : ""}</Live>
    </figure>
  );
}
