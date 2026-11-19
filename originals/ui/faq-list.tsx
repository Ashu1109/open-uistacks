"use client";

import { useId, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown } from "lucide-react";

/* FaqList: an accessible disclosure list; each question is a button with aria-expanded controlling its answer region, one open at a time unless `multiple`. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-inset";

/** Next set of open ids after toggling `id`. */
export function toggleOpen(open: readonly string[], id: string, multiple: boolean): string[] {
  if (open.includes(id)) return open.filter((x) => x !== id);
  return multiple ? [...open, id] : [id];
}

export interface FaqItem {
  id: string;
  question: string;
  answer: ReactNode;
}

export interface FaqListProps {
  items: readonly FaqItem[];
  multiple?: boolean;
  defaultOpen?: readonly string[];
  className?: string;
}

export function FaqList({ items, multiple = false, defaultOpen = [], className = "" }: FaqListProps) {
  const base = useId();
  const reduce = Boolean(useReducedMotion());
  const [open, setOpen] = useState<readonly string[]>(defaultOpen);

  return (
    <div className={`w-full max-w-2xl divide-y divide-[var(--track)] overflow-hidden rounded-[20px] bg-surface shadow-[var(--shadow-card)] ${className}`}>
      {items.map((item) => {
        const expanded = open.includes(item.id);
        return (
          <div key={item.id}>
            <h4>
              <button
                type="button"
                id={`${base}-${item.id}-q`}
                aria-expanded={expanded}
                aria-controls={`${base}-${item.id}-a`}
                onClick={() => setOpen(toggleOpen(open, item.id, multiple))}
                className={`flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[15px] font-medium text-fg hover:bg-[color-mix(in_srgb,var(--fg)_3%,var(--surface))] ${ring}`}
              >
                {item.question}
                <ChevronDown size={18} aria-hidden className={`shrink-0 text-fg-muted transition-transform ${expanded ? "rotate-180" : ""}`} />
              </button>
            </h4>
            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  key="answer"
                  role="region"
                  id={`${base}-${item.id}-a`}
                  aria-labelledby={`${base}-${item.id}-q`}
                  initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
                  exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 34 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-4 text-[14px] leading-6 text-fg-muted">{item.answer}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
