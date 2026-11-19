"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { Check } from "lucide-react";

/* Color swatch: a palette of round colour chips as a radio group; the chosen one shows a check that stays readable on light and dark colours, and arrows move through the set. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface Swatch {
  /** Any CSS colour, normally hex. */
  value: string;
  label: string;
}

/** Whether a hex colour is light enough to need a dark check mark. */
export function isLightColor(hex: string): boolean {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  if (!/^[0-9a-f]{6}$/i.test(full)) return false;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4;
}

const SIZE = { sm: "size-6", md: "size-8", lg: "size-10" } as const;

export interface ColorSwatchProps {
  swatches: Swatch[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  size?: keyof typeof SIZE;
  label?: string;
  className?: string;
}

export function ColorSwatch({ swatches, value: controlled, defaultValue, onValueChange, size = "md", label = "Color", className = "" }: ColorSwatchProps) {
  const [inner, setInner] = useState(defaultValue);
  const value = controlled ?? inner;
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const selected = swatches.findIndex((s) => s.value === value);

  const choose = (index: number) => {
    const i = (index + swatches.length) % swatches.length;
    setInner(swatches[i].value);
    onValueChange?.(swatches[i].value);
    refs.current[i]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const at = Math.max(selected, 0);
    if (e.key === "ArrowRight" || e.key === "ArrowDown") choose(at + 1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") choose(at - 1);
    else if (e.key === "Home") choose(0);
    else if (e.key === "End") choose(swatches.length - 1);
    else return;
    e.preventDefault();
  };

  return (
    <div role="radiogroup" aria-label={label} onKeyDown={onKeyDown} className={`flex flex-wrap gap-2 ${className}`}>
      {swatches.map((s, i) => {
        const on = i === selected;
        return (
          <button
            key={s.value}
            ref={(n) => {
              refs.current[i] = n;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={s.label}
            title={s.label}
            tabIndex={on || (selected < 0 && i === 0) ? 0 : -1}
            onClick={() => choose(i)}
            className={`inline-flex ${SIZE[size]} items-center justify-center rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.12)] transition-transform hover:scale-110 ${on ? "ring-2 ring-[var(--fg)] ring-offset-2 ring-offset-[var(--bg)]" : ""} ${ring}`}
            style={{ background: s.value }}
          >
            {on && <Check className={`size-4 ${isLightColor(s.value) ? "text-black" : "text-white"}`} aria-hidden />}
          </button>
        );
      })}
    </div>
  );
}
