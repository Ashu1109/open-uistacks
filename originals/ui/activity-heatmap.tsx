"use client";

import { useState, type KeyboardEvent } from "react";
import { motion } from "motion/react";
import { ChartTip, enter, useChartReduce, Live, focusRing, levelColor, quantizeLevel, stepGrid, useChartWidth, type GridPos } from "./chart-utils";

/* Activity heatmap: a calendar grid of weeks by weekdays where each day's colour reflects its count, with month labels and a less-to-more legend; arrow keys move between days. */

export interface ActivityDay {
  /** ISO date, YYYY-MM-DD. */
  date: string;
  count: number;
}

export interface ActivityHeatmapProps {
  data: ActivityDay[];
  weeks?: number;
  /** Last day shown, YYYY-MM-DD; defaults to the latest date in `data`. */
  endDate?: string;
  /** Noun for the tooltip, e.g. "commits". */
  unit?: string;
  label?: string;
  className?: string;
}

const DAY_MS = 86_400_000;
const CELL = 12;
const GAP = 3;
const LEFT = 30;
const TOP = 18;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_LABELS: Record<number, string> = { 1: "Mon", 3: "Wed", 5: "Fri" };

const toUtc = (iso: string) => new Date(`${iso}T00:00:00Z`);
const toIso = (d: Date) => d.toISOString().slice(0, 10);
export const formatDay = (iso: string) => toUtc(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export interface HeatCell {
  date: string;
  count: number;
}

/** Columns are Sunday-first weeks ending with the week of `end`; days after `end` are null. */
export function buildHeatmapGrid(data: ActivityDay[], weeks: number, end: string): (HeatCell | null)[][] {
  const counts = new Map(data.map((d) => [d.date, d.count]));
  const endDate = toUtc(end);
  const start = endDate.getTime() - (endDate.getUTCDay() + (weeks - 1) * 7) * DAY_MS;
  return Array.from({ length: weeks }, (_, c) =>
    Array.from({ length: 7 }, (_, r) => {
      const t = start + (c * 7 + r) * DAY_MS;
      if (t > endDate.getTime()) return null;
      const date = toIso(new Date(t));
      return { date, count: counts.get(date) ?? 0 };
    }),
  );
}

export function ActivityHeatmap({ data, weeks: maxWeeks = 26, endDate, unit = "contributions", label, className = "" }: ActivityHeatmapProps) {
  const [ref, available] = useChartWidth<HTMLDivElement>(LEFT + maxWeeks * (CELL + GAP));
  const weeks = Math.max(Math.min(maxWeeks, 4), Math.min(maxWeeks, Math.floor((available - LEFT) / (CELL + GAP))));
  const end = endDate ?? ([...data].map((d) => d.date).sort().pop() ?? toIso(new Date()));
  const grid = buildHeatmapGrid(data, weeks, end);
  const max = Math.max(0, ...grid.flat().map((c) => c?.count ?? 0));
  const total = grid.flat().reduce((s, c) => s + (c?.count ?? 0), 0);
  const reduce = useChartReduce();
  const [active, setActive] = useState<GridPos | null>(null);
  const W = LEFT + weeks * (CELL + GAP);
  const H = TOP + 7 * (CELL + GAP);
  const cell = active ? grid[active.col]?.[active.row] ?? null : null;
  const px = (col: number) => LEFT + col * (CELL + GAP);
  const py = (row: number) => TOP + row * (CELL + GAP);
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") return setActive(null);
    let next = stepGrid(active, e.key, 7, weeks);
    if (!next) return;
    e.preventDefault();
    if (!grid[next.col]?.[next.row]) next = { ...next, row: Math.max(0, grid[next.col].findIndex((c) => c === null) - 1) };
    setActive(next);
  };
  const noun = (n: number) => `${n} ${unit}`;

  return (
    <div ref={ref} className={className}>
    <figure className="relative m-0 w-fit max-w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={label ?? `Activity heatmap: ${noun(total)} over ${weeks} weeks ending ${formatDay(end)}.`}
        width={W}
        height={H}
        className={`block max-w-none rounded-[10px] ${focusRing}`}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onBlur={() => setActive(null)}
      >
        <g aria-hidden fontSize={10} fill="var(--fg-subtle)">
          {grid.map((col, c) => {
            const first = col[0];
            const prev = grid[c - 1]?.[0];
            return first && (!prev || toUtc(prev.date).getUTCMonth() !== toUtc(first.date).getUTCMonth()) ? <text key={c} x={px(c)} y={10}>{MONTHS[toUtc(first.date).getUTCMonth()]}</text> : null;
          })}
          {Object.entries(DAY_LABELS).map(([r, name]) => <text key={r} x={0} y={py(Number(r)) + CELL - 2}>{name}</text>)}
        </g>
        {grid.map((col, c) =>
          col.map((d, r) =>
            d && (
              <motion.rect
                key={d.date}
                x={px(c)}
                y={py(r)}
                width={CELL}
                height={CELL}
                rx={3}
                fill={levelColor(quantizeLevel(d.count, max))}
                stroke={active?.col === c && active.row === r ? "var(--fg)" : "none"}
                strokeWidth={1.5}
                className="transition-[stroke,fill] duration-150"
                {...enter(reduce, "pop", (c + r) * 0.3)}
                onPointerEnter={() => setActive({ col: c, row: r })}
                onPointerLeave={() => setActive(null)}
              />
            ),
          ),
        )}
      </svg>
      {cell && active && (
        <ChartTip x={px(active.col) + CELL / 2} y={py(active.row)} w={W} h={H}>
          <div className="font-medium tabular-nums">{noun(cell.count)}</div>
          <div className="text-fg-muted">{formatDay(cell.date)}</div>
        </ChartTip>
      )}
      <Live>{cell ? `${formatDay(cell.date)}: ${noun(cell.count)}` : ""}</Live>
      <figcaption className="mt-2 flex items-center justify-end gap-1.5 text-xs text-fg-muted">
        Less
        {[0, 1, 2, 3, 4].map((l) => <span key={l} className="size-3 rounded-[3px]" style={{ background: levelColor(l) }} />)}
        More
      </figcaption>
    </figure>
    </div>
  );
}
