"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import { useReducedMotion } from "motion/react";

/* ASCII field: a grid of characters that ripples like a slow wave and swells around the pointer; it pauses off-screen and renders a still frame under reduced motion. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

/** Runs `draw(timeMs)` every frame while `ref` is on screen; draws one still frame under reduced motion. Returns a manual redraw. */
export function useFrameLoop(ref: RefObject<Element | null>, draw: (time: number) => void): () => void {
  const reduce = useReduce();
  const latest = useRef(draw);
  useEffect(() => {
    latest.current = draw;
    if (reduce) draw(0);
  });
  useEffect(() => {
    latest.current(0);
    if (reduce || typeof requestAnimationFrame === "undefined") return;
    let raf = 0;
    const loop = (t: number) => {
      latest.current(t);
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const el = ref.current;
    let observer: IntersectionObserver | undefined;
    if (el && typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(([entry]) => (entry?.isIntersecting ? start() : stop()));
      observer.observe(el);
    } else start();
    return () => {
      stop();
      observer?.disconnect();
    };
  }, [reduce, ref]);
  return useCallback(() => latest.current(typeof performance === "undefined" ? 0 : performance.now()), []);
}

export const FIELD_RAMP = " .:-=+*#%@";

export interface FieldPointer {
  x: number;
  y: number;
}

/** Brightness 0..1 at normalized (nx, ny) and time `t` ms; the pointer adds a soft bump. */
export function fieldValue(nx: number, ny: number, t: number, pointer?: FieldPointer | null, aspect = 1): number {
  let v = 0.4 + 0.2 * Math.sin(nx * 7 + t * 0.0013) + 0.2 * Math.sin(ny * 6 - t * 0.001 + nx * 2.5);
  if (pointer) {
    const dx = (nx - pointer.x) * aspect;
    const dy = ny - pointer.y;
    v += 0.7 * Math.exp(-(dx * dx + dy * dy) / 0.02);
  }
  return Math.min(Math.max(v, 0), 1);
}

export function fieldFrame(cols: number, rows: number, t: number, pointer?: FieldPointer | null, ramp = FIELD_RAMP): string {
  const aspect = cols / (rows * 2);
  const lines: string[] = [];
  for (let r = 0; r < rows; r++) {
    let line = "";
    for (let c = 0; c < cols; c++) {
      const v = fieldValue((c + 0.5) / cols, (r + 0.5) / rows, t, pointer, aspect);
      line += ramp[Math.min(ramp.length - 1, Math.floor(v * ramp.length))];
    }
    lines.push(line);
  }
  return lines.join("\n");
}

export interface AsciiFieldProps {
  /** Fixed columns; measured from the container width when omitted. */
  cols?: number;
  rows?: number;
  /** Font size in px. */
  fontSize?: number;
  ramp?: string;
  className?: string;
}

export function AsciiField({ cols, rows, fontSize = 12, ramp = FIELD_RAMP, className = "" }: AsciiFieldProps) {
  const box = useRef<HTMLDivElement>(null);
  const pre = useRef<HTMLPreElement>(null);
  const pointer = useRef<FieldPointer | null>(null);
  const [size, setSize] = useState({ cols: cols ?? 64, rows: rows ?? 18 });
  const grid = { cols: cols ?? size.cols, rows: rows ?? size.rows };

  useEffect(() => {
    const el = box.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setSize({ cols: Math.max(8, Math.floor(width / (fontSize * 0.6))), rows: Math.max(4, Math.floor(height / (fontSize * 1.2))) });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [fontSize]);

  const redraw = useFrameLoop(box, (t) => {
    if (pre.current) pre.current.textContent = fieldFrame(grid.cols, grid.rows, t, pointer.current, ramp);
  });

  return (
    <div
      ref={box}
      aria-hidden
      className={`relative min-h-32 w-full overflow-hidden text-fg-subtle ${className}`}
      onPointerMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        pointer.current = rect.width > 0 && rect.height > 0 ? { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height } : null;
        redraw();
      }}
      onPointerLeave={() => {
        pointer.current = null;
        redraw();
      }}
    >
      <pre ref={pre} className="absolute inset-0 m-0 select-none overflow-hidden font-mono" style={{ fontSize, lineHeight: `${fontSize * 1.2}px` }} />
    </div>
  );
}
