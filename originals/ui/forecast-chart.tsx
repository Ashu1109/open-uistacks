"use client";

import { useId } from "react";
import { motion } from "motion/react";
import { CHART_EASE, ChartTip, DrawPath, enter, useChartReduce, Live, XLabels, YGrid, areaPath, bandPath, extent, focusRing, formatNumber, linePath, linearScale, niceTicks, pointerIndex, useActiveIndex, useChartWidth } from "./chart-utils";

/* Forecast chart: an actual line that continues as a dashed forecast with a shaded confidence band, split at a "now" marker; hover or arrow keys read any point. */

export interface ForecastChartProps {
  actual: number[];
  /** Predicted values that continue after `actual`. */
  forecast: number[];
  /** Low and high bound for each forecast value. */
  band?: [number, number][];
  labels?: string[];
  format?: (n: number) => string;
  label?: string;
  className?: string;
}

const H = 280;
const M = { t: 14, r: 16, b: 28, l: 44 };

export function ForecastChart({ actual, forecast, band, labels, format = formatNumber, label, className = "" }: ForecastChartProps) {
  const [ref, W] = useChartWidth(640);
  const gid = useId();
  const reduce = useChartReduce();
  const all = [...actual, ...forecast];
  const n = all.length;
  const { active, setActive, focusProps } = useActiveIndex(n);
  const [lo, hi] = extent([...all, ...(band?.flat() ?? [])]);
  const ticks = niceTicks(lo, hi, 4);
  const y = linearScale([ticks[0], ticks[ticks.length - 1]], [H - M.b, M.t]);
  const x = (i: number) => M.l + (n <= 1 ? 0 : (i / (n - 1)) * (W - M.l - M.r));
  const names = labels ?? all.map((_, i) => `${i + 1}`);
  const actualPts = actual.map((v, i) => ({ x: x(i), y: y(v) }));
  const lastActual = actual.length - 1;
  const forecastPts = lastActual >= 0 ? [actualPts[lastActual], ...forecast.map((v, i) => ({ x: x(actual.length + i), y: y(v) }))] : [];
  const bandUpper = band ? [actualPts[lastActual], ...band.map(([, h], i) => ({ x: x(actual.length + i), y: y(h) }))] : [];
  const bandLower = band ? [actualPts[lastActual], ...band.map(([l], i) => ({ x: x(actual.length + i), y: y(l) }))] : [];
  const summary = label ?? `Forecast chart: ${actual.length} actual and ${forecast.length} forecast values, from ${format(all[0] ?? 0)} to ${format(all[n - 1] ?? 0)}.`;
  const isForecast = active !== null && active >= actual.length;
  const bounds = active !== null && band && isForecast ? band[active - actual.length] : null;

  return (
    <figure ref={ref} className={`relative m-0 ${className}`}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={summary}
        className={`block h-auto w-full rounded-[10px] ${focusRing}`}
        onPointerMove={(e) => setActive(pointerIndex(e, n, M.l, W - M.r, W))}
        onPointerLeave={() => setActive(null)}
        {...focusProps}
      >
        <YGrid ticks={ticks} y={y} x0={M.l} x1={W - M.r} format={format} />
        <XLabels labels={names} x={x} y={H - 8} />
        {band && <motion.path d={bandPath(bandUpper, bandLower, true)} fill="color-mix(in srgb, var(--series-1) 14%, transparent)" {...enter(reduce, "fade", 0, 0.55)} />}
        <defs>
          <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--series-1)" stopOpacity="0.22" />
            <stop offset="1" stopColor="var(--series-1)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path d={areaPath(actualPts, H - M.b, true)} fill={`url(#${gid})`} {...enter(reduce, "fade", 0, 0.3)} />
        <DrawPath d={linePath(actualPts, true)} fill="none" stroke="var(--series-1)" strokeWidth={2} strokeLinecap="round" />
        <motion.path d={linePath(forecastPts, true)} fill="none" stroke="var(--series-1)" strokeWidth={2} strokeDasharray="5 5" strokeLinecap="round" {...enter(reduce, "fade", 0, 0.5)} />
        {lastActual >= 0 && forecast.length > 0 && (
          <motion.g aria-hidden {...enter(reduce, "fade", 0, 0.6)}>
            <line x1={x(lastActual)} x2={x(lastActual)} y1={M.t} y2={H - M.b} stroke="var(--track-strong)" strokeDasharray="2 3" />
            <text x={x(lastActual) + 6} y={M.t + 8} fontSize={10} fill="var(--fg-subtle)">Now</text>
          </motion.g>
        )}
        {active !== null && (
          <g aria-hidden>
            <motion.line initial={false} animate={{ x1: x(active), x2: x(active) }} transition={CHART_EASE} y1={M.t} y2={H - M.b} stroke="var(--fg-subtle)" strokeWidth={1} />
            <motion.circle initial={false} animate={{ cx: x(active), cy: y(all[active]) }} transition={CHART_EASE} r={4.5} fill="var(--surface)" stroke="var(--series-1)" strokeWidth={2} />
          </g>
        )}
      </svg>
      {active !== null && (
        <ChartTip x={x(active)} y={y(all[active])} w={W} h={H}>
          <div className="text-fg-muted">{names[active]} · {isForecast ? "forecast" : "actual"}</div>
          <div className="font-medium tabular-nums">{format(all[active])}</div>
          {bounds && <div className="tabular-nums text-fg-muted">{format(bounds[0])} to {format(bounds[1])}</div>}
        </ChartTip>
      )}
      <Live>{active !== null ? `${names[active]}, ${isForecast ? "forecast" : "actual"} ${format(all[active])}` : ""}</Live>
      <figcaption className="mt-2 flex gap-4 text-xs text-fg-muted">
        <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 bg-[var(--series-1)]" />Actual</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-0 w-4 border-t-2 border-dashed border-[var(--series-1)]" />Forecast</span>
      </figcaption>
    </figure>
  );
}
