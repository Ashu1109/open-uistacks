"use client";

import { useState } from "react";
import { Live, focusRing, formatNumber, formatPercent, seriesColor } from "./chart-utils";

/* Waffle chart: a 10 by 10 grid where each square is one percent of the whole, filled from the bottom by segment; hover or focus a legend entry to light up its squares. */

export interface WaffleSegment {
  label: string;
  value: number;
  color?: string;
}

export interface WaffleChartProps {
  segments: WaffleSegment[];
  /** Squares in the grid; 100 makes each square one percent. */
  cells?: number;
  format?: (n: number) => string;
  label?: string;
  className?: string;
}

/** Segment index for each square, using largest remainders so the squares always add up to `cells`. */
export function waffleCells(segments: WaffleSegment[], cells = 100): number[] {
  const total = segments.reduce((s, x) => s + Math.max(x.value, 0), 0);
  if (total === 0) return [];
  const exact = segments.map((s) => (Math.max(s.value, 0) / total) * cells);
  const counts = exact.map(Math.floor);
  const order = exact.map((e, i) => ({ i, r: e - Math.floor(e) })).sort((a, b) => b.r - a.r);
  for (let k = 0; k < cells - counts.reduce((a, b) => a + b, 0); k++) counts[order[k % order.length].i] += 1;
  return counts.flatMap((n, i) => Array<number>(n).fill(i));
}

const GRID = 10;
const SIZE = 22;
const GAP = 4;

export function WaffleChart({ segments, cells = 100, format = formatNumber, label, className = "" }: WaffleChartProps) {
  const [active, setActive] = useState<number | null>(null);
  const owners = waffleCells(segments, cells);
  const total = segments.reduce((s, x) => s + Math.max(x.value, 0), 0);
  const cols = Math.round(Math.sqrt(cells)) || GRID;
  const rows = Math.ceil(cells / cols);
  const side = cols * (SIZE + GAP) - GAP;
  const sideH = rows * (SIZE + GAP) - GAP;
  const colorOf = (s: WaffleSegment, i: number) => s.color ?? seriesColor(i);

  return (
    <figure className={`m-0 flex flex-wrap items-center gap-x-8 gap-y-4 ${className}`}>
      <svg viewBox={`0 0 ${side} ${sideH}`} role="img" aria-label={label ?? `Waffle chart: ${segments.map((s) => `${s.label} ${total === 0 ? 0 : Math.round((s.value / total) * 100)}%`).join(", ")}.`} className="h-auto w-[220px] max-w-full">
        {owners.map((seg, k) => {
          const row = Math.floor(k / cols);
          const col = k % cols;
          return <rect key={k} x={col * (SIZE + GAP)} y={sideH - SIZE - row * (SIZE + GAP)} width={SIZE} height={SIZE} rx={5} fill={colorOf(segments[seg], seg)} opacity={active === null || active === seg ? 1 : 0.18} className="transition-opacity" />;
        })}
      </svg>
      <ul className="m-0 grid gap-1 p-0">
        {segments.map((s, i) => (
          <li key={s.label} className="list-none">
            <button type="button" onPointerEnter={() => setActive(i)} onPointerLeave={() => setActive(null)} onFocus={() => setActive(i)} onBlur={() => setActive(null)} className={`flex w-full items-center gap-2.5 rounded-[10px] px-2 py-1.5 text-left text-[13px] transition-colors hover:bg-subtle ${focusRing}`}>
              <span className="size-2.5 rounded-[3px]" style={{ background: colorOf(s, i) }} />
              <span className="flex-1 text-fg">{s.label}</span>
              <span className="tabular-nums text-fg-muted">{format(s.value)}</span>
              <span className="w-10 text-right tabular-nums text-fg">{total === 0 ? "0%" : formatPercent(s.value / total)}</span>
            </button>
          </li>
        ))}
      </ul>
      <Live>{active !== null && segments[active] ? `${segments[active].label}: ${format(segments[active].value)}` : ""}</Live>
    </figure>
  );
}
