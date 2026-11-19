"use client";

import { useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { formatMoney, Money } from "./cart-summary";

/* Subscription manager: shows the current plan, status and renewal date, lets you switch plan, and handles cancel (with a confirm step) and resume; every change is reported through callbacks. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const spring = { type: "spring", stiffness: 480, damping: 34 } as const;

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export type SubscriptionStatus = "active" | "canceling" | "past_due";

export interface SubscriptionPlanOption {
  id: string;
  name: string;
  /** Minor units per interval. */
  price: number;
}

export interface SubscriptionManagerProps {
  planId: string;
  plans: SubscriptionPlanOption[];
  status: SubscriptionStatus;
  /** Renewal date, or the end date while canceling. */
  renewsOn: Date | string;
  interval?: "month" | "year";
  currency?: string;
  /** Already masked, e.g. "Visa •••• 4242". */
  paymentMethod?: string;
  onChangePlan?: (planId: string) => void;
  onCancel?: () => void;
  onResume?: () => void;
  className?: string;
}

const STATUS_COPY: Record<SubscriptionStatus, { label: string; tone: string }> = {
  active: { label: "Active", tone: "bg-success-soft text-success-text" },
  canceling: { label: "Canceling", tone: "bg-warning-soft text-warning-text" },
  past_due: { label: "Payment failed", tone: "bg-danger-soft text-danger-text" },
};

/** What the next line of copy should say about the renewal date for each status. */
export function renewalLabel(status: SubscriptionStatus, date: Date | string): string {
  const text = new Date(date).toLocaleDateString("en", { dateStyle: "medium" });
  return status === "canceling" ? `Ends on ${text}` : status === "past_due" ? `Retrying on ${text}` : `Renews on ${text}`;
}

export function SubscriptionManager({ planId, plans, status, renewsOn, interval = "month", currency = "USD", paymentMethod, onChangePlan, onCancel, onResume, className = "" }: SubscriptionManagerProps) {
  const reduce = useReduce();
  const [confirming, setConfirming] = useState(false);
  const plan = plans.find((p) => p.id === planId);
  const badge = STATUS_COPY[status];
  const button = "h-9 rounded-[10px] px-3.5 text-sm font-medium transition-colors";
  const tap = reduce ? undefined : { scale: 0.97 };
  const fade = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.16 } };
  return (
    <motion.section initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={spring} aria-label="Subscription" className={`grid gap-4 rounded-[20px] bg-surface p-5 shadow-[var(--shadow-card)] dark:bg-raised ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.h4 key={plan?.id ?? "none"} {...fade} className="text-[15px] font-medium text-fg">{plan?.name ?? "No plan"}</motion.h4>
          </AnimatePresence>
          {plan && <p className="text-sm tabular-nums text-fg-muted"><Money minor={plan.price} currency={currency} /> / {interval}</p>}
        </div>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={status} initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${badge.tone}`}>{badge.label}</motion.span>
        </AnimatePresence>
      </div>
      <dl className="grid gap-1.5 text-sm">
        <div className="flex justify-between"><dt className="text-fg-muted">Next date</dt><AnimatePresence mode="popLayout" initial={false}><motion.dd key={status} {...fade} className="text-fg">{renewalLabel(status, renewsOn)}</motion.dd></AnimatePresence></div>
        {paymentMethod && <div className="flex justify-between"><dt className="text-fg-muted">Payment method</dt><dd className="text-fg">{paymentMethod}</dd></div>}
      </dl>
      <AnimatePresence initial={false}>
        {status === "past_due" && <motion.div key="due" initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }} animate={reduce ? { opacity: 1 } : { opacity: 1, height: "auto" }} exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden"><p role="alert" className="rounded-[12px] bg-danger-soft px-3 py-2 text-sm text-danger-text">We could not charge your payment method. Update it to keep your plan.</p></motion.div>}
      </AnimatePresence>
      <label className="grid gap-1.5 text-sm text-fg-muted">
        Change plan
        <select value={planId} disabled={status === "canceling"} onChange={(e) => onChangePlan?.(e.target.value)} className={`h-9 rounded-[10px] bg-subtle px-2.5 text-sm text-fg disabled:opacity-50 ${ring}`}>
          {plans.map((p) => <option key={p.id} value={p.id}>{p.name} — {formatMoney(p.price, currency)} / {interval}</option>)}
        </select>
      </label>
      <div className="relative flex flex-wrap items-center gap-2">
        <AnimatePresence mode="popLayout" initial={false}>
        {status === "canceling" ? (
          <motion.button key="resume" {...fade} whileTap={tap} type="button" onClick={onResume} className={`${button} bg-[image:var(--grad-primary)] text-[var(--inverse-fg)] shadow-[var(--shadow-btn-primary)] ${ring}`}>Resume subscription</motion.button>
        ) : confirming ? (
          <motion.div key="confirm" {...fade} role="alertdialog" aria-label="Confirm cancellation" className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-fg">Cancel at the end of this period?</span>
            <motion.button whileTap={tap} type="button" onClick={() => { setConfirming(false); onCancel?.(); }} className={`${button} bg-danger-soft text-danger-text ${ring}`}>Yes, cancel</motion.button>
            <motion.button whileTap={tap} type="button" autoFocus onClick={() => setConfirming(false)} onKeyDown={(e) => e.key === "Escape" && setConfirming(false)} className={`${button} bg-subtle text-fg hover:bg-track ${ring}`}>Keep plan</motion.button>
          </motion.div>
        ) : (
          <motion.button key="cancel" {...fade} whileTap={tap} type="button" onClick={() => setConfirming(true)} className={`${button} bg-subtle text-fg hover:bg-track ${ring}`}>Cancel subscription</motion.button>
        )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
