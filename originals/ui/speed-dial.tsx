"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Plus, type LucideIcon } from "lucide-react";

/* Speed dial: a floating action button that fans out a short menu of labelled actions; arrow keys move between them, Escape and outside clicks close it. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface SpeedDialAction {
  id: string;
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
}

export interface SpeedDialProps {
  actions: SpeedDialAction[];
  label?: string;
  /** Which way the actions fan out. */
  direction?: "up" | "down";
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

export function SpeedDial({ actions, label = "Quick actions", direction = "up", open: controlled, defaultOpen = false, onOpenChange, className = "" }: SpeedDialProps) {
  const reduce = useReduce();
  const [inner, setInner] = useState(defaultOpen);
  const open = controlled ?? inner;
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const setOpen = (next: boolean) => {
    setInner(next);
    onOpenChange?.(next);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) {
        setInner(false);
        onOpenChange?.(false);
      }
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, onOpenChange]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && open) {
      setOpen(false);
      trigger.current?.focus();
      return;
    }
    const focusables = items.current.filter((n): n is HTMLButtonElement => n !== null);
    const at = focusables.indexOf(document.activeElement as HTMLButtonElement);
    const forward = direction === "up" ? "ArrowUp" : "ArrowDown";
    const backward = direction === "up" ? "ArrowDown" : "ArrowUp";
    if (open && (e.key === forward || e.key === backward) && focusables.length) {
      e.preventDefault();
      const delta = e.key === forward ? 1 : -1;
      const next = at === -1 ? (delta > 0 ? 0 : focusables.length - 1) : (at + delta + focusables.length) % focusables.length;
      focusables[next].focus();
    }
  };

  const hidden = reduce ? { opacity: 0 } : { opacity: 0, y: direction === "up" ? 12 : -12, scale: 0.9 };

  return (
    <div ref={root} onKeyDown={onKeyDown} className={`relative inline-flex ${direction === "up" ? "flex-col-reverse" : "flex-col"} items-end gap-3 ${className}`}>
      <button
        ref={trigger}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen(!open)}
        className={`inline-flex size-12 items-center justify-center rounded-full bg-[image:var(--grad-primary)] text-[var(--inverse-fg)] shadow-[var(--shadow-btn-primary)] ${ring}`}
      >
        <motion.span animate={{ rotate: open && !reduce ? 135 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 34 }} className="inline-flex">
          <Plus className="size-5" aria-hidden />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div role="menu" aria-label={label} className={`flex ${direction === "up" ? "flex-col-reverse" : "flex-col"} items-end gap-2`} initial="hidden" animate="shown" exit="hidden" transition={{ staggerChildren: reduce ? 0 : 0.04 }}>
            {actions.map((a, i) => (
              <motion.button
                key={a.id}
                ref={(n) => {
                  items.current[i] = n;
                }}
                type="button"
                role="menuitem"
                variants={{ hidden, shown: { opacity: 1, y: 0, scale: 1 } }}
                transition={{ type: "spring", stiffness: 500, damping: 34 }}
                onClick={() => {
                  a.onSelect();
                  setOpen(false);
                  trigger.current?.focus();
                }}
                className={`inline-flex h-10 items-center gap-2 rounded-full bg-surface pl-3 pr-4 text-sm text-fg shadow-[var(--shadow-card)] hover:bg-[color-mix(in_srgb,var(--fg)_4%,var(--surface))] dark:bg-raised ${ring}`}
              >
                <a.icon className="size-4 text-fg-muted" aria-hidden />
                {a.label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
