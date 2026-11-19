"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, ChevronDown } from "lucide-react";

/* Select: a single-choice dropdown following the listbox pattern with arrows, Home/End, typeahead, Enter/Space to pick and Escape to close. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

/** Next enabled index in a direction, wrapping; -1 when nothing is enabled. */
export function stepEnabled(options: SelectOption[], from: number, delta: 1 | -1): number {
  const n = options.length;
  for (let i = 1; i <= n; i++) {
    const idx = (((from + delta * i) % n) + n) % n;
    if (!options[idx].disabled) return idx;
  }
  return -1;
}

/** First enabled option after `from` whose label starts with the typed text. */
export function typeaheadIndex(options: SelectOption[], typed: string, from: number): number {
  const q = typed.toLowerCase();
  const n = options.length;
  const startOffset = typed.length > 1 ? 0 : 1;
  for (let i = 0; i < n; i++) {
    const idx = (from + startOffset + i + n) % n;
    if (!options[idx].disabled && options[idx].label.toLowerCase().startsWith(q)) return idx;
  }
  return -1;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  /** Accessible name when there is no visible label. */
  label: string;
  disabled?: boolean;
  className?: string;
}

export function Select({ options, value: controlled, defaultValue, onValueChange, placeholder = "Select an option", label, disabled = false, className = "" }: SelectProps) {
  const id = useId();
  const reduce = useReduce();
  const [inner, setInner] = useState(defaultValue);
  const value = controlled ?? inner;
  const selected = options.findIndex((o) => o.value === value);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const root = useRef<HTMLDivElement>(null);
  const typed = useRef({ text: "", at: 0 });

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const show = (at: number) => {
    setActive(at >= 0 && !options[at]?.disabled ? at : stepEnabled(options, -1, 1));
    setOpen(true);
  };
  const commit = (index: number) => {
    const option = options[index];
    if (!option || option.disabled) return;
    setInner(option.value);
    onValueChange?.(option.value);
    setOpen(false);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const key = e.key;
    if (!open) {
      if (key === "ArrowDown" || key === "ArrowUp" || key === "Enter" || key === " ") {
        e.preventDefault();
        show(selected);
      }
      return;
    }
    if (key === "ArrowDown" || key === "ArrowUp") {
      e.preventDefault();
      setActive(stepEnabled(options, active, key === "ArrowDown" ? 1 : -1));
    } else if (key === "Home" || key === "End") {
      e.preventDefault();
      setActive(key === "Home" ? stepEnabled(options, -1, 1) : stepEnabled(options, 0, -1));
    } else if (key === "Enter" || key === " ") {
      e.preventDefault();
      commit(active);
    } else if (key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (key === "Tab") {
      setOpen(false);
    } else if (key.length === 1 && !e.metaKey && !e.ctrlKey) {
      const now = Date.now();
      typed.current = { text: now - typed.current.at > 600 ? key : typed.current.text + key, at: now };
      const hit = typeaheadIndex(options, typed.current.text, active);
      if (hit >= 0) setActive(hit);
    }
  };

  const shown = selected >= 0 ? options[selected] : undefined;

  return (
    <div ref={root} className={`relative inline-block w-64 ${className}`}>
      <button
        type="button"
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-activedescendant={open && active >= 0 ? `${id}-${active}` : undefined}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : show(selected))}
        onKeyDown={onKeyDown}
        className={`flex h-10 w-full items-center justify-between gap-2 rounded-[12px] bg-surface px-3 text-sm shadow-[var(--shadow-card)] disabled:opacity-50 ${shown ? "text-fg" : "text-fg-subtle"} ${ring}`}
      >
        <span className="truncate">{shown ? shown.label : placeholder}</span>
        <ChevronDown className={`size-4 shrink-0 text-fg-muted transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            id={`${id}-list`}
            role="listbox"
            aria-label={label}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ type: "spring", stiffness: 520, damping: 34 }}
            className="absolute left-0 right-0 top-full z-50 mt-2 max-h-64 overflow-auto rounded-[14px] bg-surface p-1 shadow-[var(--shadow-overlay)] dark:bg-raised"
          >
            {options.map((o, i) => (
              <li
                key={o.value}
                id={`${id}-${i}`}
                role="option"
                aria-selected={i === selected}
                aria-disabled={o.disabled}
                onPointerEnter={() => !o.disabled && setActive(i)}
                onClick={() => commit(i)}
                className={`flex cursor-default items-center justify-between gap-3 rounded-[10px] px-2.5 py-2 text-sm ${o.disabled ? "text-fg-subtle opacity-60" : "text-fg"} ${i === active ? "bg-[color-mix(in_srgb,var(--fg)_6%,var(--surface))]" : ""}`}
              >
                <span className="min-w-0">
                  <span className="block truncate">{o.label}</span>
                  {o.description && <span className="block truncate text-xs text-fg-muted">{o.description}</span>}
                </span>
                {i === selected && <Check className="size-4 shrink-0 text-select-text" aria-hidden />}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
