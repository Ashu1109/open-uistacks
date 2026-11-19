"use client";

import { useState } from "react";
import { ChartTip, Live, focusRing, formatNumber, formatPercent, seriesColor, treemapLayout, useChartWidth } from "./chart-utils";

/* Treemap: rectangles tiled by a squarified layout so area equals value; labels appear where they fit, and hover or focus shows each item's share of the total. */

export interface TreemapItem {
  id?: string;
  label: string;
  value: number;
  color?: string;
}

export interface TreemapProps {
  items: TreemapItem[];
  format?: (n: number) => string;
  label?: string;
  className?: string;
}

const H = 360;
const INSET = 1.5;

export function Treemap({ items, format = formatNumber, label, className = "" }: TreemapProps) {
  const [ref, W] = useChartWidth(640);
  const [active, setActive] = useState<number | null>(null);
  const total = items.reduce((s, i) => s + Math.max(i.value, 0), 0);
  const tiles = treemapLayout(items, { x: 0, y: 0, w: W, h: H });
  const colorOf = (item: TreemapItem) => item.color ?? seriesColor(items.indexOf(item));
  const share = (v: number) => (total === 0 ? "0%" : formatPercent(v / total, 1));
  const current = active === null ? null : tiles[active];

  return (
    <figure ref={ref} className={`relative m-0 ${className}`}>
      <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label={label ?? `Treemap of ${tiles.length} items totalling ${format(total)}.`} className="block h-auto w-full">
        {tiles.map((t, i) => {
          const fits = t.w > 64 && t.h > 36;
          return (
            <g
              key={t.item.id ?? t.item.label}
              role="img"
              tabIndex={0}
              aria-label={`${t.item.label}: ${format(t.item.value)}, ${share(t.item.value)} of total`}
              className={focusRing}
              opacity={active === null || active === i ? 1 : 0.6}
              onPointerEnter={() => setActive(i)}
              onPointerLeave={() => setActive(null)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
            >
              <rect x={t.x + INSET} y={t.y + INSET} width={Math.max(t.w - INSET * 2, 0)} height={Math.max(t.h - INSET * 2, 0)} rx={8} fill={`color-mix(in srgb, ${colorOf(t.item)} 82%, var(--surface))`} />
              {fits && (
                <>
                  <text x={t.x + 12} y={t.y + 22} fontSize={12} fontWeight={600} fill="var(--inverse-fg)">{t.item.label.length * 7 > t.w - 20 ? `${t.item.label.slice(0, Math.max(3, Math.floor((t.w - 20) / 7) - 1))}…` : t.item.label}</text>
                  <text x={t.x + 12} y={t.y + 38} fontSize={11} fill="var(--inverse-fg)" opacity={0.85}>{format(t.item.value)}</text>
                </>
              )}
            </g>
          );
        })}
      </svg>
      {current && <ChartTip x={current.x + current.w / 2} y={current.y + current.h / 2} w={W} h={H}><div className="font-medium">{current.item.label}</div><div className="tabular-nums text-fg-muted">{format(current.item.value)} · {share(current.item.value)}</div></ChartTip>}
      <Live>{current ? `${current.item.label}: ${format(current.item.value)}, ${share(current.item.value)}` : ""}</Live>
    </figure>
  );
}
