"use client";

import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { useReducedMotion } from "motion/react";
import { orthographic, worldDots } from "./chart-utils";

/* Dot globe: a slowly rotating sphere of dots on an invented coarse land mask, drawn on canvas with an orthographic projection; drag to spin, markers glow on the near side, reduced motion draws it once. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

export interface GlobeMarker {
  label: string;
  lat: number;
  lon: number;
}

export interface DotGlobeProps {
  size?: number;
  markers?: GlobeMarker[];
  /** Degrees of rotation per second. */
  speed?: number;
  /** Longitude facing the viewer at the start. */
  initialLongitude?: number;
  label?: string;
  className?: string;
}

export function DotGlobe({ size = 320, markers = [], speed = 10, initialLongitude = 20, label, className = "" }: DotGlobeProps) {
  const reduce = useReduce();
  const ref = useRef<HTMLCanvasElement>(null);
  const rotation = useRef(initialLongitude);
  const drag = useRef<number | null>(null);
  const redraw = useRef<(() => void) | null>(null);
  const dots = useMemo(() => worldDots(4), []);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = typeof canvas?.getContext === "function" ? canvas.getContext("2d") : null;
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const r = size / 2 - 6;
    const c = size / 2;
    const draw = () => {
      const style = getComputedStyle(canvas);
      const ink = style.getPropertyValue("--fg-subtle").trim() || "#888";
      const accent = style.getPropertyValue("--select").trim() || "#1e6af1";
      const edge = style.getPropertyValue("--track-strong").trim() || "#ccc";
      ctx.clearRect(0, 0, size, size);
      ctx.beginPath();
      ctx.arc(c, c, r, 0, Math.PI * 2);
      ctx.strokeStyle = edge;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = ink;
      for (const d of dots) {
        const p = orthographic(d.lat, d.lon, rotation.current);
        if (p.z <= 0) continue;
        ctx.globalAlpha = 0.18 + 0.7 * p.z;
        ctx.beginPath();
        ctx.arc(c + p.x * r, c - p.y * r, 0.9 + 0.8 * p.z, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = accent;
      ctx.strokeStyle = accent;
      for (const m of markers) {
        const p = orthographic(m.lat, m.lon, rotation.current);
        if (p.z <= 0.05) continue;
        ctx.globalAlpha = 0.25 * p.z;
        ctx.beginPath();
        ctx.arc(c + p.x * r, c - p.y * r, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(c + p.x * r, c - p.y * r, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
    redraw.current = draw;
    draw();
    if (reduce) return;
    let raf = 0;
    let last = performance.now();
    const tick = (t: number) => {
      if (drag.current === null) rotation.current += (speed * (t - last)) / 1000;
      last = t;
      draw();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [size, markers, speed, reduce, dots]);

  const summary = label ?? `Rotating dotted globe${markers.length ? ` with ${markers.length} marked locations: ${markers.map((m) => m.label).join(", ")}` : ""}.`;

  return (
    <div className={`inline-block ${className}`}>
      <canvas
        ref={ref}
        role="img"
        aria-label={summary}
        width={size}
        height={size}
        style={{ width: size, height: size, maxWidth: "100%", touchAction: "pan-y" }}
        className="cursor-grab rounded-full active:cursor-grabbing"
        onPointerDown={(e) => {
          drag.current = e.clientX;
          e.currentTarget.setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (drag.current === null) return;
          rotation.current -= (e.clientX - drag.current) * 0.4;
          drag.current = e.clientX;
          if (reduce) redraw.current?.();
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
      />
      {markers.length > 0 && <ul className="sr-only">{markers.map((m) => <li key={m.label}>{m.label}</li>)}</ul>}
    </div>
  );
}
