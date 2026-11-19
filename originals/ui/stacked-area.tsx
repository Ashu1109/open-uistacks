"use client";

import { motion } from "motion/react";
import { CHART_EASE, ChartTip, enter, useChartReduce, Live, XLabels, YGrid, bandPath, focusRing, formatNumber, formatPercent, linearScale, niceTicks, pointerIndex, seriesColor, stackSeries, useActiveIndex, useChartWidth } from "./chart-utils";

/* Stacked area: series layered into one total over time, optionally normalised to 100 %; a hover crosshair lists each layer's value and share. */

export interface AreaSeries {
  name: string;
  values: number[];
  color?: string;
}

export interface StackedAreaProps {
  series: AreaSeries[];
  labels: string[];
  /** Show each column as a share of its total instead of absolute values. */
  normalize?: boolean;
  smooth?: boolean;
  format?: (n: number) => string;
  label?: string;
  className?: string;
}

const H = 280;
const M = { t: 14, r: 16, b: 28, l: 44 };

export function StackedArea({ series, labels, normalize = false, smooth = true, format = formatNumber, label, className = "" }: StackedAreaProps) {
  const [ref, W] = useChartWidth(640);
  const reduce = useChartReduce();
  const n = Math.max(0, labels.length, ...series.map((s) => s.values.length));
  const { active, setActive, focusProps } = useActiveIndex(n);
  const layers = stackSeries(series.map((s) => s.values), normalize);
  const top = Math.max(0, ...layers.flatMap((l) => l.map((p) => p.y1)));
  const ticks = normalize ? [0, 0.25, 0.5, 0.75, 1] : niceTicks(0, top, 4);
  const y = linearScale([0, ticks[ticks.length - 1]], [H - M.b, M.t]);
  const x = (i: number) => M.l + (n <= 1 ? 0 : (i / (n - 1)) * (W - M.l - M.r));
  const axis = normalize ? (v: number) => formatPercent(v) : format;
  const colorOf = (s: AreaSeries, i: number) => s.color ?? seriesColor(i);
  const totalAt = (i: number) => series.reduce((sum, s) => sum + Math.max(0, s.values[i] ?? 0), 0);

  return (
    <figure ref={ref} className={`relative m-0 ${className}`}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={label ?? `Stacked area chart of ${series.map((s) => s.name).join(", ")} over ${n} points${normalize ? ", as shares of the total" : ""}.`}
        className={`block h-auto w-full rounded-[10px] ${focusRing}`}
        onPointerMove={(e) => setActive(pointerIndex(e, n, M.l, W - M.r, W))}
        onPointerLeave={() => setActive(null)}
        {...focusProps}
      >
        <YGrid ticks={ticks} y={y} x0={M.l} x1={W - M.r} format={axis} />
        <XLabels labels={labels} x={x} y={H - 8} />
        {layers.map((layer, s) => (
          <motion.path
            {...enter(reduce, "rise", s * 2)}
            key={series[s].name}
            d={bandPath(layer.map((p, i) => ({ x: x(i), y: y(p.y1) })), layer.map((p, i) => ({ x: x(i), y: y(p.y0) })), smooth)}
            fill={`color-mix(in srgb, ${colorOf(series[s], s)} 78%, var(--surface))`}
            stroke="var(--surface)"
            strokeWidth={1}
          />
        ))}
        {active !== null && <motion.line initial={false} animate={{ x1: x(active), x2: x(active) }} transition={CHART_EASE} y1={M.t} y2={H - M.b} stroke="var(--fg)" strokeOpacity={0.5} aria-hidden />}
      </svg>
      {active !== null && (
        <ChartTip x={x(active)} y={M.t + 40} w={W} h={H}>
          <div className="mb-1 flex justify-between gap-4"><span className="text-fg-muted">{labels[active]}</span><span className="tabular-nums font-medium">{format(totalAt(active))}</span></div>
          {[...series].reverse().map((s, r) => {
            const i = series.length - 1 - r;
            const v = Math.max(0, s.values[active] ?? 0);
            const total = totalAt(active);
            return (
              <div key={s.name} className="flex items-center justify-between gap-4">
                <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: colorOf(s, i) }} />{s.name}</span>
                <span className="tabular-nums">{format(v)} <span className="text-fg-muted">{total === 0 ? "0%" : formatPercent(v / total)}</span></span>
              </div>
            );
          })}
        </ChartTip>
      )}
      <Live>{active !== null ? `${labels[active]}: ${series.map((s) => `${s.name} ${format(s.values[active] ?? 0)}`).join(", ")}` : ""}</Live>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 p-0 text-xs text-fg-muted">
        {series.map((s, i) => <li key={s.name} className="inline-flex list-none items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: colorOf(s, i) }} />{s.name}</li>)}
      </ul>
    </figure>
  );
}
