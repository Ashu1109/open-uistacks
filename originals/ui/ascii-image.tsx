"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { animate, useReducedMotion } from "motion/react";

/* ASCII image: converts an image source into a block of characters by sampling its luminance on a canvas and mapping brightness to a character ramp. */

export const ASCII_RAMP = " .:-=+*#%@";

export interface AsciiOptions {
  ramp?: string;
  /** Dense characters for dark pixels instead of bright ones. */
  invert?: boolean;
}

/** Maps brightness 0..1 to one ramp character. */
export function luminanceChar(luminance: number, ramp = ASCII_RAMP, invert = false): string {
  const l = Math.min(Math.max(luminance, 0), 1);
  const t = invert ? 1 - l : l;
  return ramp[Math.min(ramp.length - 1, Math.floor(t * ramp.length))] ?? " ";
}

/** Converts RGBA pixels (as from getImageData) to text lines; alpha pulls transparent pixels toward black. */
export function pixelsToAscii(rgba: ArrayLike<number>, width: number, height: number, { ramp = ASCII_RAMP, invert = false }: AsciiOptions = {}): string[] {
  const lines: string[] = [];
  for (let y = 0; y < height; y++) {
    let line = "";
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const luma = (0.2126 * (rgba[i] ?? 0) + 0.7152 * (rgba[i + 1] ?? 0) + 0.0722 * (rgba[i + 2] ?? 0)) / 255;
      line += luminanceChar(luma * ((rgba[i + 3] ?? 255) / 255), ramp, invert);
    }
    lines.push(line);
  }
  return lines;
}

/** Characters are about twice as tall as wide, so rows are halved. */
export function asciiRows(cols: number, imageWidth: number, imageHeight: number): number {
  return imageWidth > 0 ? Math.max(1, Math.round((cols * imageHeight) / imageWidth / 2)) : 1;
}

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const NOISE = "01#%&*+=-:.";
const TRAIL = 3;

/** Lines at reveal `progress` 0..1: rows above the sweep are final, the few under it are noise, the rest blank. */
export function revealLines(lines: string[], progress: number, seed = 0): string[] {
  if (progress >= 1) return lines;
  const edge = progress * (lines.length + TRAIL);
  return lines.map((line, r) => {
    if (r + TRAIL <= edge) return line;
    if (r > edge) return line.replace(/[^\n]/g, " ");
    return line.replace(/\S/g, (_, i: number) => NOISE[Math.abs(Math.floor(Math.sin((i + 1) * 12.9898 + (r + 1) * 78.233 + seed) * 43758.5453)) % NOISE.length] ?? " ");
  });
}

/** Lines that resolve from noise into `lines` on mount and whenever `lines` change; `replay` plays a faster pass. Final immediately under reduced motion. */
export function useReveal(lines: string[]): { shown: string[]; replay: () => void } {
  const reduce = useReduce();
  const [progress, setProgress] = useState(1);
  const seed = useRef(0);
  const stop = useRef<{ stop: () => void } | null>(null);
  const run = useCallback((duration: number) => {
    stop.current?.stop();
    seed.current += 1;
    stop.current = animate(0, 1, { duration, ease: "easeOut", onUpdate: setProgress });
  }, []);
  useLayoutEffect(() => {
    if (reduce || lines.length === 0) return;
    setProgress(0);
    run(0.6);
    return () => stop.current?.stop();
  }, [lines, reduce, run]);
  const replay = useCallback(() => !reduce && run(0.4), [reduce, run]);
  return { shown: revealLines(lines, progress, seed.current), replay };
}

export interface AsciiImageProps extends AsciiOptions {
  src: string;
  alt: string;
  /** Characters per row. */
  cols?: number;
  /** Font size in px. */
  fontSize?: number;
  className?: string;
}

const EMPTY: string[] = [];

type State = { status: "loading" } | { status: "error" } | { status: "ready"; lines: string[] };

export function AsciiImage({ src, alt, cols = 80, ramp, invert, fontSize = 8, className = "" }: AsciiImageProps) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (cancelled) return;
      const rows = asciiRows(cols, img.naturalWidth, img.naturalHeight);
      const canvas = document.createElement("canvas");
      canvas.width = cols;
      canvas.height = rows;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return setState({ status: "error" });
      try {
        ctx.drawImage(img, 0, 0, cols, rows);
        setState({ status: "ready", lines: pixelsToAscii(ctx.getImageData(0, 0, cols, rows).data, cols, rows, { ramp, invert }) });
      } catch {
        setState({ status: "error" });
      }
    };
    img.onerror = () => !cancelled && setState({ status: "error" });
    img.src = src;
    return () => {
      cancelled = true;
      img.onload = null;
      img.onerror = null;
    };
  }, [src, cols, ramp, invert]);

  const { shown, replay } = useReveal(state.status === "ready" ? state.lines : EMPTY);
  if (state.status === "error") return <p role="img" aria-label={alt} className={`text-sm text-fg-muted ${className}`}>Image unavailable</p>;
  return (
    <pre role="img" aria-label={alt} onPointerEnter={replay} aria-busy={state.status === "loading"} className={`m-0 overflow-hidden whitespace-pre font-mono text-fg ${className}`} style={{ fontSize, lineHeight: 1 }}>
      {shown.join("\n")}
    </pre>
  );
}
