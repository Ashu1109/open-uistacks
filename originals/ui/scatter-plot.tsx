"use client";

import { motion } from "motion/react";
import { ChartTip, enter, useChartReduce, Live, YGrid, extent, focusRing, formatNumber, linearScale, niceTicks, seriesColor, useActiveIndex, type Point, useChartWidth } from "./chart-utils";

/* Scatter plot: points on two numeric axes, coloured by group with a legend; hover finds the nearest point and arrow keys walk the points from left to right. */

export interface ScatterPoint {
  x: number;
  y: number;
  group?: string;
  label?: string;
  /** Relative dot size, 1 by default. */
  size?: number;
}

export interface ScatterPlotProps {
  points: ScatterPoint[];
  xLabel?: string;
  yLabel?: string;
  format?: (n: number) => string;
  label?: string;
  className?: string;
}

const H = 320;
const BASE = { t: 14, r: 16, b: 38, l: 48 };

export function nearestPoint(points: Point[], x: number, y: number, maxDistance: number): number | null {
  let best: number | null = null;
  let bestD = maxDistance;
  points.forEach((p, i) => {
    const d = Math.hypot(p.x - x, p.y - y);
    if (d <= bestD) {
      best = i;
      bestD = d;
    }
  });
  return best;
}

export function ScatterPlot({ points, xLabel, yLabel, format = formatNumber, label, className = "" }: ScatterPlotProps) {
  const [ref, W] = useChartWidth(640);
  const reduce = useChartReduce();
  const M = { ...BASE, t: yLabel ? 34 : BASE.t };
  const sorted = [...points].sort((a, b) => a.x - b.x);
  const groups = [...new Set(sorted.map((p) => p.group ?? "Points"))];
  const { active, setActive, focusProps } = useActiveIndex(sorted.length);
  const xTicks = niceTicks(...extent(sorted.map((p) => p.x)), 6);
  const yTicks = niceTicks(...extent(sorted.map((p) => p.y)), 5);
  const x = linearScale([xTicks[0], xTicks[xTicks.length - 1]], [M.l, W - M.r]);
  const y = linearScale([yTicks[0], yTicks[yTicks.length - 1]], [H - M.b, M.t]);
  const screen = sorted.map((p) => ({ x: x(p.x), y: y(p.y) }));
  const colorOf = (p: ScatterPoint) => seriesColor(groups.indexOf(p.group ?? "Points"));
  const p = active === null ? null : sorted[active];
  const describe = (pt: ScatterPoint) => `${pt.label ? `${pt.label}: ` : ""}${xLabel ?? "x"} ${format(pt.x)}, ${yLabel ?? "y"} ${format(pt.y)}${pt.group ? `, ${pt.group}` : ""}`;

  return (
    <figure ref={ref} className={`relative m-0 ${className}`}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={label ?? `Scatter plot of ${sorted.length} points${xLabel && yLabel ? `, ${yLabel} against ${xLabel}` : ""}.`}
        className={`block h-auto w-full rounded-[10px] ${focusRing}`}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          if (r.width === 0) return;
          setActive(nearestPoint(screen, ((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H, 28));
        }}
        onPointerLeave={() => setActive(null)}
        {...focusProps}
      >
        <YGrid ticks={yTicks} y={y} x0={M.l} x1={W - M.r} format={format} />
        <g aria-hidden>
          {xTicks.map((t) => <text key={t} x={x(t)} y={H - M.b + 16} textAnchor="middle" fontSize={10} fill="var(--fg-subtle)">{format(t)}</text>)}
          {xLabel && <text x={(M.l + W - M.r) / 2} y={H - 4} textAnchor="middle" fontSize={11} fill="var(--fg-muted)">{xLabel}</text>}
          {yLabel && <text x={4} y={12} fontSize={11} fill="var(--fg-muted)">{yLabel}</text>}
        </g>
        {sorted.map((pt, i) => (
          <motion.g key={i} {...enter(reduce, "pop", i, 0.1, screen[i])}>
            <circle className="transition-[r,stroke-width] duration-150" cx={screen[i].x} cy={screen[i].y} r={(pt.size ?? 1) * (active === i ? 7 : 5)} fill={`color-mix(in srgb, ${colorOf(pt)} 70%, transparent)`} stroke={colorOf(pt)} strokeWidth={active === i ? 2 : 1} />
          </motion.g>
        ))}
      </svg>
      {p && active !== null && (
        <ChartTip x={screen[active].x} y={screen[active].y} w={W} h={H}>
          {p.label && <div className="font-medium">{p.label}</div>}
          <div className="tabular-nums text-fg-muted">{xLabel ?? "x"} {format(p.x)} · {yLabel ?? "y"} {format(p.y)}</div>
        </ChartTip>
      )}
      <Live>{p ? describe(p) : ""}</Live>
      {groups.length > 1 && (
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 p-0 text-xs text-fg-muted">
          {groups.map((g, i) => <li key={g} className="inline-flex list-none items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: seriesColor(i) }} />{g}</li>)}
        </ul>
      )}
    </figure>
  );
}
