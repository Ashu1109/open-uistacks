"use client";

import { useId, useState, useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "motion/react";
import { CreditCard } from "lucide-react";

/* Card input: a payment card field group that formats and validates locally (brand by prefix, Luhn check, expiry and CVC masks); it only reports values to onChange and never sends them anywhere. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const spring = { type: "spring", stiffness: 480, damping: 34 } as const;

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export type CardBrand = "visa" | "mastercard" | "amex" | "discover" | "unknown";

const digitsOf = (s: string) => s.replace(/\D/g, "");

export function detectBrand(input: string): CardBrand {
  const d = digitsOf(input);
  if (/^4/.test(d)) return "visa";
  const four = Number(d.slice(0, 4));
  if (/^5[1-5]/.test(d) || (d.length >= 4 && four >= 2221 && four <= 2720)) return "mastercard";
  if (/^3[47]/.test(d)) return "amex";
  if (/^(6011|65|64[4-9])/.test(d)) return "discover";
  return "unknown";
}

export const BRAND_LABEL: Record<CardBrand, string> = { visa: "Visa", mastercard: "Mastercard", amex: "Amex", discover: "Discover", unknown: "Card" };

export function cvcLength(brand: CardBrand): number {
  return brand === "amex" ? 4 : 3;
}

export function maxCardDigits(brand: CardBrand): number {
  return brand === "amex" ? 15 : 16;
}

export function formatCardNumber(input: string): string {
  const brand = detectBrand(input);
  const d = digitsOf(input).slice(0, maxCardDigits(brand));
  const groups = brand === "amex" ? [4, 6, 5] : [4, 4, 4, 4];
  const parts: string[] = [];
  let at = 0;
  for (const size of groups) {
    if (at >= d.length) break;
    parts.push(d.slice(at, at + size));
    at += size;
  }
  return parts.join(" ");
}

export function luhnValid(input: string): boolean {
  const d = digitsOf(input);
  if (d.length < 12) return false;
  let sum = 0;
  for (let i = 0; i < d.length; i++) {
    let n = Number(d[d.length - 1 - i]);
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return sum % 10 === 0;
}

export function formatExpiry(input: string): string {
  let d = digitsOf(input).slice(0, 4);
  if (d.length >= 1 && Number(d[0]) > 1) d = `0${d}`.slice(0, 4);
  if (d.length >= 2 && Number(d.slice(0, 2)) > 12) d = `12${d.slice(2)}`;
  return d.length > 2 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d;
}

export function expiryValid(input: string, now: Date = new Date()): boolean {
  const d = digitsOf(input);
  if (d.length !== 4) return false;
  const month = Number(d.slice(0, 2));
  const year = 2000 + Number(d.slice(2));
  if (month < 1 || month > 12) return false;
  return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);
}

export interface CardValue {
  number: string;
  expiry: string;
  cvc: string;
  brand: CardBrand;
  valid: boolean;
}

export interface CardInputProps {
  onChange?: (value: CardValue) => void;
  className?: string;
}

const field = `h-11 w-full bg-transparent px-3 text-sm tabular-nums text-fg placeholder:text-fg-subtle ${ring} rounded-[12px]`;

export function CardInput({ onChange, className = "" }: CardInputProps) {
  const id = useId();
  const reduce = useReduce();
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [touched, setTouched] = useState({ number: false, expiry: false, cvc: false });
  const brand = detectBrand(number);

  const emit = (n: string, e: string, c: string) => {
    const b = detectBrand(n);
    onChange?.({ number: digitsOf(n), expiry: e, cvc: c, brand: b, valid: luhnValid(n) && expiryValid(e) && c.length === cvcLength(b) });
  };

  const numberBad = touched.number && !luhnValid(number);
  const expiryBad = touched.expiry && !expiryValid(expiry);
  const cvcBad = touched.cvc && cvc.length !== cvcLength(brand);
  const touch = (key: keyof typeof touched) => setTouched((t) => ({ ...t, [key]: true }));
  const invalidRing = (bad: boolean) => `transition-shadow duration-200 ${bad ? "shadow-[inset_0_0_0_1.5px_var(--danger)]" : ""}`;

  return (
    <div role="group" aria-label="Payment card" className={`w-80 ${className}`}>
      <div className="grid gap-px rounded-[14px] bg-track shadow-[var(--shadow-card)]">
        <div className={`relative overflow-hidden rounded-t-[14px] bg-surface ${invalidRing(numberBad)}`}>
          <label htmlFor={`${id}-n`} className="sr-only">Card number</label>
          <input id={`${id}-n`} inputMode="numeric" autoComplete="cc-number" placeholder="Card number" aria-invalid={numberBad} value={number} onBlur={() => touch("number")} onChange={(e) => { const v = formatCardNumber(e.target.value); setNumber(v); emit(v, expiry, cvc); }} className={`${field} pr-24`} />
          <span className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5 text-xs text-fg-muted">
            <motion.span key={`i-${brand}`} aria-hidden className="flex" initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6, rotate: -12 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 0.2 }}>
              <CreditCard className={`size-4 transition-colors ${brand === "unknown" ? "" : "text-[var(--select)]"}`} aria-hidden />
            </motion.span>
            <motion.span key={`l-${brand}`} aria-live="polite" initial={{ opacity: 0, y: reduce ? 0 : 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.16 }}>{BRAND_LABEL[brand]}</motion.span>
          </span>
        </div>
        <div className="grid grid-cols-2 gap-px">
          <div className={`rounded-bl-[14px] bg-surface ${invalidRing(expiryBad)}`}>
            <label htmlFor={`${id}-e`} className="sr-only">Expiry date</label>
            <input id={`${id}-e`} inputMode="numeric" autoComplete="cc-exp" placeholder="MM / YY" aria-invalid={expiryBad} value={expiry} onBlur={() => touch("expiry")} onChange={(e) => { const v = formatExpiry(e.target.value); setExpiry(v); emit(number, v, cvc); }} className={field} />
          </div>
          <div className={`rounded-br-[14px] bg-surface ${invalidRing(cvcBad)}`}>
            <label htmlFor={`${id}-c`} className="sr-only">Security code</label>
            <input id={`${id}-c`} inputMode="numeric" autoComplete="cc-csc" placeholder={brand === "amex" ? "CVC (4 digits)" : "CVC"} aria-invalid={cvcBad} value={cvc} onBlur={() => touch("cvc")} onChange={(e) => { const v = digitsOf(e.target.value).slice(0, cvcLength(brand)); setCvc(v); emit(number, expiry, v); }} className={field} />
          </div>
        </div>
      </div>
      <p role="status" className="mt-2 min-h-4 text-xs text-danger-text">
        <motion.span key={numberBad ? "n" : expiryBad ? "e" : cvcBad ? "c" : "ok"} className="inline-block" initial={reduce ? false : { opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
          {numberBad ? "Check the card number." : expiryBad ? "Check the expiry date." : cvcBad ? "Check the security code." : ""}
        </motion.span>
      </p>
    </div>
  );
}
