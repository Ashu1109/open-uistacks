"use client";

import { useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

/* Border beam: wraps any content in a hairline border with a soft gradient beam that travels around the edge; the beam holds still under reduced motion. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

export function beamGradient(arc: number, from: string, to: string): string {
  const start = 360 - Math.min(Math.max(arc, 10), 340);
  return `conic-gradient(from 0deg, transparent ${start}deg, ${from} ${start + (360 - start) * 0.6}deg, ${to} 360deg)`;
}

export interface BorderBeamProps {
  children: ReactNode;
  /** Seconds for one lap. */
  duration?: number;
  /** Length of the beam in degrees of the loop. */
  arc?: number;
  /** Border thickness in px. */
  borderWidth?: number;
  colorFrom?: string;
  colorTo?: string;
  /** Turn the beam off without unmounting. */
  active?: boolean;
  className?: string;
}

const MASK: CSSProperties = {
  WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  WebkitMaskComposite: "xor",
  mask: "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)",
};

export function BorderBeam({ children, duration = 4, arc = 90, borderWidth = 1.5, colorFrom = "var(--select)", colorTo = "var(--series-3)", active = true, className = "" }: BorderBeamProps) {
  const reduce = useReduce();
  return (
    <div className={`relative rounded-[20px] bg-surface shadow-[var(--shadow-card)] ${className}`}>
      {active && (
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]" style={{ ...MASK, padding: borderWidth }}>
          <motion.div
            className="absolute left-1/2 top-1/2 aspect-square w-[200%]"
            style={{ x: "-50%", y: "-50%", background: beamGradient(arc, colorFrom, colorTo) }}
            animate={reduce ? undefined : { rotate: 360 }}
            transition={{ repeat: Infinity, ease: "linear", duration }}
          />
        </div>
      )}
      <div className="relative rounded-[inherit]">{children}</div>
    </div>
  );
}
