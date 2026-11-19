"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, ChevronDown } from "lucide-react";

/* Model picker: a pill button that opens a listbox of models with descriptions and badges; arrow keys, Home, End, Enter and Escape work as in a native select. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";
const hoverTint = "bg-[color-mix(in_srgb,var(--fg)_6%,transparent)]";

export interface ModelOption {
  id: string;
  name: string;
  description?: string;
  /** Short tag beside the name, such as "New". */
  badge?: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface ModelPickerProps {
  models: ModelOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (id: string) => void;
  /** Preferred side for the menu; it flips when the viewport lacks room there. A composer at the bottom of the screen wants "top". */
  placement?: "top" | "bottom";
  align?: "start" | "end";
  /** Names the button and the list for screen readers. */
  label?: string;
  className?: string;
}

/** The next enabled index after `from` in direction `dir`, wrapping around; -1 when every option is disabled. */
export function stepIndex(models: ModelOption[], from: number, dir: 1 | -1): number {
  const n = models.length;
  for (let i = 1; i <= n; i++) {
    const at = (((from + dir * i) % n) + n) % n;
    if (!models[at].disabled) return at;
  }
  return -1;
}

const MENU_ROOM = 336;

/** The preferred side, unless it lacks room for the menu and the other side has more. */
export function pickSide(preferred: "top" | "bottom", above: number, below: number, needed = MENU_ROOM): "top" | "bottom" {
  const room = preferred === "top" ? above : below;
  const other = preferred === "top" ? below : above;
  if (room >= needed || room >= other) return preferred;
  return preferred === "top" ? "bottom" : "top";
}

export function ModelPicker({
  models,
  value: valueProp,
  defaultValue,
  onValueChange,
  placement = "bottom",
  align = "start",
  label = "Model",
  className = "",
}: ModelPickerProps) {
  const id = useId();
  const reduce = useReduce();
  const [inner, setInner] = useState(defaultValue ?? models[0]?.id);
  const value = valueProp ?? inner;
  const selectedIndex = models.findIndex((m) => m.id === value);
  const selected = models[selectedIndex];
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [side, setSide] = useState(placement);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const optionId = (i: number) => `${id}-option-${i}`;

  const firstActive = () => (selected && !selected.disabled ? selectedIndex : stepIndex(models, models.length - 1, 1));
  const show = () => {
    const rect = button.current?.getBoundingClientRect();
    if (rect) setSide(pickSide(placement, rect.top, window.innerHeight - rect.bottom));
    setActive(firstActive());
    setOpen(true);
  };
  const hide = (refocus: boolean) => {
    setOpen(false);
    if (refocus) button.current?.focus();
  };
  const choose = (i: number) => {
    const m = models[i];
    if (!m || m.disabled) return;
    if (valueProp === undefined) setInner(m.id);
    onValueChange?.(m.id);
    hide(true);
  };

  useEffect(() => {
    if (!open) return;
    list.current?.focus();
    const outside = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  useEffect(() => {
    if (open && active >= 0) document.getElementById(`${id}-option-${active}`)?.scrollIntoView?.({ block: "nearest" });
  }, [open, active, id]);

  const onButtonKey = (e: KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    show();
  };

  const onListKey = (e: KeyboardEvent) => {
    if (e.key === "Tab") return setOpen(false);
    const keys: Record<string, () => void> = {
      ArrowDown: () => setActive((a) => stepIndex(models, a, 1)),
      ArrowUp: () => setActive((a) => stepIndex(models, Math.max(a, 0), -1)),
      Home: () => setActive(stepIndex(models, models.length - 1, 1)),
      End: () => setActive(stepIndex(models, 0, -1)),
      Enter: () => choose(active),
      " ": () => choose(active),
      Escape: () => hide(true),
    };
    const run = keys[e.key];
    if (!run) return;
    e.preventDefault();
    run();
  };

  const offset = side === "top" ? 4 : -4;
  const hidden = reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: offset };

  return (
    <div ref={root} className={`relative inline-block ${className}`}>
      <button
        ref={button}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${id}-list` : undefined}
        aria-label={`${label}: ${selected?.name ?? "none"}`}
        onClick={() => (open ? hide(false) : show())}
        onKeyDown={onButtonKey}
        className={`inline-flex h-8 items-center gap-1.5 rounded-full pl-2.5 pr-2 text-sm font-medium text-fg transition-colors hover:bg-subtle ${open ? "bg-subtle" : ""} ${ring}`}
      >
        {selected?.icon && <span className="text-fg-muted">{selected.icon}</span>}
        <span className="max-w-[160px] truncate">{selected?.name ?? label}</span>
        <ChevronDown size={14} strokeWidth={2} aria-hidden className={`text-fg-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            ref={list}
            id={`${id}-list`}
            role="listbox"
            tabIndex={-1}
            aria-label={label}
            aria-activedescendant={active >= 0 ? optionId(active) : undefined}
            onKeyDown={onListKey}
            initial={hidden}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={hidden}
            transition={{ type: "spring", stiffness: 520, damping: 34 }}
            style={{ transformOrigin: `${side === "top" ? "bottom" : "top"} ${align === "end" ? "right" : "left"}` }}
            className={`absolute z-50 max-h-80 w-72 overflow-y-auto rounded-[16px] bg-surface p-1.5 shadow-[var(--shadow-overlay)] outline-none dark:bg-raised ${side === "top" ? "bottom-full mb-2" : "top-full mt-2"} ${align === "end" ? "right-0" : "left-0"}`}
          >
            {models.map((m, i) => (
              <li
                key={m.id}
                id={optionId(i)}
                role="option"
                aria-selected={m.id === value}
                aria-disabled={m.disabled || undefined}
                onPointerMove={() => !m.disabled && setActive(i)}
                onClick={() => choose(i)}
                className={`flex cursor-default items-start gap-2.5 rounded-[10px] px-2.5 py-2 ${i === active ? hoverTint : ""} ${m.disabled ? "opacity-45" : ""}`}
              >
                {m.icon && <span className="mt-0.5 shrink-0 text-fg-muted">{m.icon}</span>}
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-sm font-medium text-fg">
                    {m.name}
                    {m.badge && <span className="rounded-full bg-select-soft px-1.5 text-[11px] font-medium leading-[18px] text-select-text">{m.badge}</span>}
                  </span>
                  {m.description && <span className="mt-0.5 block text-[13px] leading-[18px] text-fg-muted">{m.description}</span>}
                </span>
                <Check size={16} strokeWidth={2} aria-hidden className={`mt-0.5 shrink-0 text-fg ${m.id === value ? "" : "invisible"}`} />
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
