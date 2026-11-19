"use client";

import { useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { BillingPlanCard } from "./billing-plan-card";

/* Pricing table: plan cards side by side with a monthly/yearly switch; yearly prices are shown per month with the saving called out. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const spring = { type: "spring", stiffness: 480, damping: 34 } as const;

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export type BillingInterval = "monthly" | "yearly";

export interface PricingPlan {
  id: string;
  name: string;
  description?: string;
  /** Minor units per month when billed monthly. */
  monthly: number;
  /** Minor units for a whole year when billed yearly; defaults to twelve months. */
  yearly?: number;
  features: string[];
  highlighted?: boolean;
  badge?: string;
  ctaLabel?: string;
}

export interface PricingTableProps {
  plans: PricingPlan[];
  interval?: BillingInterval;
  defaultInterval?: BillingInterval;
  onIntervalChange?: (interval: BillingInterval) => void;
  onSelect?: (planId: string, interval: BillingInterval) => void;
  currency?: string;
  className?: string;
}

/** Monthly-equivalent price in minor units for the chosen interval. */
export function priceFor(plan: PricingPlan, interval: BillingInterval): number {
  return interval === "yearly" ? Math.round((plan.yearly ?? plan.monthly * 12) / 12) : plan.monthly;
}

/** Whole-number percentage saved by paying yearly, 0 when there is none. */
export function yearlySavings(plan: PricingPlan): number {
  const full = plan.monthly * 12;
  return full > 0 && plan.yearly !== undefined && plan.yearly < full ? Math.round(((full - plan.yearly) / full) * 100) : 0;
}

export function PricingTable({ plans, interval, defaultInterval = "monthly", onIntervalChange, onSelect, currency = "USD", className = "" }: PricingTableProps) {
  const reduce = useReduce();
  const [inner, setInner] = useState<BillingInterval>(defaultInterval);
  const current = interval ?? inner;
  const maxSaving = Math.max(0, ...plans.map(yearlySavings));
  const choose = (next: BillingInterval) => {
    setInner(next);
    onIntervalChange?.(next);
  };
  return (
    <div className={`grid gap-6 ${className}`}>
      <div role="group" aria-label="Billing interval" className="mx-auto flex gap-1 rounded-full bg-subtle p-1">
        {(["monthly", "yearly"] as const).map((i) => (
          <motion.button key={i} type="button" aria-pressed={current === i} onClick={() => choose(i)} whileTap={reduce ? undefined : { scale: 0.97 }} className={`relative h-8 rounded-full px-4 text-sm font-medium capitalize transition-colors ${current === i ? "text-fg" : "text-fg-muted hover:text-fg"} ${ring}`}>
            {current === i && <motion.span layoutId="pricing-interval" transition={reduce ? { duration: 0 } : spring} className="absolute inset-0 -z-0 rounded-full bg-surface shadow-[var(--shadow-card)] dark:bg-raised" />}
            <span className="relative">{i}{i === "yearly" && maxSaving > 0 && <span className="ml-1.5 text-xs text-success-text">Save {maxSaving}%</span>}</span>
          </motion.button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((p, i) => (
          <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: i * 0.06 }} className="grid">
          <BillingPlanCard name={p.name} description={p.description} price={priceFor(p, current)} currency={currency} intervalLabel={current === "yearly" ? "/ month, billed yearly" : "/ month"} features={p.features} highlighted={p.highlighted} badge={p.badge} ctaLabel={p.ctaLabel} onSelect={() => onSelect?.(p.id, current)} className="h-full" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
