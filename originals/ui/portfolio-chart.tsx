"use client";

import { useId, useState } from "react";
import { CountUp, ChartTip, Live, areaPath, extent, focusRing, formatCurrency, linePath, linearScale, pointerIndex, useActiveIndex, useChartWidth } from "./chart-utils";

/* Portfolio chart: a headline value with its change over the selected range, a smooth area chart under it, and range buttons; scrubbing the chart swaps the headline for that point. */

export interface PortfolioRange {
  id: string;
  label: string;
  values: number[];
  labels?: string[];
}

export interface PortfolioChartProps {
  ranges: PortfolioRange[];
  title?: string;
  range?: string;
  defaultRange?: string;
  onRangeChange?: (id: string) => void;
  format?: (n: number) => string;
  className?: string;
}

export function periodChange(values: number[], upTo = values.length - 1): { abs: number; pct: number } {
  if (values.length === 0) return { abs: 0, pct: 0 };
  const first = values[0];
  const abs = values[Math.min(upTo, values.length - 1)] - first;
  return { abs, pct: first === 0 ? 0 : abs / Math.abs(first) };
}

const H = 220;
const PAD = 8;

export function PortfolioChart({ ranges, title = "Portfolio value", range, defaultRange, onRangeChange, format = formatCurrency, className = "" }: PortfolioChartProps) {
  const [ref, W] = useChartWidth<HTMLDivElement>(640);
  const gid = useId();
  const [inner, setInner] = useState(defaultRange ?? ranges[0]?.id ?? "");
  const selected = range ?? inner;
  const current = ranges.find((r) => r.id === selected) ?? ranges[0];
  const values = current?.values ?? [];
  const n = values.length;
  const { active, setActive, focusProps } = useActiveIndex(n);
  const shownIndex = active ?? n - 1;
  const { abs, pct } = periodChange(values, shownIndex);
  const [lo, hi] = extent(values);
  const pad = (hi - lo) * 0.12 || 1;
  const y = linearScale([lo - pad, hi + pad], [H - PAD, PAD]);
  const x = (i: number) => PAD + (n <= 1 ? 0 : (i / (n - 1)) * (W - PAD * 2));
  const pts = values.map((v, i) => ({ x: x(i), y: y(v) }));
  const up = abs >= 0;
  const pick = (id: string) => {
    setInner(id);
    onRangeChange?.(id);
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-xs text-fg-muted">{title}</div>
          <div className="text-[28px] font-semibold leading-tight tabular-nums text-fg"><CountUp text={format(values[shownIndex] ?? 0)} /></div>
          <div className={`text-[13px] tabular-nums ${up ? "text-success-text" : "text-danger-text"}`}>
            {up ? "+" : "−"}{format(Math.abs(abs))} ({up ? "+" : "−"}{(Math.abs(pct) * 100).toFixed(2)}%)
            <span className="ml-1.5 text-fg-muted">{active !== null ? current?.labels?.[active] ?? "" : current?.label ?? ""}</span>
          </div>
        </div>
        <div role="group" aria-label="Time range" className="flex gap-0.5 rounded-full bg-subtle p-0.5">
          {ranges.map((r) => (
            <button key={r.id} type="button" aria-pressed={r.id === current?.id} onClick={() => pick(r.id)} className={`h-7 rounded-full px-3 text-xs font-medium text-fg-muted transition-colors hover:text-fg aria-pressed:bg-surface aria-pressed:text-fg aria-pressed:shadow-[var(--shadow-card)] dark:aria-pressed:bg-raised ${focusRing}`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <div className="relative mt-3">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`${title} over ${current?.label ?? "the selected range"}: from ${format(values[0] ?? 0)} to ${format(values[n - 1] ?? 0)}, ${up ? "up" : "down"} ${(Math.abs(periodChange(values).pct) * 100).toFixed(2)}%.`}
          className={`block h-auto w-full rounded-[10px] ${focusRing}`}
          onPointerMove={(e) => setActive(pointerIndex(e, n, PAD, W - PAD, W))}
          onPointerLeave={() => setActive(null)}
          {...focusProps}
        >
          <defs>
            <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={up ? "var(--success)" : "var(--danger)"} stopOpacity="0.25" />
              <stop offset="1" stopColor={up ? "var(--success)" : "var(--danger)"} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath(pts, H, true)} fill={`url(#${gid})`} />
          <path d={linePath(pts, true)} fill="none" stroke={up ? "var(--success)" : "var(--danger)"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          {active !== null && (
            <g aria-hidden>
              <line x1={x(active)} x2={x(active)} y1={0} y2={H} stroke="var(--fg-subtle)" />
              <circle cx={x(active)} cy={y(values[active])} r={4.5} fill="var(--surface)" stroke={up ? "var(--success)" : "var(--danger)"} strokeWidth={2} />
            </g>
          )}
        </svg>
        {active !== null && <ChartTip x={x(active)} y={y(values[active])} w={W} h={H}>{current?.labels?.[active] ?? `#${active + 1}`}</ChartTip>}
      </div>
      <Live>{active !== null ? `${current?.labels?.[active] ?? active + 1}: ${format(values[active])}` : ""}</Live>
    </div>
  );
}
