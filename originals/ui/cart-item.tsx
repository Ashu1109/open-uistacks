"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { useRef, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { formatMoney, Money } from "./cart-summary";

/* Cart item: one cart line with thumbnail, name, variant, unit and line price, a quantity stepper and a remove button. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const spring = { type: "spring", stiffness: 480, damping: 34 } as const;

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface CartItemProps {
  name: string;
  variant?: string;
  imageUrl?: string;
  /** Minor units for one unit. */
  unitPrice: number;
  quantity: number;
  currency?: string;
  max?: number;
  onQuantityChange?: (quantity: number) => void;
  onRemove?: () => void;
  className?: string;
}

/** Keeps a quantity a whole number between 1 and `max`. */
export function clampQuantity(value: number, max = 99): number {
  return Math.min(Math.max(Math.trunc(Number.isFinite(value) ? value : 1), 1), max);
}

export function CartItem({ name, variant, imageUrl, unitPrice, quantity, currency = "USD", max = 99, onQuantityChange, onRemove, className = "" }: CartItemProps) {
  const reduce = useReduce();
  const previous = useRef(quantity);
  const dir = quantity >= previous.current ? 1 : -1;
  previous.current = quantity;
  const set = (q: number) => onQuantityChange?.(clampQuantity(q, max));
  const step = `grid size-7 place-items-center rounded-full bg-subtle text-fg-muted transition-colors enabled:hover:bg-track enabled:hover:text-fg disabled:opacity-40 ${ring}`;
  const tap = reduce ? undefined : { scale: 0.88 };
  return (
    <motion.div layout={!reduce} initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0, marginTop: 0 }} transition={spring} className={`flex items-center gap-3 overflow-clip [overflow-clip-margin:6px] ${className}`}>
      <span className="size-16 shrink-0 overflow-hidden rounded-[12px] bg-subtle shadow-[var(--shadow-hairline)]">
        {imageUrl && <img src={imageUrl} alt="" className="size-full object-cover" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-fg">{name}</p>
        {variant && <p className="truncate text-xs text-fg-muted">{variant}</p>}
        <p className="text-xs tabular-nums text-fg-subtle">{formatMoney(unitPrice, currency)} each</p>
        <div role="group" aria-label={`Quantity of ${name}`} className="mt-1.5 flex items-center gap-2">
          <motion.button whileTap={tap} type="button" aria-label={`Decrease quantity of ${name}`} disabled={quantity <= 1} onClick={() => set(quantity - 1)} className={step}><Minus size={13} aria-hidden /></motion.button>
          <output aria-live="polite" className="relative grid h-5 w-5 place-items-center overflow-hidden text-center text-sm tabular-nums text-fg"><AnimatePresence mode="popLayout" initial={false} custom={dir}><motion.span key={quantity} custom={dir} initial={reduce ? { opacity: 0 } : { opacity: 0, y: dir * 10 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? { opacity: 0 } : { opacity: 0, y: dir * -10 }} transition={{ duration: 0.16 }}>{quantity}</motion.span></AnimatePresence></output>
          <motion.button whileTap={tap} type="button" aria-label={`Increase quantity of ${name}`} disabled={quantity >= max} onClick={() => set(quantity + 1)} className={step}><Plus size={13} aria-hidden /></motion.button>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <span className="text-sm font-medium tabular-nums text-fg"><Money minor={unitPrice * quantity} currency={currency} /></span>
        {onRemove && <motion.button whileTap={tap} type="button" aria-label={`Remove ${name}`} onClick={onRemove} className={`grid size-7 place-items-center rounded-[8px] text-fg-subtle transition-colors hover:bg-danger-soft hover:text-danger-text ${ring}`}><Trash2 size={15} aria-hidden /></motion.button>}
      </div>
    </motion.div>
  );
}
