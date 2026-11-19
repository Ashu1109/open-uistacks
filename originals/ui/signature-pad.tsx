"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type PointerEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Eraser, Undo2 } from "lucide-react";

/* Signature pad: a canvas you sign on with a pointer, finger or pen; undo and clear buttons, and the result is exported as a PNG data URL through onChange. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const spring = { type: "spring", stiffness: 480, damping: 34 } as const;

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface Point {
  x: number;
  y: number;
}
export type Stroke = Point[];

export function strokeLength(stroke: Stroke): number {
  return stroke.reduce((sum, p, i) => (i === 0 ? 0 : sum + Math.hypot(p.x - stroke[i - 1].x, p.y - stroke[i - 1].y)), 0);
}

export function hasInk(strokes: Stroke[]): boolean {
  return strokes.some((s) => s.length > 1 && strokeLength(s) > 1);
}

function drawStrokes(canvas: HTMLCanvasElement | null, strokes: Stroke[], color: string | undefined, width: number) {
  const ctx = canvas?.getContext?.("2d");
  if (!canvas || !ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = color ?? (getComputedStyle(canvas).color || "#18181b");
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const s of strokes) {
    if (s.length === 0) continue;
    ctx.beginPath();
    ctx.moveTo(s[0].x, s[0].y);
    for (const p of s.slice(1)) ctx.lineTo(p.x, p.y);
    if (s.length === 1) ctx.lineTo(s[0].x + 0.01, s[0].y);
    ctx.stroke();
  }
}

function exportPng(canvas: HTMLCanvasElement | null): string | null {
  try {
    return canvas?.toDataURL("image/png") ?? null;
  } catch {
    return null;
  }
}

export interface SignaturePadProps {
  /** Called after each stroke with the PNG data URL, or null when empty. */
  onChange?: (dataUrl: string | null) => void;
  width?: number;
  height?: number;
  /** Ink colour; defaults to the current text colour. */
  color?: string;
  className?: string;
}

export function SignaturePad({ onChange, width = 400, height = 160, color, className = "" }: SignaturePadProps) {
  const reduce = useReduce();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const latest = useRef<Stroke[]>([]);
  const drawing = useRef(false);
  const signed = hasInk(strokes);

  const redraw = useCallback((next: Stroke[]) => drawStrokes(canvas.current, next, color, 2.2), [color]);
  const commit = (next: Stroke[]) => {
    latest.current = next;
    setStrokes(next);
    redraw(next);
  };
  useEffect(() => redraw(latest.current), [redraw]);

  const pointAt = (e: PointerEvent<HTMLCanvasElement>): Point => {
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = rect.width ? width / rect.width : 1;
    const sy = rect.height ? height / rect.height : 1;
    return { x: ((e.clientX ?? 0) - rect.left) * sx, y: ((e.clientY ?? 0) - rect.top) * sy };
  };

  const finish = (next: Stroke[]) => onChange?.(hasInk(next) ? exportPng(canvas.current) : null);

  const onDown = (e: PointerEvent<HTMLCanvasElement>) => {
    drawing.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    commit([...latest.current, [pointAt(e)]]);
  };
  const onMove = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const all = latest.current;
    commit([...all.slice(0, -1), [...all[all.length - 1], pointAt(e)]]);
  };
  const onUp = () => {
    if (!drawing.current) return;
    drawing.current = false;
    finish(latest.current);
  };

  const update = (next: Stroke[]) => {
    commit(next);
    finish(next);
  };

  return (
    <motion.div initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={spring} className={`w-[400px] max-w-full ${className}`}>
      <div className="relative overflow-hidden rounded-[16px] bg-surface shadow-[var(--shadow-card)]">
        <canvas
          ref={canvas}
          role="img"
          aria-label={signed ? "Signature drawn" : "Signature area, draw with a pointer"}
          width={width}
          height={height}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          style={{ touchAction: "none", aspectRatio: `${width} / ${height}` }}
          className="block w-full cursor-crosshair"
        />
        <AnimatePresence>{!signed && <motion.span aria-hidden initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="pointer-events-none absolute inset-x-6 bottom-8 border-b border-dashed border-track-strong pb-1 text-xs text-fg-subtle">Sign above the line</motion.span>}</AnimatePresence>
      </div>
      <div className="mt-2 flex justify-end gap-1.5">
        <motion.button type="button" whileTap={reduce ? undefined : { scale: 0.95 }} disabled={strokes.length === 0} onClick={() => update(strokes.slice(0, -1))} className={`inline-flex h-8 items-center gap-1.5 rounded-full bg-subtle px-3 text-xs text-fg-muted transition-colors duration-150 hover:bg-track disabled:opacity-40 ${ring}`}>
          <Undo2 className="size-3.5" aria-hidden />Undo
        </motion.button>
        <motion.button type="button" whileTap={reduce ? undefined : { scale: 0.95 }} disabled={strokes.length === 0} onClick={() => update([])} className={`inline-flex h-8 items-center gap-1.5 rounded-full bg-subtle px-3 text-xs text-fg-muted transition-colors duration-150 hover:bg-track disabled:opacity-40 ${ring}`}>
          <Eraser className="size-3.5" aria-hidden />Clear
        </motion.button>
      </div>
    </motion.div>
  );
}
