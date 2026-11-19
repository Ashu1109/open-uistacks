"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { RotateCcw, ZoomIn } from "lucide-react";

/* Image cropper: drag (or use arrow keys) to position an image inside a fixed crop frame, set zoom with a slider, and receive the crop rectangle in source-image pixels; the math lives in exported pure helpers. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface Size {
  width: number;
  height: number;
}
export interface Point {
  x: number;
  y: number;
}
export interface CropRect extends Point, Size {}

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

/** The scale at which the image just covers the frame. */
export function coverScale(image: Size, frame: Size): number {
  return Math.max(frame.width / image.width, frame.height / image.height);
}

/** Limits the image's top-left `offset` (relative to the frame) so the frame never shows empty space. */
export function clampOffset(offset: Point, shown: Size, frame: Size): Point {
  return { x: clamp(offset.x, Math.min(frame.width - shown.width, 0), 0), y: clamp(offset.y, Math.min(frame.height - shown.height, 0), 0) };
}

/** The offset that centres the image in the frame. */
export function centeredOffset(shown: Size, frame: Size): Point {
  return { x: (frame.width - shown.width) / 2, y: (frame.height - shown.height) / 2 };
}

/** The offset after zooming from `from` to `to` scale, keeping the frame's centre point fixed. */
export function zoomOffset(offset: Point, from: number, to: number, frame: Size): Point {
  const ratio = to / from;
  return { x: frame.width / 2 - (frame.width / 2 - offset.x) * ratio, y: frame.height / 2 - (frame.height / 2 - offset.y) * ratio };
}

/** The visible region in source-image pixels, for an image shown at `coverScale * zoom` with its top-left at `offset`. */
export function cropRect(image: Size, frame: Size, zoom: number, offset: Point): CropRect {
  const scale = coverScale(image, frame) * zoom;
  const x = clamp(Math.round(-offset.x / scale), 0, image.width - 1);
  const y = clamp(Math.round(-offset.y / scale), 0, image.height - 1);
  return {
    x,
    y,
    width: Math.min(Math.round(frame.width / scale), image.width - x),
    height: Math.min(Math.round(frame.height / scale), image.height - y),
  };
}

export interface ImageCropperProps {
  src: string;
  alt?: string;
  /** Crop frame width divided by height. */
  aspect?: number;
  /** Frame width in CSS pixels. */
  width?: number;
  minZoom?: number;
  maxZoom?: number;
  /** Source image size; read from the loaded image when omitted. */
  naturalSize?: Size;
  /** Mask the frame to a circle (the rect is still what is reported). */
  round?: boolean;
  onCropChange?: (crop: CropRect) => void;
  className?: string;
}

const STEP = 10;

export function ImageCropper({ src, alt = "Image to crop", aspect = 1, width = 320, minZoom = 1, maxZoom = 3, naturalSize, round = false, onCropChange, className = "" }: ImageCropperProps) {
  const id = useId();
  const [loaded, setLoaded] = useState<Size | null>(null);
  const [zoom, setZoom] = useState(minZoom);
  const [moved, setMoved] = useState<Point | null>(null);
  const drag = useRef<{ pointer: Point; origin: Point } | null>(null);
  const report = useRef(onCropChange);
  report.current = onCropChange;

  const image = naturalSize ?? loaded;
  const frame: Size = { width, height: Math.round(width / aspect) };
  const scale = image ? coverScale(image, frame) * zoom : 1;
  const shown: Size = image ? { width: image.width * scale, height: image.height * scale } : frame;
  const offset = clampOffset(moved ?? centeredOffset(shown, frame), shown, frame);
  const crop = image ? cropRect(image, frame, zoom, offset) : null;

  useEffect(() => {
    if (crop) report.current?.(crop);
  }, [crop?.x, crop?.y, crop?.width, crop?.height]); // eslint-disable-line react-hooks/exhaustive-deps

  const changeZoom = (next: number) => {
    const to = clamp(next, minZoom, maxZoom);
    if (!image) return setZoom(to);
    const nextShown = { width: image.width * coverScale(image, frame) * to, height: image.height * coverScale(image, frame) * to };
    setMoved(clampOffset(zoomOffset(offset, scale, coverScale(image, frame) * to, frame), nextShown, frame));
    setZoom(to);
  };

  const nudge = (dx: number, dy: number) => setMoved(clampOffset({ x: offset.x + dx, y: offset.y + dy }, shown, frame));

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drag.current = { pointer: { x: e.clientX, y: e.clientY }, origin: offset };
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (d) setMoved(clampOffset({ x: d.origin.x + e.clientX - d.pointer.x, y: d.origin.y + e.clientY - d.pointer.y }, shown, frame));
  };
  const onKeyDown = (e: KeyboardEvent) => {
    const step = e.shiftKey ? STEP * 4 : STEP;
    const moves: Record<string, [number, number]> = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    nudge(move[0], move[1]);
  };
  const reset = () => {
    setMoved(null);
    setZoom(minZoom);
  };

  return (
    <div className={`inline-grid gap-3 ${className}`} style={{ width }}>
      <div
        role="group"
        tabIndex={0}
        aria-label="Crop area"
        aria-describedby={`${id}-hint`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
        onKeyDown={onKeyDown}
        style={{ width: frame.width, height: frame.height }}
        className={`relative cursor-grab touch-none select-none overflow-hidden bg-subtle shadow-[var(--shadow-card)] active:cursor-grabbing ${round ? "rounded-full" : "rounded-[16px]"} ${ring}`}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          onLoad={(e) => setLoaded({ width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight })}
          style={{ width: shown.width, height: shown.height, transform: `translate(${offset.x}px, ${offset.y}px)` }}
          className="pointer-events-none absolute left-0 top-0 max-w-none"
        />
        {!round && (
          <div aria-hidden className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-60">
            {Array.from({ length: 9 }, (_, i) => <span key={i} className="border border-white/40" />)}
          </div>
        )}
      </div>
      <p id={`${id}-hint`} className="text-xs text-fg-subtle">Drag the image or use the arrow keys to reposition it.</p>
      <div className="flex items-center gap-3">
        <ZoomIn size={16} strokeWidth={2} aria-hidden className="shrink-0 text-fg-muted" />
        <input
          type="range"
          aria-label="Zoom"
          min={minZoom}
          max={maxZoom}
          step={0.01}
          value={zoom}
          onChange={(e) => changeZoom(Number(e.target.value))}
          className="h-1.5 min-w-0 flex-1 cursor-pointer accent-[var(--select)]"
        />
        <button type="button" aria-label="Reset crop" onClick={reset} className={`grid size-8 place-items-center rounded-full text-fg-muted transition-colors hover:bg-subtle hover:text-fg ${ring}`}>
          <RotateCcw size={15} strokeWidth={2} aria-hidden />
        </button>
      </div>
      {crop && <p className="text-xs tabular-nums text-fg-muted">{crop.width} × {crop.height} px at ({crop.x}, {crop.y})</p>}
    </div>
  );
}
