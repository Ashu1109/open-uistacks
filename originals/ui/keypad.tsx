"use client";

import { useState, type KeyboardEvent } from "react";
import { Delete } from "lucide-react";

/* Keypad: a 3 by 4 numeric pad for PINs and codes with a masked readout; it also takes typed digits, Backspace and Enter from a physical keyboard. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export type KeypadKey = string;

/** Applies one key press: a digit appends (up to max), "back" removes, anything else is ignored. */
export function applyKey(value: string, key: KeypadKey, maxLength: number): string {
  if (key === "back") return value.slice(0, -1);
  if (/^\d$/.test(key) && value.length < maxLength) return value + key;
  return value;
}

export function maskValue(value: string, maxLength: number, mask: boolean): string[] {
  return Array.from({ length: maxLength }, (_, i) => (i < value.length ? (mask ? "•" : value[i]) : ""));
}

export interface KeypadProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Called with the code when it is full or Enter is pressed. */
  onSubmit?: (value: string) => void;
  maxLength?: number;
  /** Show dots instead of digits. */
  mask?: boolean;
  label?: string;
  className?: string;
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
const keyClass = `inline-flex h-14 items-center justify-center rounded-[16px] bg-surface text-xl font-medium tabular-nums text-fg shadow-[var(--shadow-card)] transition-transform active:scale-95 hover:bg-[color-mix(in_srgb,var(--fg)_4%,var(--surface))] ${ring}`;

export function Keypad({ value: controlled, defaultValue = "", onValueChange, onSubmit, maxLength = 4, mask = true, label = "Enter code", className = "" }: KeypadProps) {
  const [inner, setInner] = useState(defaultValue);
  const value = controlled ?? inner;

  const press = (key: KeypadKey) => {
    const next = applyKey(value, key, maxLength);
    if (next === value) return;
    setInner(next);
    onValueChange?.(next);
    if (next.length === maxLength && key !== "back") onSubmit?.(next);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Backspace") press("back");
    else if (e.key === "Enter" && value.length > 0) onSubmit?.(value);
    else if (/^\d$/.test(e.key) && !e.metaKey && !e.ctrlKey) press(e.key);
    else return;
    if ((e.target as HTMLElement).tagName !== "BUTTON" || e.key === "Backspace") e.preventDefault();
  };

  return (
    <div role="group" aria-label={label} onKeyDown={onKeyDown} className={`w-64 ${className}`}>
      <div role="status" aria-label={`${value.length} of ${maxLength} digits entered`} className="mb-4 flex justify-center gap-2.5">
        {maskValue(value, maxLength, mask).map((c, i) => (
          <span key={i} className={`flex h-11 w-9 items-center justify-center rounded-[12px] text-lg tabular-nums text-fg ${c ? "bg-select-soft" : "bg-subtle"}`}>{c}</span>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {KEYS.map((k) => (
          <button key={k} type="button" onClick={() => press(k)} className={keyClass}>{k}</button>
        ))}
        <span aria-hidden />
        <button type="button" onClick={() => press("0")} className={keyClass}>0</button>
        <button type="button" aria-label="Delete last digit" disabled={value.length === 0} onClick={() => press("back")} className={`${keyClass} disabled:opacity-40`}>
          <Delete className="size-5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
