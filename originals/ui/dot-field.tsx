"use client";

import { useEffect, useRef } from "react";
import { useFrameLoop } from "./ascii-field";

/* Dot field: a canvas grid of dots that shimmer slowly and get pushed away and enlarged by the pointer; it pauses off-screen and draws a still grid under reduced motion. */

export interface DotOffset {
  x: number;
  y: number;
  scale: number;
}

/** Push and growth of a dot at (dx, dy) from the pointer: nothing beyond `radius`, strongest at the center. */
export function dotDisplacement(dx: number, dy: number, radius: number, strength = 14): DotOffset {
  const dist = Math.hypot(dx, dy);
  if (dist >= radius) return { x: 0, y: 0, scale: 1 };
  const falloff = (1 - dist / radius) ** 2;
  const push = dist === 0 ? 0 : (falloff * strength) / dist;
  return { x: dx * push, y: dy * push, scale: 1 + falloff * 1.2 };
}

export interface DotFieldProps {
  /** Distance between dots in px. */
  spacing?: number;
  /** Dot radius in px. */
  dotSize?: number;
  /** Pointer influence radius in px. */
  radius?: number;
  className?: string;
}

export function DotField({ spacing = 22, dotSize = 1.6, radius = 110, className = "" }: DotFieldProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const size = useRef({ width: 0, height: 0, dpr: 1 });
  const pointer = useRef<{ x: number; y: number } | null>(null);

  const redraw = useFrameLoop(canvas, (t) => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    const { width, height, dpr } = size.current;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = getComputedStyle(el).color;
    const p = pointer.current;
    for (let y = spacing / 2; y < height; y += spacing)
      for (let x = spacing / 2; x < width; x += spacing) {
        const shimmer = 0.75 + 0.25 * Math.sin(x * 0.03 + y * 0.02 + t * 0.002);
        const d = p ? dotDisplacement(x - p.x, y - p.y, radius) : { x: 0, y: 0, scale: 1 };
        ctx.globalAlpha = Math.min(1, shimmer * (0.45 + (d.scale - 1) * 0.6));
        ctx.beginPath();
        ctx.arc(x + d.x, y + d.y, dotSize * d.scale, 0, Math.PI * 2);
        ctx.fill();
      }
  });

  useEffect(() => {
    const el = canvas.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const dpr = window.devicePixelRatio || 1;
      const { width, height } = entry.contentRect;
      el.width = Math.round(width * dpr);
      el.height = Math.round(height * dpr);
      size.current = { width, height, dpr };
      redraw();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [redraw]);

  return (
    <canvas
      ref={canvas}
      aria-hidden
      className={`block h-full min-h-32 w-full text-fg-subtle ${className}`}
      onPointerMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        pointer.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        redraw();
      }}
      onPointerLeave={() => {
        pointer.current = null;
        redraw();
      }}
    />
  );
}
