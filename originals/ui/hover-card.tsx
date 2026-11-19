"use client";

import { useEffect, useId, useRef, useSyncExternalStore, type KeyboardEvent, type ReactElement, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cloneTrigger, useControlled } from "./dialog";
import { pickSide } from "./model-picker";

/* Hover card: a rich preview that opens after a short delay when the pointer rests on, or keyboard focus lands on, its trigger; it stays open while the pointer is over the card, closes on Escape and flips to stay in the viewport. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

export interface HoverCardProps {
  /** The element that reveals the card; it receives aria-describedby while open. */
  trigger: ReactElement;
  children: ReactNode;
  /** Milliseconds the pointer must rest before the card opens. */
  openDelay?: number;
  closeDelay?: number;
  placement?: "top" | "bottom";
  align?: "start" | "center" | "end";
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Accessible name for the card. */
  label?: string;
  className?: string;
}

const ALIGN = { start: "left-0", center: "left-1/2 -translate-x-1/2", end: "right-0" };

export function HoverCard({ trigger, children, openDelay = 300, closeDelay = 150, placement = "bottom", align = "start", open, defaultOpen, onOpenChange, label = "Preview", className = "" }: HoverCardProps) {
  const id = useId();
  const reduce = useReduce();
  const [isOpen, setOpen] = useControlled(open, defaultOpen ?? false, onOpenChange);
  const timer = useRef(0);
  const side = useRef(placement);
  const root = useRef<HTMLSpanElement>(null);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const schedule = (next: boolean, delay: number) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      if (next) {
        const rect = root.current?.getBoundingClientRect();
        if (rect) side.current = pickSide(placement, rect.top, window.innerHeight - rect.bottom, 200);
      }
      setOpen(next);
    }, delay);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Escape" || !isOpen) return;
    window.clearTimeout(timer.current);
    setOpen(false);
  };

  const top = side.current === "top";
  const hidden = reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: top ? 4 : -4 };
  return (
    <span
      ref={root}
      className="relative inline-block"
      onPointerEnter={(e) => e.pointerType !== "touch" && schedule(true, openDelay)}
      onPointerLeave={() => schedule(false, closeDelay)}
      onFocus={() => schedule(true, 0)}
      onBlur={(e) => !root.current?.contains(e.relatedTarget as Node | null) && schedule(false, 0)}
      onKeyDown={onKeyDown}
    >
      {cloneTrigger(trigger, { "aria-describedby": isOpen ? id : undefined })}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id={id}
            role="group"
            aria-label={label}
            initial={hidden}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={hidden}
            transition={{ type: "spring", stiffness: 520, damping: 34 }}
            style={{ transformOrigin: `${top ? "bottom" : "top"} ${align === "center" ? "center" : align === "end" ? "right" : "left"}` }}
            className={`absolute z-50 w-72 rounded-[16px] bg-surface p-4 text-sm text-fg shadow-[var(--shadow-overlay)] dark:bg-raised ${top ? "bottom-full mb-2" : "top-full mt-2"} ${ALIGN[align]} ${className}`}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}
