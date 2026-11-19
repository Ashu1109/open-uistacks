"use client";

import { useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Money } from "./cart-summary";

/* Pricing calculator: sliders for seats and monthly usage that price a plan live (base fee, extra seats, overage) with a monthly/yearly switch; math is in integer minor units. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const spring = { type: "spring", stiffness: 480, damping: 34 } as const;

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface PricingModel {
  /** Minor units per month. */
  base: number;
  includedSeats: number;
  /** Minor units per extra seat per month. */
  seatPrice: number;
  includedUnits: number;
  /** Minor units per 1,000 units above the included amount. */
  overagePer1k: number;
  /** Percent off when billed yearly. */
  yearlyDiscountPercent?: number;
}

export interface Estimate {
  base: number;
  seats: number;
  overage: number;
  monthly: number;
  /** What a month costs after any yearly discount. */
  effectiveMonthly: number;
  yearTotal: number;
}

export function estimatePrice(model: PricingModel, seats: number, units: number, yearly: boolean): Estimate {
  const extraSeats = Math.max(seats - model.includedSeats, 0);
  const extraUnits = Math.max(units - model.includedUnits, 0);
  const seatsCost = extraSeats * model.seatPrice;
  const overage = Math.round((extraUnits / 1000) * model.overagePer1k);
  const monthly = model.base + seatsCost + overage;
  const effectiveMonthly = yearly ? Math.round((monthly * (100 - (model.yearlyDiscountPercent ?? 0))) / 100) : monthly;
  return { base: model.base, seats: seatsCost, overage, monthly, effectiveMonthly, yearTotal: effectiveMonthly * 12 };
}

export interface PricingCalculatorProps {
  model: PricingModel;
  currency?: string;
  maxSeats?: number;
  maxUnits?: number;
  unitLabel?: string;
  className?: string;
}

export function PricingCalculator({ model, currency = "USD", maxSeats = 50, maxUnits = 200_000, unitLabel = "requests", className = "" }: PricingCalculatorProps) {
  const reduce = useReduce();
  const [seats, setSeats] = useState(model.includedSeats);
  const [units, setUnits] = useState(model.includedUnits);
  const [yearly, setYearly] = useState(false);
  const est = estimatePrice(model, seats, units, yearly);
  const slider = (id: string, label: string, value: number, min: number, max: number, step: number, set: (n: number) => void) => (
    <div className="grid gap-2">
      <div className="flex justify-between text-sm"><label htmlFor={id} className="text-fg-muted">{label}</label><output htmlFor={id} className="font-medium tabular-nums text-fg">{value.toLocaleString("en-US")}</output></div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => set(Number(e.target.value))} className={`h-1.5 w-full cursor-pointer accent-[var(--select)] ${ring}`} />
    </div>
  );
  return (
    <motion.section initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={spring} aria-label="Pricing calculator" className={`grid gap-5 rounded-[20px] bg-surface p-5 shadow-[var(--shadow-card)] dark:bg-raised ${className}`}>
      {slider("calc-seats", "Seats", seats, 1, maxSeats, 1, setSeats)}
      {slider("calc-units", `Monthly ${unitLabel}`, units, 0, maxUnits, 1000, setUnits)}
      <label className="flex items-center justify-between text-sm text-fg-muted">
        Bill yearly{model.yearlyDiscountPercent ? ` (save ${model.yearlyDiscountPercent}%)` : ""}
        <input type="checkbox" role="switch" checked={yearly} onChange={(e) => setYearly(e.target.checked)} className={`size-4 accent-[var(--select)] ${ring}`} />
      </label>
      <dl className="grid gap-1.5 border-t border-track pt-4 text-sm">
        <div className="flex justify-between"><dt className="text-fg-muted">Base</dt><dd className="tabular-nums text-fg"><Money minor={est.base} currency={currency} /></dd></div>
        <div className="flex justify-between"><dt className="text-fg-muted">Extra seats</dt><dd className="tabular-nums text-fg"><Money minor={est.seats} currency={currency} /></dd></div>
        <div className="flex justify-between"><dt className="text-fg-muted">Usage overage</dt><dd className="tabular-nums text-fg"><Money minor={est.overage} currency={currency} /></dd></div>
      </dl>
      <p role="status" aria-label="Estimated price" className="flex items-baseline gap-1.5">
        <span className="text-3xl font-semibold tabular-nums tracking-tight text-fg"><Money minor={est.effectiveMonthly} currency={currency} /></span>
        <span className="text-sm text-fg-muted">/ month<AnimatePresence initial={false}>{yearly && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>, <Money minor={est.yearTotal} currency={currency} /> billed yearly</motion.span>}</AnimatePresence></span>
      </p>
    </motion.section>
  );
}
