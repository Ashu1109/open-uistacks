"use client";

import { useMemo, useState } from "react";
import { ChartTip, Live, focusRing, formatNumber, worldDots } from "./chart-utils";

/* Dot map: a dotted world-ish map built from an invented coarse lat/long grid (not real geography) with highlighted, focusable locations that pulse and show a tooltip. */

export interface MapLocation {
  label: string;
  lat: number;
  lon: number;
  value?: number;
}

export interface DotMapProps {
  locations: MapLocation[];
  format?: (n: number) => string;
  label?: string;
  className?: string;
}

const W = 720;
const LAT_TOP = 85;
const LAT_BOTTOM = -58;
const H = (W * (LAT_TOP - LAT_BOTTOM)) / 360;

export const projectMap = (lat: number, lon: number) => ({ x: ((lon + 180) / 360) * W, y: ((LAT_TOP - lat) / (LAT_TOP - LAT_BOTTOM)) * H });

export function DotMap({ locations, format = formatNumber, label, className = "" }: DotMapProps) {
  const [active, setActive] = useState<number | null>(null);
  const dots = useMemo(() => worldDots(4).filter((d) => d.lat > LAT_BOTTOM && d.lat < LAT_TOP), []);
  const loc = active === null ? null : locations[active];
  const at = loc ? projectMap(loc.lat, loc.lon) : null;
  const text = (m: MapLocation) => `${m.label}${m.value === undefined ? "" : `: ${format(m.value)}`}`;

  return (
    <figure className={`relative m-0 ${className}`}>
      <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label={label ?? `Dot map with ${locations.length} highlighted locations.`} className="block h-auto w-full">
        <g aria-hidden fill="var(--track-strong)">
          {dots.map((d) => {
            const p = projectMap(d.lat, d.lon);
            return <circle key={`${d.lat}:${d.lon}`} cx={p.x} cy={p.y} r={2} />;
          })}
        </g>
        {locations.map((m, i) => {
          const p = projectMap(m.lat, m.lon);
          return (
            <g
              key={m.label}
              role="img"
              tabIndex={0}
              aria-label={text(m)}
              className={`cursor-pointer ${focusRing}`}
              onPointerEnter={() => setActive(i)}
              onPointerLeave={() => setActive(null)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
            >
              <circle cx={p.x} cy={p.y} r={5} fill="var(--select)" opacity={0.35} className="origin-center motion-safe:animate-ping [transform-box:fill-box]" />
              <circle cx={p.x} cy={p.y} r={active === i ? 6 : 4.5} fill="var(--select)" stroke="var(--surface)" strokeWidth={1.5} />
              <circle cx={p.x} cy={p.y} r={12} fill="transparent" />
            </g>
          );
        })}
      </svg>
      {loc && at && <ChartTip x={at.x} y={at.y} w={W} h={H}><div className="font-medium">{loc.label}</div>{loc.value !== undefined && <div className="tabular-nums text-fg-muted">{format(loc.value)}</div>}</ChartTip>}
      <Live>{loc ? text(loc) : ""}</Live>
    </figure>
  );
}
