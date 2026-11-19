"use client";

import { useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Star } from "lucide-react";

/* TestimonialCard: a quote with an optional star rating and an author line with initials avatar, name and role. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

export function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
}

export interface TestimonialCardProps {
  quote: string;
  author: string;
  role?: string;
  /** 0 to 5; omit to hide the stars. */
  rating?: number;
  className?: string;
}

export function TestimonialCard({ quote, author, role, rating, className = "" }: TestimonialCardProps) {
  const reduce = useReduce();
  return (
    <motion.figure initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 420, damping: 36 }} className={`flex w-full max-w-sm flex-col gap-4 rounded-[20px] bg-surface p-6 shadow-[var(--shadow-card)] ${className}`}>
      {rating !== undefined && (
        <div role="img" aria-label={`Rated ${rating} out of 5`} className="flex gap-0.5">
          {Array.from({ length: 5 }, (_, i) => (
            <motion.span key={i} initial={reduce ? false : { opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 520, damping: 22, delay: 0.15 + i * 0.06 }} className="inline-flex">
              <Star size={15} aria-hidden className={i < Math.round(rating) ? "fill-[var(--warning)] text-warning" : "text-track-strong"} />
            </motion.span>
          ))}
        </div>
      )}
      <blockquote className="text-[15px] leading-6 text-fg">“{quote}”</blockquote>
      <figcaption className="flex items-center gap-3">
        <span aria-hidden className="grid size-9 place-items-center rounded-full bg-select-soft text-xs font-semibold text-select-text">{initials(author)}</span>
        <span>
          <span className="block text-sm font-medium text-fg">{author}</span>
          {role && <span className="block text-xs text-fg-muted">{role}</span>}
        </span>
      </figcaption>
    </motion.figure>
  );
}
