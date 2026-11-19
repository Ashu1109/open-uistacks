"use client";

import { useState, useSyncExternalStore, type PointerEvent } from "react";
import { AnimatePresence, motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { Eye, EyeOff, Nfc } from "lucide-react";

/* Payment card: a styled bank card visual with a masked number by default, holder, expiry and a reveal toggle; built for demo data only. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const TILT = 8;
const SPRING = { stiffness: 220, damping: 22, mass: 0.6 };

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

/** "•••• •••• •••• 1234", or the full number in groups of four when `reveal`. */
export function maskCardNumber(number: string, reveal = false): string {
  const digits = number.replace(/\D/g, "");
  const grouped = (s: string) => s.replace(/(.{4})(?=.)/g, "$1 ");
  if (reveal) return grouped(digits);
  const hidden = "•".repeat(Math.max(digits.length - 4, 0));
  return grouped(hidden + digits.slice(-4));
}

export type CardVariant = "graphite" | "ocean" | "aurora";

const BACKGROUND: Record<CardVariant, string> = {
  graphite: "linear-gradient(135deg, #3a3a42 0%, #17171b 100%)",
  ocean: "linear-gradient(135deg, #2f7cf6 0%, #14307a 100%)",
  aurora: "linear-gradient(135deg, #7a5af8 0%, #12a1a1 100%)",
};

export interface PaymentCardProps {
  /** Card number; only the last four digits show until revealed. */
  number: string;
  holder: string;
  /** "MM/YY". */
  expiry: string;
  brand?: string;
  variant?: CardVariant;
  /** Show the reveal button. */
  revealable?: boolean;
  className?: string;
}

export function PaymentCard({ number, holder, expiry, brand = "Demo Bank", variant = "graphite", revealable = true, className = "" }: PaymentCardProps) {
  const [revealed, setRevealed] = useState(false);
  const reduce = useReduce();
  const rotX = useSpring(0, SPRING);
  const rotY = useSpring(0, SPRING);
  const sheenX = useMotionValue(50);
  const sheenY = useMotionValue(0);
  const sheenOpacity = useSpring(0, { stiffness: 300, damping: 30 });
  const sheen = useMotionTemplate`radial-gradient(circle at ${sheenX}% ${sheenY}%, rgba(255,255,255,0.28), transparent 55%)`;
  const track = (e: PointerEvent<HTMLDivElement>) => {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    rotY.set((px - 0.5) * 2 * TILT);
    rotX.set((0.5 - py) * 2 * TILT);
    sheenX.set(px * 100);
    sheenY.set(py * 100);
    sheenOpacity.set(1);
  };
  const rest = () => {
    rotX.set(0);
    rotY.set(0);
    sheenOpacity.set(0);
  };
  const last4 = number.replace(/\D/g, "").slice(-4);
  return (
    <motion.div
      role="group"
      aria-label={`${brand} card ending in ${last4}`}
      onPointerMove={track}
      onPointerLeave={rest}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 460, damping: 34 }}
      className={`relative aspect-[1.586] w-full max-w-sm overflow-hidden rounded-[20px] p-5 text-[var(--on-feature)] shadow-[var(--shadow-card)] ${className}`}
      style={{ background: BACKGROUND[variant], rotateX: reduce ? 0 : rotX, rotateY: reduce ? 0 : rotY, transformPerspective: 900 }}
    >
      <motion.div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: sheen, opacity: sheenOpacity }} />
      <div aria-hidden className="pointer-events-none absolute -right-10 -top-16 size-56 rounded-full bg-white/10 blur-2xl" />
      <div className="relative flex items-center justify-between">
        <span className="text-sm font-semibold tracking-wide">{brand}</span>
        <Nfc size={20} aria-hidden className="opacity-80" />
      </div>
      <div className="relative mt-8 flex items-center gap-2">
        <div className="grid">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.p
              key={revealed ? "shown" : "masked"}
              initial={reduce ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
              transition={{ duration: 0.16 }}
              className="font-mono text-lg tracking-[0.12em] tabular-nums"
              aria-label={revealed ? "Card number" : `Card number ending in ${last4}`}
            >
              {maskCardNumber(number, revealed)}
            </motion.p>
          </AnimatePresence>
        </div>
        {revealable && (
          <motion.button type="button" whileTap={reduce ? undefined : { scale: 0.9 }} aria-pressed={revealed} aria-label={revealed ? "Hide card number" : "Show card number"} onClick={() => setRevealed(!revealed)} className={`grid size-7 place-items-center rounded-full transition-colors hover:bg-white/15 ${ring}`}>
            {revealed ? <EyeOff size={15} aria-hidden /> : <Eye size={15} aria-hidden />}
          </motion.button>
        )}
      </div>
      <div className="absolute inset-x-5 bottom-5 flex items-end justify-between text-xs">
        <div><p className="text-[10px] uppercase opacity-70">Card holder</p><p className="mt-0.5 text-sm font-medium">{holder}</p></div>
        <div className="text-right"><p className="text-[10px] uppercase opacity-70">Expires</p><p className="mt-0.5 text-sm font-medium tabular-nums">{expiry}</p></div>
      </div>
    </motion.div>
  );
}
