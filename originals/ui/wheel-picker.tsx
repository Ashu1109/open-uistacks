"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

/* Wheel picker: an iOS-style drum of options that you drag, scroll with the mouse wheel or step with the keyboard; it is exposed as a listbox with the centre row selected. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface WheelOption {
  value: string;
  label: string;
}

export function clampIndex(index: number, length: number): number {
  return Math.min(Math.max(index, 0), Math.max(length - 1, 0));
}

/** The row a drag of `dy` px lands on, starting from `from`. */
export function indexAfterDrag(from: number, dy: number, rowHeight: number, length: number): number {
  return clampIndex(Math.round(from - dy / rowHeight), length);
}

export interface WheelPickerProps {
  options: WheelOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  label: string;
  /** Row height in px. */
  rowHeight?: number;
  /** Odd number of rows shown. */
  visibleRows?: number;
  className?: string;
}

export function WheelPicker({ options, value: controlled, defaultValue, onValueChange, label, rowHeight = 36, visibleRows = 5, className = "" }: WheelPickerProps) {
  const id = useId();
  const [inner, setInner] = useState(defaultValue ?? options[0]?.value);
  const value = controlled ?? inner;
  const index = clampIndex(options.findIndex((o) => o.value === value), options.length);
  const [drag, setDrag] = useState<{ startY: number; from: number; dy: number } | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const indexRef = useRef(index);
  indexRef.current = index;
  const lastWheel = useRef(0);

  const select = (next: number) => {
    const i = clampIndex(next, options.length);
    if (i === indexRef.current || !options[i]) return;
    indexRef.current = i;
    setInner(options[i].value);
    onValueChange?.(options[i].value);
  };
  const selectRef = useRef(select);
  selectRef.current = select;

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const now = Date.now();
      if (now - lastWheel.current < 60 || e.deltaY === 0) return;
      lastWheel.current = now;
      selectRef.current(indexRef.current + Math.sign(e.deltaY));
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, []);

  const onPointerMove = (e: PointerEvent) => {
    if (!drag) return;
    const dy = e.clientY - drag.startY;
    if (Math.abs(dy) > 4 && Math.abs(drag.dy) <= 4) e.currentTarget.setPointerCapture?.(e.pointerId);
    setDrag({ ...drag, dy });
  };
  const endDrag = () => {
    if (!drag) return;
    select(indexAfterDrag(drag.from, drag.dy, rowHeight, options.length));
    setDrag(null);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const jump: Record<string, number> = { ArrowDown: index + 1, ArrowUp: index - 1, PageDown: index + 3, PageUp: index - 3, Home: 0, End: options.length - 1 };
    if (!(e.key in jump)) return;
    e.preventDefault();
    select(jump[e.key]);
  };

  const pad = Math.floor(visibleRows / 2);
  const position = drag ? drag.from - drag.dy / rowHeight : index;

  return (
    <div
      ref={root}
      role="listbox"
      tabIndex={0}
      aria-label={label}
      aria-activedescendant={options[index] ? `${id}-${index}` : undefined}
      onKeyDown={onKeyDown}
      onPointerDown={(e) => {
        setDrag({ startY: e.clientY, from: index, dy: 0 });
      }}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className={`relative w-40 cursor-grab touch-none select-none overflow-hidden rounded-[16px] bg-surface shadow-[var(--shadow-card)] active:cursor-grabbing ${ring} ${className}`}
      style={{ height: rowHeight * visibleRows }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-x-2 rounded-[10px] bg-subtle" style={{ top: rowHeight * pad, height: rowHeight }} />
      <div className="absolute inset-x-0 motion-safe:transition-transform motion-safe:duration-200" style={{ top: rowHeight * pad, transform: `translateY(${-position * rowHeight}px)`, transitionDuration: drag ? "0ms" : undefined }}>
        {options.map((o, i) => {
          const distance = Math.abs(i - position);
          return (
            <div
              key={o.value}
              id={`${id}-${i}`}
              role="option"
              aria-selected={i === index}
              onClick={() => select(i)}
              className="flex items-center justify-center text-sm font-medium text-fg"
              style={{ height: rowHeight, opacity: Math.max(1 - distance * 0.28, 0.12), transform: `scale(${Math.max(1 - distance * 0.07, 0.7)})` }}
            >
              {o.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
