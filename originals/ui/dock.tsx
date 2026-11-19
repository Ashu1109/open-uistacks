"use client";

import { useRef, useSyncExternalStore, type KeyboardEvent, type ReactNode } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from "motion/react";

/* Dock: a floating row of app icons that swell toward the pointer with a cosine falloff, show a label on hover or focus, mark running items with a dot and move focus with the arrow keys; magnification is off under reduced motion. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

/** Icon size at `distance` px from the pointer: `max` right under it, easing to `base` at `range` and beyond. */
export function magnify(distance: number, base: number, max: number, range: number): number {
  const d = Math.abs(distance);
  if (!Number.isFinite(d) || d >= range) return base;
  return base + (max - base) * ((Math.cos((d / range) * Math.PI) + 1) / 2);
}

export interface DockItem {
  id: string;
  label: string;
  icon: ReactNode;
  /** Shows the running-app dot. */
  active?: boolean;
  onSelect?: () => void;
}

interface DockIconProps {
  item: DockItem;
  pointerX: MotionValue<number>;
  base: number;
  max: number;
  range: number;
  magnifying: boolean;
}

function DockIcon({ item, pointerX, base, max, range, magnifying }: DockIconProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const distance = useTransform(pointerX, (x) => {
    const rect = ref.current?.getBoundingClientRect();
    return rect ? x - rect.left - rect.width / 2 : Infinity;
  });
  const target = useTransform(distance, (d) => (magnifying ? magnify(d, base, max, range) : base));
  const size = useSpring(target, { stiffness: 500, damping: 34, mass: 0.1 });
  return (
    <li className="group relative flex flex-col items-center justify-end">
      <span role="presentation" className="pointer-events-none absolute -top-9 whitespace-nowrap rounded-[8px] bg-inverse px-2 py-1 text-xs font-medium text-[var(--inverse-fg)] opacity-0 shadow-[var(--shadow-overlay)] transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        {item.label}
      </span>
      <motion.button
        ref={ref}
        type="button"
        aria-label={item.label}
        onClick={item.onSelect}
        style={{ width: size, height: size }}
        className={`grid place-items-center rounded-[14px] bg-subtle text-fg shadow-[var(--shadow-hairline)] transition-colors hover:bg-track ${ring}`}
      >
        {item.icon}
      </motion.button>
      <span aria-hidden className={`mt-1 size-1 rounded-full ${item.active ? "bg-fg-muted" : "bg-transparent"}`} />
      {item.active && <span className="sr-only">(running)</span>}
    </li>
  );
}

export interface DockProps {
  items: DockItem[];
  /** Resting icon size in px. */
  baseSize?: number;
  /** Icon size directly under the pointer. */
  maxSize?: number;
  label?: string;
  className?: string;
}

export function Dock({ items, baseSize = 44, maxSize = 72, label = "Dock", className = "" }: DockProps) {
  const reduce = useReduce();
  const pointerX = useMotionValue(Infinity);
  const list = useRef<HTMLUListElement>(null);

  const onKeyDown = (e: KeyboardEvent) => {
    const buttons = Array.from(list.current?.querySelectorAll<HTMLElement>("button") ?? []);
    const at = buttons.indexOf(document.activeElement as HTMLElement);
    const target: Record<string, number> = { ArrowRight: at + 1, ArrowLeft: at - 1, Home: 0, End: buttons.length - 1 };
    if (!(e.key in target)) return;
    e.preventDefault();
    buttons[(target[e.key] + buttons.length) % buttons.length]?.focus();
  };

  return (
    <ul
      ref={list}
      role="toolbar"
      aria-label={label}
      onKeyDown={onKeyDown}
      onPointerMove={(e) => e.pointerType === "mouse" && pointerX.set(e.clientX)}
      onPointerLeave={() => pointerX.set(Infinity)}
      style={{ minHeight: baseSize + 24 }}
      className={`inline-flex items-end gap-2 rounded-[24px] bg-surface/80 px-3 pb-2 pt-3 shadow-[var(--shadow-card)] backdrop-blur dark:bg-raised/80 ${className}`}
    >
      {items.map((item) => (
        <DockIcon key={item.id} item={item} pointerX={pointerX} base={baseSize} max={maxSize} range={baseSize * 3} magnifying={!reduce} />
      ))}
    </ul>
  );
}
