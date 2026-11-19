"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";

/* ResizablePanels: two panels split by a draggable separator (role="separator") that resizes with the pointer or the arrow, Home and End keys, within min and max percentages. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)]";

export function clampSize(size: number, min: number, max: number): number {
  return Math.min(Math.max(size, min), max);
}

export interface ResizablePanelsProps {
  start: ReactNode;
  end: ReactNode;
  orientation?: "horizontal" | "vertical";
  /** Size of the first panel as a percentage. */
  size?: number;
  defaultSize?: number;
  onSizeChange?: (size: number) => void;
  min?: number;
  max?: number;
  /** Percentage moved per arrow key press. */
  step?: number;
  label?: string;
  className?: string;
}

export function ResizablePanels({ start, end, orientation = "horizontal", size, defaultSize = 50, onSizeChange, min = 15, max = 85, step = 5, label = "Resize panels", className = "" }: ResizablePanelsProps) {
  const [inner, setInner] = useState(defaultSize);
  const [dragging, setDragging] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const horizontal = orientation === "horizontal";
  const current = clampSize(size ?? inner, min, max);

  const set = (next: number) => {
    const value = clampSize(next, min, max);
    if (size === undefined) setInner(value);
    onSizeChange?.(value);
  };

  const onMove = (e: PointerEvent) => {
    const rect = box.current?.getBoundingClientRect();
    const length = rect ? (horizontal ? rect.width : rect.height) : 0;
    if (!rect || length === 0) return;
    set(((horizontal ? e.clientX - rect.left : e.clientY - rect.top) / length) * 100);
  };

  const onKey = (e: KeyboardEvent) => {
    const back = horizontal ? "ArrowLeft" : "ArrowUp";
    const forward = horizontal ? "ArrowRight" : "ArrowDown";
    const next = e.key === back ? current - step : e.key === forward ? current + step : e.key === "Home" ? min : e.key === "End" ? max : null;
    if (next === null) return;
    e.preventDefault();
    set(next);
  };

  return (
    <div ref={box} className={`flex overflow-hidden rounded-[20px] bg-surface shadow-[var(--shadow-card)] ${horizontal ? "flex-row" : "flex-col"} ${className}`}>
      <div style={{ flexBasis: `${current}%` }} className="min-h-0 min-w-0 shrink-0 grow-0 overflow-auto">{start}</div>
      <div
        role="separator"
        tabIndex={0}
        aria-label={label}
        aria-orientation={horizontal ? "vertical" : "horizontal"}
        aria-valuenow={Math.round(current)}
        aria-valuemin={min}
        aria-valuemax={max}
        onKeyDown={onKey}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture?.(e.pointerId); setDragging(true); }}
        onPointerMove={(e) => dragging && onMove(e)}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        className={`group relative shrink-0 touch-none bg-track ${horizontal ? "w-px cursor-col-resize" : "h-px cursor-row-resize"} ${ring}`}
      >
        <span aria-hidden className={`absolute transition-colors ${horizontal ? "-inset-x-1.5 inset-y-0" : "-inset-y-1.5 inset-x-0"} ${dragging ? "bg-[color-mix(in_srgb,var(--select)_25%,transparent)]" : "group-hover:bg-[color-mix(in_srgb,var(--select)_15%,transparent)]"}`} />
        <span aria-hidden className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-track-strong ${horizontal ? "h-8 w-1" : "h-1 w-8"}`} />
      </div>
      <div className="min-h-0 min-w-0 flex-1 overflow-auto">{end}</div>
    </div>
  );
}
