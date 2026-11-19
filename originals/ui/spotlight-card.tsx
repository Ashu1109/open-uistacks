"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";

/* Spotlight card: a card whose surface and border glow under a soft radial light that follows the pointer, and sit centered while a child has keyboard focus. */

/** A radial-gradient layer centered at (x, y) px. */
export function spotlightBackground(x: number, y: number, radius: number, color: string): string {
  return `radial-gradient(${radius}px circle at ${x}px ${y}px, ${color}, transparent 70%)`;
}

export interface SpotlightCardProps {
  children: ReactNode;
  /** Light radius in px. */
  radius?: number;
  /** Any CSS color; defaults to a soft tint of the selection color. */
  color?: string;
  className?: string;
  style?: CSSProperties;
}

export function SpotlightCard({ children, radius = 220, color = "color-mix(in srgb, var(--select) 22%, transparent)", className = "", style }: SpotlightCardProps) {
  const glow = useRef<HTMLDivElement>(null);
  const move = (x: number, y: number) => {
    if (!glow.current) return;
    glow.current.style.background = spotlightBackground(x, y, radius, color);
    glow.current.style.opacity = "1";
  };
  const hide = () => {
    if (glow.current) glow.current.style.opacity = "0";
  };

  return (
    <div
      className={`relative overflow-hidden rounded-[20px] bg-surface p-6 shadow-[var(--shadow-card)] ${className}`}
      style={style}
      onPointerMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        move(e.clientX - rect.left, e.clientY - rect.top);
      }}
      onPointerLeave={hide}
      onFocus={(e) => move(e.currentTarget.offsetWidth / 2, e.currentTarget.offsetHeight / 2)}
      onBlur={hide}
    >
      <div ref={glow} aria-hidden data-spotlight className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300" />
      <div className="relative">{children}</div>
    </div>
  );
}
