"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";
import { motion, useReducedMotion, type PanInfo } from "motion/react";

/* SwipeRow: a list row that slides left on drag to reveal action buttons; it snaps open or closed by distance and velocity, and Arrow keys or Escape do the same from the keyboard. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-inset";

/** Whether a drag that ended at `offset` (negative = left) with `velocity` should settle open. */
export function shouldOpen(offset: number, velocity: number, revealWidth: number): boolean {
  if (velocity < -500) return true;
  if (velocity > 500) return false;
  return offset < -revealWidth / 2;
}

export interface SwipeAction {
  id: string;
  label: string;
  tone?: "neutral" | "danger";
  onSelect: () => void;
}

export interface SwipeRowProps {
  children: ReactNode;
  actions: readonly SwipeAction[];
  /** Width of each action button. */
  actionWidth?: number;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

export function SwipeRow({ children, actions, actionWidth = 80, onOpenChange, className = "" }: SwipeRowProps) {
  const reduce = Boolean(useReducedMotion());
  const [open, setOpen] = useState(false);
  const reveal = actions.length * actionWidth;

  const set = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  };
  const onDragEnd = (_: unknown, info: PanInfo) => set(shouldOpen(info.offset.x + (open ? -reveal : 0), info.velocity.x, reveal));
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") set(true);
    else if (e.key === "ArrowRight" || e.key === "Escape") set(false);
    else return;
    e.preventDefault();
  };

  return (
    <div className={`relative overflow-hidden rounded-[16px] bg-subtle ${className}`}>
      <div className="absolute inset-y-0 right-0 flex" style={{ width: reveal }}>
        {actions.map((a) => (
          <button
            key={a.id}
            type="button"
            tabIndex={open ? 0 : -1}
            onClick={() => { a.onSelect(); set(false); }}
            style={{ width: actionWidth }}
            className={`text-[13px] font-medium ${ring} ${a.tone === "danger" ? "bg-danger-solid text-white" : "bg-track-strong text-fg"}`}
          >
            {a.label}
          </button>
        ))}
      </div>
      <motion.div
        role="group"
        tabIndex={0}
        aria-label="Row, swipe left for actions"
        aria-expanded={open}
        drag={reduce ? false : "x"}
        dragConstraints={{ left: -reveal, right: 0 }}
        dragElastic={0.08}
        animate={{ x: open ? -reveal : 0 }}
        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 34 }}
        onDragEnd={onDragEnd}
        onKeyDown={onKey}
        className={`relative bg-surface px-4 py-3 shadow-[var(--shadow-card)] ${ring}`}
      >
        {children}
      </motion.div>
    </div>
  );
}
