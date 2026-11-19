"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { CHART_SPRING, ChartTip, enter, useChartReduce, useTween, Live, focusRing, formatNumber } from "./chart-utils";

/* Bullet chart: a compact progress-versus-target row per metric, with qualitative bands behind a value bar and a target tick; hover or focus a row for the exact numbers. */

export interface BulletRow {
  label: string;
  value: number;
  target: number;
  /** Upper edges of the poor, fair and good bands; the last one is the scale maximum. */
  ranges: [number, number, number];
}

export interface BulletChartProps {
  rows: BulletRow[];
  format?: (n: number) => string;
  label?: string;
  className?: string;
}

const BAND_SHADE = [22, 12, 5];

export function bulletStatus(row: BulletRow): "met" | "near" | "behind" {
  if (row.value >= row.target) return "met";
  return row.value >= row.target * 0.85 ? "near" : "behind";
}

const STATUS_TEXT = { met: "text-success-text", near: "text-warning-text", behind: "text-danger-text" } as const;
const STATUS_LABEL = { met: "on target", near: "close to target", behind: "behind target" } as const;

function Percent({ ratio, reduce, className }: { ratio: number; reduce: boolean; className: string }) {
  const shown = useTween(ratio, reduce);
  return <span className={className}>{Math.round(shown * 100)}%</span>;
}

export function BulletChart({ rows, format = formatNumber, label, className = "" }: BulletChartProps) {
  const reduce = useChartReduce();
  const [active, setActive] = useState<number | null>(null);

  return (
    <figure className={`relative m-0 ${className}`}>
      <ul aria-label={label ?? "Progress against targets"} className="m-0 grid gap-4 p-0">
        {rows.map((r, i) => {
          const max = Math.max(r.ranges[2], r.value, r.target, 1);
          const pct = (v: number) => `${(Math.min(Math.max(v, 0), max) / max) * 100}%`;
          const status = bulletStatus(r);
          return (
            <motion.li key={r.label} {...enter(reduce, "rise", i)} className="grid list-none grid-cols-[minmax(5rem,9rem)_1fr_auto] items-center gap-x-4">
              <span className="truncate text-[13px] text-fg">{r.label}</span>
              <div
                role="img"
                tabIndex={0}
                aria-label={`${r.label}: ${format(r.value)} against a target of ${format(r.target)}, ${STATUS_LABEL[status]}`}
                className={`relative h-6 rounded-[6px] ${focusRing}`}
                onPointerEnter={() => setActive(i)}
                onPointerLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
              >
                {[...r.ranges].reverse().map((edge, k) => (
                  <motion.div key={k} {...enter(reduce, "growX", i + k * 0.5)} className="absolute inset-y-0 left-0 rounded-[6px]" style={{ width: pct(edge), background: `color-mix(in srgb, var(--fg) ${BAND_SHADE[2 - k]}%, var(--surface))`, transformOrigin: "0% 50%" }} />
                ))}
                <motion.div className="absolute inset-y-[9px] left-0 rounded-full bg-[var(--select)]" initial={reduce ? false : { width: 0 }} animate={{ width: pct(r.value) }} transition={{ ...CHART_SPRING, delay: reduce ? 0 : 0.15 + i * 0.04 }} />
                <motion.div {...enter(reduce, "growY", i, 0.3)} className="absolute inset-y-[3px] w-0.5 rounded-full bg-fg" style={{ left: `calc(${pct(r.target)} - 1px)`, transformOrigin: "50% 50%" }} />
                {active === i && <ChartTip x={Math.min(r.value, max)} y={0} w={max} h={1}><div className="tabular-nums">{format(r.value)} of {format(r.target)} target</div></ChartTip>}
              </div>
              <Percent ratio={r.value / (r.target || 1)} reduce={reduce} className={`w-12 text-right text-xs tabular-nums transition-colors duration-200 ${STATUS_TEXT[status]}`} />
            </motion.li>
          );
        })}
      </ul>
      <Live>{active !== null && rows[active] ? `${rows[active].label}: ${format(rows[active].value)} of ${format(rows[active].target)}` : ""}</Live>
    </figure>
  );
}
