"use client";

import { Check } from "lucide-react";
import { useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Money } from "./cart-summary";

/* Billing plan card: one plan with name, price per interval, feature list and a call-to-action; marks the current plan and can be highlighted as recommended. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const spring = { type: "spring", stiffness: 480, damping: 34 } as const;

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface BillingPlanCardProps {
  name: string;
  description?: string;
  /** Minor units per interval. */
  price: number;
  currency?: string;
  /** Text after the price, e.g. "/ month". */
  intervalLabel?: string;
  features: string[];
  current?: boolean;
  highlighted?: boolean;
  badge?: string;
  ctaLabel?: string;
  onSelect?: () => void;
  className?: string;
}

export function BillingPlanCard({ name, description, price, currency = "USD", intervalLabel = "/ month", features, current, highlighted, badge, ctaLabel = "Choose plan", onSelect, className = "" }: BillingPlanCardProps) {
  const reduce = useReduce();
  return (
    <motion.article initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} whileHover={reduce ? undefined : { y: -2 }} transition={spring} aria-label={`${name} plan`} className={`flex flex-col gap-4 rounded-[20px] bg-surface p-5 dark:bg-raised ${highlighted ? "shadow-[0_0_0_1.5px_var(--select),var(--shadow-card)]" : "shadow-[var(--shadow-card)]"} ${className}`}>
      <div className="grid gap-1">
        <h4 className="flex items-center gap-2 text-[15px] font-medium text-fg">
          {name}
          <AnimatePresence mode="popLayout" initial={false}>
            {(badge || current) && <motion.span key={current ? "current" : "badge"} initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="rounded-full bg-select-soft px-2 py-0.5 text-[11px] font-medium text-select-text">{current ? "Current plan" : badge}</motion.span>}
          </AnimatePresence>
        </h4>
        {description && <p className="text-sm text-fg-muted">{description}</p>}
      </div>
      <p className="flex items-baseline gap-1">
        <span className="text-3xl font-semibold tabular-nums tracking-tight text-fg"><Money minor={price} currency={currency} /></span>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={intervalLabel} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="text-sm text-fg-muted">{intervalLabel}</motion.span>
        </AnimatePresence>
      </p>
      <ul className="grid flex-1 content-start gap-2">
        {features.map((f, i) => (
          <motion.li key={f} initial={reduce ? { opacity: 0 } : { opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25, delay: 0.1 + i * 0.04 }} className="flex items-start gap-2 text-sm text-fg-muted"><Check size={15} className="mt-0.5 shrink-0 text-success" aria-hidden />{f}</motion.li>
        ))}
      </ul>
      <motion.button type="button" disabled={current} onClick={onSelect} whileTap={reduce || current ? undefined : { scale: 0.97 }} aria-label={`${ctaLabel}: ${name}`} className={`h-10 rounded-[12px] text-sm font-medium disabled:opacity-50 ${highlighted ? "bg-[image:var(--grad-primary)] text-[var(--inverse-fg)] shadow-[var(--shadow-btn-primary)]" : "bg-subtle text-fg hover:bg-track"} transition-colors ${ring}`}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={current ? "current" : "cta"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="block">{current ? "Current plan" : ctaLabel}</motion.span>
        </AnimatePresence>
      </motion.button>
    </motion.article>
  );
}
