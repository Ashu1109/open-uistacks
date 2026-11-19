"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { ChartTip, enter, useChartReduce, Live, focusRing, formatNumber, formatPercent, useChartWidth } from "./chart-utils";

/* Funnel chart: stages as centred trapezoids sized by value, with the conversion rate from each stage to the next; hover or focus a stage for its share of the top. */

export interface FunnelStage {
  label: string;
  value: number;
}

export interface FunnelChartProps {
  stages: FunnelStage[];
  format?: (n: number) => string;
  label?: string;
  className?: string;
}

const ROW = 56;
const GAP = 4;
const LABEL_W = 150;

export function funnelRates(stages: FunnelStage[]) {
  const top = stages[0]?.value ?? 0;
  return stages.map((s, i) => ({
    ofTop: top === 0 ? 0 : s.value / top,
    ofPrevious: i === 0 ? 1 : stages[i - 1].value === 0 ? 0 : s.value / stages[i - 1].value,
  }));
}

export function FunnelChart({ stages, format = formatNumber, label, className = "" }: FunnelChartProps) {
  const [ref, W] = useChartWidth(640);
  const reduce = useChartReduce();
  const [active, setActive] = useState<number | null>(null);
  const rates = funnelRates(stages);
  const top = Math.max(stages[0]?.value ?? 0, 1);
  const H = Math.max(stages.length, 1) * (ROW + GAP);
  const cx = LABEL_W + (W - LABEL_W) / 2;
  const half = (v: number) => (Math.max(v, 0) / top) * ((W - LABEL_W) / 2);
  const finalRate = stages.length > 1 ? formatPercent(rates[stages.length - 1].ofTop, 1) : "100%";

  return (
    <figure ref={ref} className={`relative m-0 ${className}`}>
      <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label={label ?? `Funnel with ${stages.length} stages, ${finalRate} reaching the last stage.`} className="block h-auto w-full">
        {stages.map((s, i) => {
          const y = i * (ROW + GAP);
          const next = stages[i + 1]?.value ?? s.value * 0.8;
          const color = `color-mix(in srgb, var(--series-1) ${Math.round(100 - (i / Math.max(stages.length, 1)) * 55)}%, var(--surface))`;
          return (
            <g
              key={s.label}
              role="img"
              tabIndex={0}
              aria-label={`${s.label}: ${format(s.value)}, ${formatPercent(rates[i].ofTop, 1)} of the first stage${i > 0 ? `, ${formatPercent(rates[i].ofPrevious, 1)} of the previous stage` : ""}`}
              opacity={active === null || active === i ? 1 : 0.55}
              className={`rounded-[6px] transition-opacity duration-150 ${focusRing}`}
              onPointerEnter={() => setActive(i)}
              onPointerLeave={() => setActive(null)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
            >
              <motion.polygon {...enter(reduce, "growX", i * 1.5, 0, { x: cx })} points={`${cx - half(s.value)},${y} ${cx + half(s.value)},${y} ${cx + half(next)},${y + ROW} ${cx - half(next)},${y + ROW}`} fill={color} />
              <motion.g {...enter(reduce, "slideX", i * 1.5, 0.05)}>
              <text x={0} y={y + 14} dominantBaseline="middle" fontSize={13} fontWeight={500} fill="var(--fg)">{s.label}</text>
              <text x={0} y={y + 31} dominantBaseline="middle" fontSize={12} fill="var(--fg-muted)">{format(s.value)} · {formatPercent(rates[i].ofTop, 1)}</text>
              {i > 0 && <text x={0} y={y + 47} dominantBaseline="middle" fontSize={11} fontWeight={500} fill="var(--fg-muted)" aria-hidden>↓ {formatPercent(rates[i].ofPrevious, 0)} of previous</text>}
              </motion.g>
            </g>
          );
        })}
      </svg>
      {active !== null && stages[active] && (
        <ChartTip x={cx + half(stages[active].value)} y={active * (ROW + GAP) + ROW / 2} w={W} h={H}>
          <div className="font-medium">{stages[active].label}</div>
          <div className="tabular-nums text-fg-muted">{format(stages[active].value)} · {formatPercent(rates[active].ofTop, 1)} of top</div>
          {active > 0 && <div className="tabular-nums text-fg-muted">{formatPercent(rates[active].ofPrevious, 1)} of previous, {formatPercent(1 - rates[active].ofPrevious, 1)} dropped</div>}
        </ChartTip>
      )}
      <Live>{active !== null && stages[active] ? `${stages[active].label}: ${format(stages[active].value)}, ${formatPercent(rates[active].ofTop, 1)} of top` : ""}</Live>
    </figure>
  );
}
