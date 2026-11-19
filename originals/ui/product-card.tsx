"use client";

import { Check, ShoppingBag, Star } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { formatMoney } from "./cart-summary";

/* Product card: image, name, rating, price with an optional struck-through compare-at price and a sale badge, and an add-to-cart button that confirms briefly. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const spring = { type: "spring", stiffness: 480, damping: 34 } as const;

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface ProductCardProps {
  name: string;
  /** Minor units. */
  price: number;
  /** Original price in minor units; shows a sale badge when higher than price. */
  compareAtPrice?: number;
  currency?: string;
  imageUrl?: string;
  /** 0 to 5. */
  rating?: number;
  reviewCount?: number;
  outOfStock?: boolean;
  onAddToCart?: () => void;
  className?: string;
}

export function discountPercent(price: number, compareAt?: number): number {
  return compareAt && compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : 0;
}

export function ProductCard({ name, price, compareAtPrice, currency = "USD", imageUrl, rating, reviewCount, outOfStock, onAddToCart, className = "" }: ProductCardProps) {
  const reduce = useReduce();
  const [added, setAdded] = useState(false);
  const off = discountPercent(price, compareAtPrice);
  const add = () => {
    onAddToCart?.();
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };
  return (
    <motion.article initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} whileHover={reduce ? undefined : { y: -2 }} transition={spring} aria-label={name} className={`group grid gap-3 rounded-[20px] bg-surface p-3 shadow-[var(--shadow-card)] dark:bg-raised ${className}`}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-[14px] bg-[color-mix(in_srgb,var(--series-1)_10%,var(--subtle))]">
        {imageUrl && <img src={imageUrl} alt="" className="size-full object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-105" />}
        {off > 0 && <motion.span initial={reduce ? false : { scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ ...spring, delay: 0.15 }} className="absolute left-2 top-2 rounded-full bg-danger-soft px-2 py-0.5 text-[11px] font-semibold text-danger-text backdrop-blur">−{off}%</motion.span>}
      </div>
      <div className="grid gap-1 px-1">
        <h4 className="truncate text-sm font-medium text-fg">{name}</h4>
        {rating !== undefined && (
          <p className="flex items-center gap-1 text-xs text-fg-muted">
            <Star size={13} className="fill-warning text-warning" aria-hidden />
            <span className="tabular-nums">{rating.toFixed(1)}</span>
            <span className="sr-only">out of 5 stars</span>
            {reviewCount !== undefined && <span className="text-fg-subtle">({reviewCount})</span>}
          </p>
        )}
        <p className="flex items-baseline gap-2">
          <span className="text-base font-semibold tabular-nums text-fg">{formatMoney(price, currency)}</span>
          {off > 0 && <s className="text-xs tabular-nums text-fg-subtle"><span className="sr-only">Was </span>{formatMoney(compareAtPrice!, currency)}</s>}
        </p>
      </div>
      <motion.button type="button" disabled={outOfStock} onClick={add} whileTap={reduce || outOfStock ? undefined : { scale: 0.97 }} aria-label={`Add ${name} to cart`} className={`flex h-10 items-center justify-center gap-2 rounded-[12px] bg-[image:var(--grad-primary)] text-sm font-medium text-[var(--inverse-fg)] shadow-[var(--shadow-btn-primary)] disabled:opacity-40 ${ring}`}>
        {outOfStock ? "Out of stock" : (
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={added ? "added" : "idle"} initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }} transition={{ duration: 0.16 }} className="flex items-center gap-2">
              {added ? <><motion.span initial={reduce ? false : { scale: 0 }} animate={{ scale: 1 }} transition={spring} className="grid"><Check size={15} aria-hidden /></motion.span> Added</> : <><ShoppingBag size={15} aria-hidden /> Add to cart</>}
            </motion.span>
          </AnimatePresence>
        )}
      </motion.button>
      <span role="status" className="sr-only">{added ? `${name} added to cart` : ""}</span>
    </motion.article>
  );
}
