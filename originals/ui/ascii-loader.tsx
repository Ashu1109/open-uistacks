"use client";

import { useRef } from "react";
import { useFrameLoop } from "./ascii-field";

/* ASCII loader: a text-mode spinner, bouncing bar or wave for waiting states; it announces its label as a status and holds one frame under reduced motion. */

export type LoaderVariant = "spinner" | "bar" | "wave" | "dots";

const SPINNER = ["|", "/", "-", "\\"];
const WAVE = "▁▂▃▄▅▆▇█▇▆▅▄▃▂";
const BRAILLE = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

/** The text of animation step `tick` for a variant, `width` characters wide where it has a width. */
export function loaderFrame(variant: LoaderVariant, tick: number, width = 12): string {
  const t = Math.max(0, Math.floor(tick));
  if (variant === "spinner") return SPINNER[t % SPINNER.length] ?? "|";
  if (variant === "dots") return BRAILLE[t % BRAILLE.length] ?? "";
  if (variant === "wave") return Array.from({ length: width }, (_, i) => WAVE[(t + i) % WAVE.length]).join("");
  const span = Math.max(width - 3, 1);
  const cycle = span * 2;
  const pos = t % cycle;
  const head = pos <= span ? pos : cycle - pos;
  return `[${" ".repeat(head)}===${" ".repeat(span - head)}]`;
}

export interface AsciiLoaderProps {
  variant?: LoaderVariant;
  /** Accessible status text, also shown beside the animation when `showLabel`. */
  label?: string;
  showLabel?: boolean;
  width?: number;
  /** Milliseconds per step. */
  interval?: number;
  className?: string;
}

export function AsciiLoader({ variant = "spinner", label = "Loading", showLabel = false, width = 12, interval = 90, className = "" }: AsciiLoaderProps) {
  const box = useRef<HTMLSpanElement>(null);
  const text = useRef<HTMLSpanElement>(null);
  useFrameLoop(box, (t) => {
    if (text.current) text.current.textContent = loaderFrame(variant, t / interval, width);
  });
  return (
    <span ref={box} role="status" aria-label={label} className={`inline-flex items-center gap-2 font-mono text-sm text-fg ${className}`}>
      <span ref={text} aria-hidden className="whitespace-pre" />
      {showLabel && <span className="font-sans text-fg-muted">{label}</span>}
    </span>
  );
}
