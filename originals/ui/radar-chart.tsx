"use client";

import { useState } from "react";
import { ChartTip, Live, focusRing, formatNumber, polar, seriesColor, type Point } from "./chart-utils";

/* Radar chart: one polygon per series across shared axes on concentric rings; hover or focus a vertex to read it, hover a legend entry to isolate a series. */

export interface RadarSeries {
  name: string;
  values: number[];
  color?: string;
}

export interface RadarChartProps {
  axes: string[];
  series: RadarSeries[];
  /** Value at the outer ring; defaults to the largest value. */
  max?: number;
  rings?: number;
  format?: (n: number) => string;
  label?: string;
  className?: string;
}

const SIZE = 360;
const C = SIZE / 2;
const R = 120;

export function radarPoints(values: number[], max: number, cx: number, cy: number, radius: number): Point[] {
  const step = values.length === 0 ? 0 : 360 / values.length;
  return values.map((v, i) => polar(cx, cy, (Math.max(0, Math.min(v, max)) / (max || 1)) * radius, i * step));
}

export function RadarChart({ axes, series, max, rings = 4, format = formatNumber, label, className = "" }: RadarChartProps) {
  const [focus, setFocus] = useState<string | null>(null);
  const [tip, setTip] = useState<{ s: number; a: number } | null>(null);
  const top = max ?? Math.max(1, ...series.flatMap((s) => s.values));
  const step = 360 / Math.max(axes.length, 1);
  const colorOf = (s: RadarSeries, i: number) => s.color ?? seriesColor(i);
  const tipPoint = tip ? radarPoints(series[tip.s].values, top, C, C, R)[tip.a] : null;

  return (
    <figure className={`relative m-0 ${className}`}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="group" aria-label={label ?? `Radar chart of ${series.map((s) => s.name).join(", ")} across ${axes.join(", ")}.`} className="mx-auto block h-auto w-full max-w-[360px]">
        <g aria-hidden>
          {Array.from({ length: rings }, (_, k) => {
            const pts = axes.map((_, i) => polar(C, C, (R * (k + 1)) / rings, i * step));
            return <polygon key={k} points={pts.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke="var(--track)" />;
          })}
          {axes.map((a, i) => {
            const end = polar(C, C, R, i * step);
            const lab = polar(C, C, R + 18, i * step);
            return (
              <g key={a}>
                <line x1={C} y1={C} x2={end.x} y2={end.y} stroke="var(--track)" />
                <text x={lab.x} y={lab.y} textAnchor={Math.abs(lab.x - C) < 4 ? "middle" : lab.x > C ? "start" : "end"} dominantBaseline="middle" fontSize={11} fill="var(--fg-muted)">{a}</text>
              </g>
            );
          })}
        </g>
        {series.map((s, si) => {
          const pts = radarPoints(s.values, top, C, C, R);
          const dim = focus !== null && focus !== s.name;
          return (
            <g key={s.name} opacity={dim ? 0.15 : 1} className="transition-opacity">
              <polygon points={pts.map((p) => `${p.x},${p.y}`).join(" ")} fill={`color-mix(in srgb, ${colorOf(s, si)} 18%, transparent)`} stroke={colorOf(s, si)} strokeWidth={2} strokeLinejoin="round" />
              {pts.map((p, ai) => (
                <circle
                  key={axes[ai]}
                  cx={p.x}
                  cy={p.y}
                  r={tip?.s === si && tip.a === ai ? 6 : 4}
                  tabIndex={dim ? -1 : 0}
                  role="img"
                  aria-label={`${s.name}, ${axes[ai]}: ${format(s.values[ai])}`}
                  fill="var(--surface)"
                  stroke={colorOf(s, si)}
                  strokeWidth={2}
                  className={focusRing}
                  onPointerEnter={() => setTip({ s: si, a: ai })}
                  onPointerLeave={() => setTip(null)}
                  onFocus={() => setTip({ s: si, a: ai })}
                  onBlur={() => setTip(null)}
                />
              ))}
            </g>
          );
        })}
      </svg>
      {tip && tipPoint && (
        <ChartTip x={tipPoint.x} y={tipPoint.y} w={SIZE} h={SIZE}>
          <div className="text-fg-muted">{series[tip.s].name} · {axes[tip.a]}</div>
          <div className="font-medium tabular-nums">{format(series[tip.s].values[tip.a])}</div>
        </ChartTip>
      )}
      <Live>{tip ? `${series[tip.s].name}, ${axes[tip.a]}: ${format(series[tip.s].values[tip.a])}` : ""}</Live>
      {series.length > 1 && (
        <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 p-0 text-xs text-fg-muted">
          {series.map((s, i) => (
            <li key={s.name} className="list-none" onPointerEnter={() => setFocus(s.name)} onPointerLeave={() => setFocus(null)}>
              <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: colorOf(s, i) }} />{s.name}</span>
            </li>
          ))}
        </ul>
      )}
    </figure>
  );
}
