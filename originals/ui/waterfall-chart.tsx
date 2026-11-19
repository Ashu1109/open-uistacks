"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { ChartTip, enter, useChartReduce, Live, XLabels, YGrid, extent, focusRing, formatNumber, linearScale, niceTicks, waterfallTotals, type WaterfallStep, useChartWidth } from "./chart-utils";

/* Waterfall chart: how a starting value becomes an ending value through increases (green), decreases (red) and subtotal bars, with connectors between steps. */

export type { WaterfallStep };

export interface WaterfallChartProps {
  steps: WaterfallStep[];
  format?: (n: number) => string;
  label?: string;
  className?: string;
}

const H = 280;
const M = { t: 14, r: 16, b: 28, l: 48 };
const KIND_COLOR = { up: "var(--success)", down: "var(--danger)", total: "var(--series-1)" } as const;

export function WaterfallChart({ steps, format = formatNumber, label, className = "" }: WaterfallChartProps) {
  const [ref, W] = useChartWidth(640);
  const reduce = useChartReduce();
  const bars = waterfallTotals(steps);
  const [active, setActive] = useState<number | null>(null);
  const [lo, hi] = extent([0, ...bars.flatMap((b) => [b.start, b.end])]);
  const ticks = niceTicks(lo, hi, 5);
  const y = linearScale([ticks[0], ticks[ticks.length - 1]], [H - M.b, M.t]);
  const slot = (W - M.l - M.r) / Math.max(bars.length, 1);
  const x = (i: number) => M.l + slot * (i + 0.5);
  const barW = Math.min(52, slot * 0.64);
  const signed = (b: (typeof bars)[number]) => (b.kind === "total" ? format(b.end) : `${b.delta >= 0 ? "+" : "−"}${format(Math.abs(b.delta))}`);
  const focus = active === null ? null : bars[active];

  return (
    <figure ref={ref} className={`relative m-0 ${className}`}>
      <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label={label ?? `Waterfall chart: ${bars.length} steps ending at ${format(bars[bars.length - 1]?.end ?? 0)}.`} className="block h-auto w-full">
        <YGrid ticks={ticks} y={y} x0={M.l} x1={W - M.r} format={format} />
        <XLabels labels={bars.map((b) => b.label)} x={x} y={H - 8} max={bars.length} />
        {bars.slice(0, -1).map((b, i) => <motion.line {...enter(reduce, "fade", i + 1, 0.1)} key={i} x1={x(i) + barW / 2} x2={x(i + 1) - barW / 2} y1={y(b.end)} y2={y(b.end)} stroke="var(--track-strong)" strokeDasharray="3 3" aria-hidden />)}
        {bars.map((b, i) => {
          const top = Math.min(y(b.start), y(b.end));
          return (
            <g
              key={`${b.label}-${i}`}
              role="img"
              tabIndex={0}
              aria-label={`${b.label}: ${signed(b)}${b.kind === "total" ? "" : `, running total ${format(b.end)}`}`}
              className={`rounded-[4px] transition-opacity duration-150 ${focusRing}`}
              opacity={active === null || active === i ? 1 : 0.55}
              onPointerEnter={() => setActive(i)}
              onPointerLeave={() => setActive(null)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
            >
              <rect x={x(i) - slot / 2} y={M.t} width={slot} height={H - M.t - M.b} fill="transparent" />
              <motion.rect {...enter(reduce, "growY", i, 0, { y: y(b.start) })} x={x(i) - barW / 2} y={top} width={barW} height={Math.max(1.5, Math.abs(y(b.start) - y(b.end)))} rx={4} fill={KIND_COLOR[b.kind]} />
              <motion.text {...enter(reduce, "fade", i, 0.2)} x={x(i)} y={top - 5} textAnchor="middle" fontSize={10} fontWeight={500} fill="var(--fg-muted)" aria-hidden>{signed(b)}</motion.text>
            </g>
          );
        })}
      </svg>
      {focus && active !== null && (
        <ChartTip x={x(active)} y={Math.min(y(focus.start), y(focus.end))} w={W} h={H}>
          <div className="text-fg-muted">{focus.label}</div>
          <div className="font-medium tabular-nums">{signed(focus)}</div>
          {focus.kind !== "total" && <div className="tabular-nums text-fg-muted">Running total {format(focus.end)}</div>}
        </ChartTip>
      )}
      <Live>{focus ? `${focus.label}: ${signed(focus)}` : ""}</Live>
    </figure>
  );
}
