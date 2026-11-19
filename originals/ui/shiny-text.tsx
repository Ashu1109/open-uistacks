"use client";

import { useState, useSyncExternalStore, type CSSProperties } from "react";
import { motion, useReducedMotion } from "motion/react";

/* Shiny text: text with a soft highlight that sweeps across it on a loop, optionally pausing on hover; the text is real, so screen readers read it as is. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

/** The clipped gradient style: `base` text color with a `shine` band `width` percent wide. */
export function shineStyle(base: string, shine: string, width = 20): CSSProperties {
  const half = width / 2;
  return {
    backgroundImage: `linear-gradient(110deg, ${base} ${50 - half}%, ${shine} 50%, ${base} ${50 + half}%)`,
    backgroundSize: "250% 100%",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
    color: "transparent",
  };
}

export interface ShinyTextProps {
  children: string;
  /** Seconds per sweep. */
  duration?: number;
  pauseOnHover?: boolean;
  disabled?: boolean;
  /** Resting text color. */
  base?: string;
  /** Highlight color. */
  shine?: string;
  className?: string;
}

export function ShinyText({ children, duration = 2.4, pauseOnHover = false, disabled = false, base = "var(--fg-muted)", shine = "var(--fg)", className = "" }: ShinyTextProps) {
  const reduce = useReduce();
  const [paused, setPaused] = useState(false);
  const still = disabled || reduce || paused;
  return (
    <motion.span
      className={`inline-block ${className}`}
      style={shineStyle(base, shine)}
      initial={{ backgroundPosition: "150% 0" }}
      animate={still ? { backgroundPosition: "150% 0" } : { backgroundPosition: ["150% 0", "-50% 0"] }}
      transition={still ? { duration: 0 } : { duration, repeat: Infinity, ease: "linear" }}
      onPointerEnter={pauseOnHover ? () => setPaused(true) : undefined}
      onPointerLeave={pauseOnHover ? () => setPaused(false) : undefined}
    >
      {children}
    </motion.span>
  );
}
