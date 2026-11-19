"use client";

import { useRef } from "react";
import { useFrameLoop } from "./ascii-field";

/* ASCII globe: a rotating sphere drawn in characters with orthographic projection, simple land masses and a lit side; it pauses off-screen and shows one still frame under reduced motion. */

export const LAND_RAMP = "-=+*#%@";
export const OCEAN_RAMP = " .,:";
const LIGHT = (() => {
  const v = [-0.45, -0.5, 0.75] as const;
  const n = Math.hypot(...v);
  return [v[0] / n, v[1] / n, v[2] / n] as const;
})();

/** A cheap fake map: overlapping waves of longitude and latitude. */
export function isLand(lon: number, lat: number): boolean {
  return Math.sin(lon * 2 + 1) * Math.cos(lat * 3) + 0.6 * Math.sin(lon * 5 - lat * 2) + 0.4 * Math.cos(lon * 3 + lat * 4) > 0.55;
}

/** Character for the sphere at normalized screen position (nx, ny) in [-1, 1], or a space outside it. */
export function globeChar(nx: number, ny: number, rotation: number): string {
  const d2 = nx * nx + ny * ny;
  if (d2 > 1) return " ";
  const nz = Math.sqrt(1 - d2);
  const shade = Math.max(0, nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]);
  const lon = Math.atan2(nx, nz) + rotation;
  const lat = Math.asin(-ny);
  const ramp = isLand(lon, lat) ? LAND_RAMP : OCEAN_RAMP;
  const t = Math.min(0.999, 0.15 + shade * 0.85);
  return ramp[Math.floor(t * ramp.length)] ?? " ";
}

export function renderGlobe(cols: number, rows: number, rotation: number): string {
  const ry = rows / 2;
  const rx = ry * 2;
  const lines: string[] = [];
  for (let r = 0; r < rows; r++) {
    let line = "";
    for (let c = 0; c < cols; c++) line += globeChar((c + 0.5 - cols / 2) / rx, (r + 0.5 - rows / 2) / ry, rotation);
    lines.push(line);
  }
  return lines.join("\n");
}

export interface AsciiGlobeProps {
  /** Rows of characters; width is twice that so the sphere stays round. */
  rows?: number;
  /** Radians per second. */
  speed?: number;
  fontSize?: number;
  label?: string;
  className?: string;
}

export function AsciiGlobe({ rows = 22, speed = 0.4, fontSize = 11, label = "Rotating globe", className = "" }: AsciiGlobeProps) {
  const box = useRef<HTMLDivElement>(null);
  const pre = useRef<HTMLPreElement>(null);
  const cols = rows * 2;
  useFrameLoop(box, (t) => {
    if (pre.current) pre.current.textContent = renderGlobe(cols, rows, (t / 1000) * speed);
  });
  return (
    <div ref={box} role="img" aria-label={label} className={`inline-block max-w-full overflow-hidden text-fg ${className}`}>
      <pre ref={pre} aria-hidden className="m-0 select-none font-mono" style={{ fontSize, lineHeight: 1.05 }} />
    </div>
  );
}
