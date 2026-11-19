"use client";

import { useState, useSyncExternalStore, type KeyboardEvent, type PointerEvent } from "react";
import { motion, useReducedMotion } from "motion/react";

/* Color picker: a saturation and brightness area, a hue slider and a hex field that stay in sync; the area is an ARIA slider you can drive with arrows (Shift for bigger steps). */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const spring = { type: "spring", stiffness: 480, damping: 34 } as const;

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface Hsv {
  /** 0 to 360. */
  h: number;
  /** 0 to 100. */
  s: number;
  /** 0 to 100. */
  v: number;
}

/** "#abc", "abc" or "#aabbcc" to "#aabbcc"; null when it is not a hex colour. */
export function normalizeHex(input: string): string | null {
  const t = input.trim().replace(/^#/, "").toLowerCase();
  if (/^[0-9a-f]{3}$/.test(t)) return `#${t.split("").map((c) => c + c).join("")}`;
  return /^[0-9a-f]{6}$/.test(t) ? `#${t}` : null;
}

export function hexToHsv(hex: string): Hsv {
  const n = normalizeHex(hex) ?? "#000000";
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(n.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
  }
  return { h: Math.round(((h * 60) + 360) % 360), s: Math.round(max === 0 ? 0 : (d / max) * 100), v: Math.round(max * 100) };
}

export function hsvToHex({ h, s, v }: Hsv): string {
  const sat = s / 100;
  const val = v / 100;
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return val - val * sat * Math.max(Math.min(k, 4 - k, 1), 0);
  };
  return `#${[f(5), f(3), f(1)].map((c) => Math.round(c * 255).toString(16).padStart(2, "0")).join("")}`;
}

export interface ColorPickerProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (hex: string) => void;
  /** Quick-pick colours under the controls. */
  presets?: string[];
  label?: string;
  className?: string;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);

export function ColorPicker({ value: controlled, defaultValue = "#1e6af1", onValueChange, presets, label = "Color", className = "" }: ColorPickerProps) {
  const reduce = useReduce();
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(controlled ?? defaultValue));
  const controlledHex = controlled ? normalizeHex(controlled) : null;
  const current = controlledHex && controlledHex !== hsvToHex(hsv) ? hexToHsv(controlledHex) : hsv;
  const hex = hsvToHex(current);
  const [draft, setDraft] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const update = (next: Hsv) => {
    setHsv(next);
    onValueChange?.(hsvToHex(next));
  };

  const fromPointer = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    update({ ...current, s: Math.round(clamp((e.clientX - rect.left) / rect.width, 0, 1) * 100), v: Math.round((1 - clamp((e.clientY - rect.top) / rect.height, 0, 1)) * 100) });
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 1;
    const delta: Record<string, [number, number]> = { ArrowRight: [step, 0], ArrowLeft: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    if (!(e.key in delta)) return;
    e.preventDefault();
    const [ds, dv] = delta[e.key];
    update({ ...current, s: clamp(current.s + ds, 0, 100), v: clamp(current.v + dv, 0, 100) });
  };

  const commitDraft = () => {
    const parsed = draft === null ? null : normalizeHex(draft);
    if (parsed) update(hexToHsv(parsed));
    setDraft(null);
  };

  return (
    <div role="group" aria-label={label} className={`w-64 rounded-[18px] bg-surface p-3 shadow-[var(--shadow-card)] ${className}`}>
      <div
        role="slider"
        tabIndex={0}
        aria-label="Saturation and brightness"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={current.s}
        aria-valuetext={`Saturation ${current.s}%, brightness ${current.v}%`}
        onKeyDown={onKeyDown}
        onPointerDown={(e) => {
          setDragging(true);
          e.currentTarget.setPointerCapture?.(e.pointerId);
          fromPointer(e);
        }}
        onPointerMove={(e) => dragging && fromPointer(e)}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        className={`relative h-36 w-full cursor-crosshair touch-none rounded-[12px] ${ring}`}
        style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${current.h} 100% 50%))` }}
      >
        <motion.span aria-hidden className="absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgb(0_0_0/0.3)]" initial={false} animate={{ left: `${current.s}%`, top: `${100 - current.v}%`, backgroundColor: hex, scale: dragging && !reduce ? 1.3 : 1 }} transition={reduce || dragging ? { duration: 0 } : spring} />
      </div>
      <input
        type="range"
        min={0}
        max={360}
        aria-label="Hue"
        value={current.h}
        onChange={(e) => update({ ...current, h: Number(e.target.value) })}
        className={`mt-3 h-3 w-full cursor-pointer appearance-none rounded-full [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-transparent [&::-webkit-slider-thumb]:shadow-[0_0_0_1px_rgb(0_0_0/0.3)] ${ring}`}
        style={{ background: "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)" }}
      />
      <div className="mt-3 flex items-center gap-2">
        <motion.span aria-hidden className="size-8 shrink-0 rounded-[10px] shadow-[inset_0_0_0_1px_rgb(0_0_0/0.12)]" initial={false} animate={{ backgroundColor: hex }} transition={{ duration: reduce ? 0 : 0.15 }} />
        <input
          aria-label="Hex color"
          spellCheck={false}
          value={draft ?? hex}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitDraft}
          onKeyDown={(e) => e.key === "Enter" && commitDraft()}
          aria-invalid={draft !== null && normalizeHex(draft) === null}
          className={`h-8 min-w-0 flex-1 rounded-[10px] bg-subtle px-2.5 font-mono text-sm uppercase text-fg ${ring}`}
        />
      </div>
      {presets && presets.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {presets.map((p, i) => (
            <motion.button key={p} type="button" aria-label={`Use ${p}`} onClick={() => update(hexToHsv(p))} initial={reduce ? false : { opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ ...spring, delay: i * 0.03 }} whileHover={reduce ? undefined : { scale: 1.15 }} whileTap={reduce ? undefined : { scale: 0.9 }} className={`size-6 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.12)] ${ring}`} style={{ background: p }} />
          ))}
        </div>
      )}
    </div>
  );
}
