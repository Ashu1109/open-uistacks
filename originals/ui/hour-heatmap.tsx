"use client";

import { useState, type KeyboardEvent } from "react";
import { motion } from "motion/react";
import { ChartTip, enter, useChartReduce, Live, focusRing, formatNumber, levelColor, quantizeLevel, stepGrid, type GridPos, useChartWidth } from "./chart-utils";

/* Hour heatmap: weekdays down, hours of the day across, each cell shaded by its value, to show when something peaks; arrow keys move between cells. */

export interface HourHeatmapProps {
  /** One row per day, 24 columns per row. */
  values: number[][];
  days?: string[];
  /** Noun for the tooltip, e.g. "requests". */
  unit?: string;
  format?: (n: number) => string;
  label?: string;
  className?: string;
}

const DEFAULT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const LEFT = 36;
const TOP = 18;
const CELL_H = 22;
const GAP = 3;

export function formatHour(h: number): string {
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12} ${h < 12 ? "am" : "pm"}`;
}

/** The day/hour with the highest value, or null when everything is zero. */
export function peakCell(values: number[][]): { day: number; hour: number; value: number } | null {
  let best: { day: number; hour: number; value: number } | null = null;
  values.forEach((row, day) => row.forEach((value, hour) => (value > (best?.value ?? 0) ? (best = { day, hour, value }) : null)));
  return best;
}

export function HourHeatmap({ values, days = DEFAULT_DAYS, unit = "events", format = formatNumber, label, className = "" }: HourHeatmapProps) {
  const [ref, W] = useChartWidth(640);
  const reduce = useChartReduce();
  const rows = values.length;
  const cols = 24;
  const [active, setActive] = useState<GridPos | null>(null);
  const max = Math.max(0, ...values.flat());
  const cellW = (W - LEFT) / cols - GAP;
  const H = TOP + rows * (CELL_H + GAP);
  const px = (c: number) => LEFT + c * (cellW + GAP);
  const py = (r: number) => TOP + r * (CELL_H + GAP);
  const peak = peakCell(values);
  const value = active ? values[active.row]?.[active.col] ?? 0 : 0;
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") return setActive(null);
    const next = stepGrid(active, e.key, rows, cols);
    if (!next) return;
    e.preventDefault();
    setActive(next);
  };
  const describe = (a: GridPos) => `${days[a.row] ?? a.row + 1} ${formatHour(a.col)}: ${format(values[a.row]?.[a.col] ?? 0)} ${unit}`;

  return (
    <figure ref={ref} className={`relative m-0 ${className}`}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={label ?? `Heatmap of ${unit} by weekday and hour${peak ? `, busiest ${days[peak.day] ?? peak.day + 1} at ${formatHour(peak.hour)}` : ""}.`}
        className={`block h-auto w-full rounded-[10px] ${focusRing}`}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onBlur={() => setActive(null)}
      >
        <g aria-hidden fontSize={10} fill="var(--fg-subtle)">
          {[0, 6, 12, 18].map((h) => <text key={h} x={px(h)} y={10}>{formatHour(h)}</text>)}
          {values.map((_, r) => <text key={r} x={0} y={py(r) + CELL_H / 2} dominantBaseline="middle">{days[r] ?? r + 1}</text>)}
        </g>
        {values.map((row, r) =>
          Array.from({ length: cols }, (_, c) => (
            <motion.rect
              key={`${r}-${c}`}
              x={px(c)}
              y={py(r)}
              width={cellW}
              height={CELL_H}
              rx={4}
              fill={levelColor(quantizeLevel(row[c] ?? 0, max, 5), 5)}
              stroke={active?.row === r && active.col === c ? "var(--fg)" : "none"}
              strokeWidth={1.5}
              className="transition-[stroke,fill] duration-150"
              {...enter(reduce, "fade", (r + c) * 0.3)}
              onPointerEnter={() => setActive({ row: r, col: c })}
              onPointerLeave={() => setActive(null)}
            />
          )),
        )}
      </svg>
      {active && (
        <ChartTip x={px(active.col) + cellW / 2} y={py(active.row)} w={W} h={H}>
          <div className="font-medium tabular-nums">{format(value)} {unit}</div>
          <div className="text-fg-muted">{days[active.row]} · {formatHour(active.col)}</div>
        </ChartTip>
      )}
      <Live>{active ? describe(active) : ""}</Live>
    </figure>
  );
}
