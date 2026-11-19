"use client";

import { useState } from "react";
import { ChartTip, Live, XLabels, YGrid, extent, focusRing, formatNumber, linePath, linearScale, niceTicks, pointerIndex, seriesColor, useActiveIndex, useChartWidth } from "./chart-utils";

/* Multi-line chart: several series on shared axes with a hover crosshair that reads every series at once, and a legend whose entries toggle lines on and off. */

export interface LineSeries {
  name: string;
  values: number[];
  color?: string;
}

export interface MultiLineProps {
  series: LineSeries[];
  labels: string[];
  smooth?: boolean;
  format?: (n: number) => string;
  label?: string;
  className?: string;
}

const H = 280;
const M = { t: 14, r: 16, b: 28, l: 44 };

export function MultiLine({ series, labels, smooth = false, format = formatNumber, label, className = "" }: MultiLineProps) {
  const [ref, W] = useChartWidth(640);
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
  const visible = series.filter((s) => !hidden.has(s.name));
  const n = Math.max(0, ...series.map((s) => s.values.length), labels.length);
  const { active, setActive, focusProps } = useActiveIndex(n);
  const [lo, hi] = extent(visible.flatMap((s) => s.values));
  const ticks = niceTicks(Math.min(lo, 0), hi, 4);
  const y = linearScale([ticks[0], ticks[ticks.length - 1]], [H - M.b, M.t]);
  const x = (i: number) => M.l + (n <= 1 ? 0 : (i / (n - 1)) * (W - M.l - M.r));
  const colorOf = (s: LineSeries) => s.color ?? seriesColor(series.indexOf(s));
  const toggle = (name: string) => setHidden((prev) => {
    const next = new Set(prev);
    if (!next.delete(name)) next.add(name);
    return next;
  });
  const readout = active === null ? "" : `${labels[active] ?? active + 1}: ${visible.map((s) => `${s.name} ${format(s.values[active] ?? 0)}`).join(", ")}`;

  return (
    <figure ref={ref} className={`relative m-0 ${className}`}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={label ?? `Line chart with ${series.length} series over ${n} points: ${series.map((s) => s.name).join(", ")}.`}
        className={`block h-auto w-full rounded-[10px] ${focusRing}`}
        onPointerMove={(e) => setActive(pointerIndex(e, n, M.l, W - M.r, W))}
        onPointerLeave={() => setActive(null)}
        {...focusProps}
      >
        <YGrid ticks={ticks} y={y} x0={M.l} x1={W - M.r} format={format} />
        <XLabels labels={labels} x={x} y={H - 8} />
        {visible.map((s) => (
          <path key={s.name} d={linePath(s.values.map((v, i) => ({ x: x(i), y: y(v) })), smooth)} fill="none" stroke={colorOf(s)} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {active !== null && (
          <g aria-hidden>
            <line x1={x(active)} x2={x(active)} y1={M.t} y2={H - M.b} stroke="var(--fg-subtle)" />
            {visible.map((s) => s.values[active] !== undefined && <circle key={s.name} cx={x(active)} cy={y(s.values[active])} r={4} fill="var(--surface)" stroke={colorOf(s)} strokeWidth={2} />)}
          </g>
        )}
      </svg>
      {active !== null && (
        <ChartTip x={x(active)} y={M.t + 30} w={W} h={H}>
          <div className="mb-1 text-fg-muted">{labels[active]}</div>
          {visible.map((s) => (
            <div key={s.name} className="flex items-center justify-between gap-4">
              <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: colorOf(s) }} />{s.name}</span>
              <span className="tabular-nums font-medium">{format(s.values[active] ?? 0)}</span>
            </div>
          ))}
        </ChartTip>
      )}
      <Live>{readout}</Live>
      <ul className="mt-2 flex flex-wrap gap-x-2 gap-y-1 p-0">
        {series.map((s) => (
          <li key={s.name} className="list-none">
            <button type="button" aria-pressed={!hidden.has(s.name)} onClick={() => toggle(s.name)} className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs text-fg-muted transition-opacity hover:bg-subtle aria-[pressed=false]:opacity-45 ${focusRing}`}>
              <span className="size-2 rounded-full" style={{ background: colorOf(s) }} />
              {s.name}
            </button>
          </li>
        ))}
      </ul>
    </figure>
  );
}
