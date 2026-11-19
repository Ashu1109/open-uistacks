"use client";

import { motion } from "motion/react";
import { CHART_EASE, ChartTip, enter, useChartReduce, Live, XLabels, YGrid, extent, focusRing, formatNumber, linearScale, niceTicks, pointerIndex, useActiveIndex, useChartWidth } from "./chart-utils";

/* Candlestick: open, high, low and close per period as candles, green when the period closed up and red when down; hover or arrow keys read the full OHLC. */

export interface Candle {
  label: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface CandlestickProps {
  data: Candle[];
  format?: (n: number) => string;
  label?: string;
  className?: string;
}

const H = 280;
const M = { t: 14, r: 16, b: 28, l: 48 };

export const candleChange = (c: Candle) => (c.open === 0 ? 0 : (c.close - c.open) / c.open);

export function Candlestick({ data, format = formatNumber, label, className = "" }: CandlestickProps) {
  const [ref, W] = useChartWidth(640);
  const reduce = useChartReduce();
  const n = data.length;
  const { active, setActive, focusProps } = useActiveIndex(n);
  const [lo, hi] = extent(data.flatMap((c) => [c.low, c.high]));
  const ticks = niceTicks(lo, hi, 5);
  const y = linearScale([ticks[0], ticks[ticks.length - 1]], [H - M.b, M.t]);
  const slot = (W - M.l - M.r) / Math.max(n, 1);
  const x = (i: number) => M.l + slot * (i + 0.5);
  const bodyW = Math.max(2, Math.min(18, slot * 0.6));
  const c = active === null ? null : data[active];

  return (
    <figure ref={ref} className={`relative m-0 ${className}`}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={label ?? `Candlestick chart of ${n} periods, from ${format(data[0]?.open ?? 0)} to ${format(data[n - 1]?.close ?? 0)}.`}
        className={`block h-auto w-full rounded-[10px] ${focusRing}`}
        onPointerMove={(e) => setActive(pointerIndex(e, n, x(0), x(n - 1), W))}
        onPointerLeave={() => setActive(null)}
        {...focusProps}
      >
        <YGrid ticks={ticks} y={y} x0={M.l} x1={W - M.r} format={format} />
        <XLabels labels={data.map((d) => d.label)} x={x} y={H - 8} />
        {data.map((d, i) => {
          const up = d.close >= d.open;
          const color = up ? "var(--success)" : "var(--danger)";
          return (
            <motion.g key={`${d.label}-${i}`} {...enter(reduce, "growY", i, 0, { y: y((d.high + d.low) / 2) })}>
              <g className="transition-opacity duration-150" opacity={active === null || active === i ? 1 : 0.55}>
              <line x1={x(i)} x2={x(i)} y1={y(d.high)} y2={y(d.low)} stroke={color} strokeWidth={1.5} />
              <rect x={x(i) - bodyW / 2} y={Math.min(y(d.open), y(d.close))} width={bodyW} height={Math.max(1.5, Math.abs(y(d.open) - y(d.close)))} rx={1.5} fill={color} />
              </g>
            </motion.g>
          );
        })}
        {active !== null && <motion.line initial={false} animate={{ x1: x(active), x2: x(active) }} transition={CHART_EASE} y1={M.t} y2={H - M.b} stroke="var(--fg-subtle)" strokeDasharray="2 3" aria-hidden />}
      </svg>
      {c && active !== null && (
        <ChartTip x={x(active)} y={y(c.high)} w={W} h={H}>
          <div className="mb-1 flex items-center justify-between gap-4"><span className="text-fg-muted">{c.label}</span><span className={`tabular-nums ${c.close >= c.open ? "text-success-text" : "text-danger-text"}`}>{c.close >= c.open ? "+" : ""}{(candleChange(c) * 100).toFixed(2)}%</span></div>
          <dl className="m-0 grid grid-cols-[auto_auto] gap-x-4 tabular-nums">
            {([["Open", c.open], ["High", c.high], ["Low", c.low], ["Close", c.close]] as const).map(([k, v]) => (
              <div key={k} className="contents"><dt className="text-fg-muted">{k}</dt><dd className="m-0 text-right font-medium">{format(v)}</dd></div>
            ))}
          </dl>
        </ChartTip>
      )}
      <Live>{c ? `${c.label}: open ${format(c.open)}, high ${format(c.high)}, low ${format(c.low)}, close ${format(c.close)}` : ""}</Live>
    </figure>
  );
}
