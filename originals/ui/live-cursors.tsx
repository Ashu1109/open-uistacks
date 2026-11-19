"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

/* Live cursors: draws other people's pointers over a surface from props, gliding between positions with a spring; there is no networking, feed it positions from anywhere. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const PALETTE = ["#e5484d", "#12a150", "#8e4ec6", "#c27803", "#0091ff", "#d6409f"];

export interface RemoteCursor {
  id: string;
  name: string;
  /** Horizontal position as a fraction of the surface width, 0 to 1. */
  x: number;
  /** Vertical position as a fraction of the surface height, 0 to 1. */
  y: number;
  color?: string;
}

export interface LiveCursorsProps {
  cursors: RemoteCursor[];
  /** The shared surface the cursors float over. */
  children?: ReactNode;
  className?: string;
}

const clamp01 = (n: number) => Math.min(Math.max(n, 0), 1);

/** CSS percentage offsets for a cursor, clamped to the surface. */
export function cursorOffset(c: Pick<RemoteCursor, "x" | "y">): { left: string; top: string } {
  return { left: `${clamp01(c.x) * 100}%`, top: `${clamp01(c.y) * 100}%` };
}

export function LiveCursors({ cursors, children, className = "" }: LiveCursorsProps) {
  const reduce = useReduce();
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {children}
      <p className="sr-only" role="status">{cursors.length > 0 ? `${cursors.map((c) => c.name).join(", ")} ${cursors.length === 1 ? "is" : "are"} here` : "No one else is here"}</p>
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <AnimatePresence>
          {cursors.map((c, i) => {
            const color = c.color ?? PALETTE[i % PALETTE.length];
            return (
              <motion.div
                key={c.id}
                data-cursor={c.id}
                className="absolute"
                initial={{ opacity: 0, ...cursorOffset(c) }}
                animate={{ opacity: 1, ...cursorOffset(c) }}
                exit={{ opacity: 0 }}
                transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 28, mass: 0.6 }}
              >
                <svg width="18" height="20" viewBox="0 0 18 20" fill={color} stroke="white" strokeWidth="1.2" strokeLinejoin="round" className="drop-shadow-sm">
                  <path d="M2 1.5 15.5 9 9 10.8 6.6 17.5z" />
                </svg>
                <span className="absolute left-4 top-4 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium text-white" style={{ background: color }}>{c.name}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
