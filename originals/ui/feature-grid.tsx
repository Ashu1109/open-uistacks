"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

/* FeatureGrid: a responsive grid of feature tiles, each with an icon, a title and a short description. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

export interface Feature {
  id: string;
  icon: ReactNode;
  title: string;
  description: string;
}

export interface FeatureGridProps {
  features: readonly Feature[];
  /** Columns at the widest breakpoint. */
  columns?: 2 | 3 | 4;
  className?: string;
}

const COLUMNS = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" } as const;

export function FeatureGrid({ features, columns = 3, className = "" }: FeatureGridProps) {
  const reduce = useReduce();
  return (
    <ul className={`grid gap-4 ${COLUMNS[columns]} ${className}`}>
      {features.map((f, i) => (
        <motion.li key={f.id} initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 480, damping: 34, delay: Math.min(i * 0.05, 0.4) }} whileHover={reduce ? undefined : { y: -3 }} className="group rounded-[20px] bg-surface p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[0_8px_24px_-8px_color-mix(in_srgb,var(--fg)_22%,transparent)]">
          <span aria-hidden className="grid size-10 place-items-center rounded-[12px] bg-select-soft text-select-text transition-transform duration-200 group-hover:scale-110">{f.icon}</span>
          <h4 className="mt-4 text-[15px] font-semibold text-fg">{f.title}</h4>
          <p className="mt-1 text-[13px] leading-5 text-fg-muted">{f.description}</p>
        </motion.li>
      ))}
    </ul>
  );
}
