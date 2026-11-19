"use client";

import { useEffect, useId, useRef, useSyncExternalStore, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { useControlled } from "./dialog";

/* Display options: a trigger that opens a popover of view settings (segmented choices, switches and selects), shows how many differ from the defaults and offers a reset; Escape and outside clicks close it. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface DisplayChoice {
  value: string;
  label: string;
  icon?: ReactNode;
}

export type DisplayOption =
  | { id: string; label: string; type: "segmented"; choices: DisplayChoice[] }
  | { id: string; label: string; type: "select"; choices: DisplayChoice[] }
  | { id: string; label: string; type: "toggle" };

/** Setting values keyed by option id: a string for segmented and select, a boolean for toggles. */
export type DisplayValue = Record<string, string | boolean>;

/** How many options currently differ from `defaults`. */
export function countChanged(options: DisplayOption[], value: DisplayValue, defaults: DisplayValue): number {
  return options.filter((o) => value[o.id] !== defaults[o.id]).length;
}

export interface DisplayOptionsProps {
  options: DisplayOption[];
  value?: DisplayValue;
  /** Initial values, and what Reset returns to. */
  defaultValue: DisplayValue;
  onValueChange?: (value: DisplayValue) => void;
  label?: string;
  align?: "start" | "end";
  className?: string;
}

function Segmented({ option, value, onPick }: { option: Extract<DisplayOption, { type: "segmented" }>; value: string; onPick: (v: string) => void }) {
  const id = useId();
  const onKeyDown = (e: KeyboardEvent, index: number) => {
    const n = option.choices.length;
    const to = { ArrowRight: index + 1, ArrowDown: index + 1, ArrowLeft: index - 1, ArrowUp: index - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    const next = option.choices[(to + n) % n];
    onPick(next.value);
    document.getElementById(`${id}-${next.value}`)?.focus();
  };
  return (
    <div role="radiogroup" aria-label={option.label} className="flex rounded-[10px] bg-subtle p-0.5">
      {option.choices.map((c, i) => {
        const on = c.value === value;
        return (
          <button
            key={c.value}
            id={`${id}-${c.value}`}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onPick(c.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`flex h-7 flex-1 items-center justify-center gap-1.5 rounded-[8px] px-2.5 text-[13px] font-medium transition-colors ${on ? "bg-surface text-fg shadow-[var(--shadow-btn-secondary)] dark:bg-raised" : "text-fg-muted hover:text-fg"} ${ring}`}
          >
            {c.icon}
            {c.label}
          </button>
        );
      })}
    </div>
  );
}

export function DisplayOptions({ options, value: valueProp, defaultValue, onValueChange, label = "Display", align = "end", className = "" }: DisplayOptionsProps) {
  const id = useId();
  const reduce = useReduce();
  const [open, setOpen] = useControlled<boolean>(undefined, false);
  const [value, setValue] = useControlled(valueProp, defaultValue, onValueChange);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const changed = countChanged(options, value, defaultValue);
  const set = (optionId: string, next: string | boolean) => setValue({ ...value, [optionId]: next });

  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLElement>("button, select")?.focus();
    const outside = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const escape = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const hidden = reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -4 };
  return (
    <div ref={root} className={`relative inline-block ${className}`}>
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={open ? `${id}-panel` : undefined}
        onClick={() => setOpen(!open)}
        className={`inline-flex h-9 items-center gap-2 rounded-full bg-surface px-3.5 text-sm font-medium text-fg shadow-[var(--shadow-btn-secondary)] dark:bg-raised ${ring}`}
      >
        <SlidersHorizontal size={15} strokeWidth={2} aria-hidden className="text-fg-muted" />
        {label}
        {changed > 0 && <span aria-label={`${changed} changed`} className="grid min-w-5 place-items-center rounded-full bg-select px-1 text-[11px] leading-5 text-white">{changed}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panel}
            id={`${id}-panel`}
            role="dialog"
            aria-label={`${label} options`}
            initial={hidden}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={hidden}
            transition={{ type: "spring", stiffness: 520, damping: 34 }}
            style={{ transformOrigin: `top ${align === "end" ? "right" : "left"}` }}
            className={`absolute top-full z-50 mt-2 grid w-72 gap-4 rounded-[16px] bg-surface p-4 shadow-[var(--shadow-overlay)] dark:bg-raised ${align === "end" ? "right-0" : "left-0"}`}
          >
            {options.map((o) => {
              const labelId = `${id}-${o.id}`;
              if (o.type === "toggle") {
                const on = value[o.id] === true;
                return (
                  <div key={o.id} className="flex items-center justify-between gap-3">
                    <span id={labelId} className="text-sm text-fg">{o.label}</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={on}
                      aria-labelledby={labelId}
                      onClick={() => set(o.id, !on)}
                      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${on ? "bg-select" : "bg-track-strong"} ${ring}`}
                    >
                      <span className={`absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow transition-transform ${on ? "translate-x-4" : ""}`} />
                    </button>
                  </div>
                );
              }
              return (
                <div key={o.id} className="grid gap-1.5">
                  <label htmlFor={o.type === "select" ? labelId : undefined} className="text-xs font-medium text-fg-subtle">{o.label}</label>
                  {o.type === "segmented" ? (
                    <Segmented option={o} value={String(value[o.id])} onPick={(v) => set(o.id, v)} />
                  ) : (
                    <select id={labelId} value={String(value[o.id])} onChange={(e) => set(o.id, e.target.value)} className={`h-9 rounded-[10px] bg-subtle px-2.5 text-sm text-fg ${ring}`}>
                      {o.choices.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  )}
                </div>
              );
            })}
            <button type="button" disabled={changed === 0} onClick={() => setValue({ ...defaultValue })} className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-full text-sm text-fg-muted transition-colors hover:text-fg disabled:opacity-40 ${ring}`}>
              <RotateCcw size={13} strokeWidth={2} aria-hidden />
              Reset to default
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
