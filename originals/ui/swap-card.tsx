"use client";

import { useId, useState } from "react";
import { ArrowDownUp } from "lucide-react";
import { parseMinor } from "./balance-card";

/* Swap card: a two-sided conversion form that turns an amount of one currency or asset into another at a given rate, with a flip button and a rate line. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface SwapAsset {
  symbol: string;
  name?: string;
  /** Decimal places of its minor unit. */
  decimals: number;
}

/** Converts minor units of the source into minor units of the target; `rate` is target per one source. */
export function convertMinor(amount: number, rate: number, from: SwapAsset, to: SwapAsset): number {
  if (!(rate > 0) || amount <= 0) return 0;
  return Math.round((amount / 10 ** from.decimals) * rate * 10 ** to.decimals);
}

export function formatAssetAmount(minor: number, asset: SwapAsset, locale = "en-US"): string {
  return new Intl.NumberFormat(locale, { minimumFractionDigits: asset.decimals, maximumFractionDigits: asset.decimals }).format(minor / 10 ** asset.decimals);
}

export interface SwapRequest {
  from: SwapAsset;
  to: SwapAsset;
  /** Minor units of `from`. */
  amount: number;
  /** Minor units of `to`. */
  receive: number;
}

export interface SwapCardProps {
  from: SwapAsset;
  to: SwapAsset;
  /** Units of `to` per one unit of `from`; flipping uses its inverse. */
  rate: number;
  /** Spendable amount of `from` in minor units; shows a Max button. */
  balance?: number;
  /** Fee in basis points taken from the received amount. */
  feeBps?: number;
  onSwap?: (request: SwapRequest) => void;
  locale?: string;
  className?: string;
}

export function SwapCard({ from, to, rate, balance, feeBps = 0, onSwap, locale = "en-US", className = "" }: SwapCardProps) {
  const uid = useId();
  const [flipped, setFlipped] = useState(false);
  const [text, setText] = useState("");
  const source = flipped ? to : from;
  const target = flipped ? from : to;
  const activeRate = flipped ? 1 / rate : rate;
  const amount = parseMinor(text, source.decimals) ?? 0;
  const gross = convertMinor(amount, activeRate, source, target);
  const receive = gross - Math.round((gross * feeBps) / 10_000);
  const tooMuch = !flipped && balance !== undefined && amount > balance;
  const rateText = `1 ${source.symbol} = ${new Intl.NumberFormat(locale, { maximumSignificantDigits: 6 }).format(activeRate)} ${target.symbol}`;

  return (
    <form
      aria-label={`Swap ${source.symbol} to ${target.symbol}`}
      onSubmit={(e) => {
        e.preventDefault();
        if (amount > 0 && !tooMuch) onSwap?.({ from: source, to: target, amount, receive });
      }}
      className={`w-full max-w-sm rounded-[20px] bg-surface p-3 shadow-[var(--shadow-card)] ${className}`}
    >
      <div className="rounded-[14px] bg-subtle p-4">
        <div className="flex items-center justify-between text-xs text-fg-muted">
          <label htmlFor={`${uid}-pay`}>You pay</label>
          {!flipped && balance !== undefined && (
            <button type="button" onClick={() => setText((balance / 10 ** source.decimals).toFixed(source.decimals))} className={`rounded px-1 tabular-nums hover:text-fg ${ring}`}>
              Max {formatAssetAmount(balance, source, locale)}
            </button>
          )}
        </div>
        <div className="mt-1 flex items-center gap-3">
          <input id={`${uid}-pay`} inputMode="decimal" placeholder="0.00" value={text} onChange={(e) => setText(e.target.value)} aria-invalid={tooMuch} className={`min-w-0 flex-1 bg-transparent text-2xl font-semibold tabular-nums text-fg placeholder:text-fg-subtle ${ring} rounded`} />
          <span className="rounded-full bg-surface px-3 py-1 text-sm font-medium text-fg shadow-[var(--shadow-hairline)]">{source.symbol}</span>
        </div>
      </div>
      <div className="relative z-10 -my-3 flex justify-center">
        <button type="button" aria-label="Flip direction" onClick={() => { setFlipped(!flipped); setText(""); }} className={`grid size-9 place-items-center rounded-full bg-surface text-fg-muted shadow-[var(--shadow-card)] transition-transform hover:text-fg active:scale-95 ${ring}`}>
          <ArrowDownUp size={16} aria-hidden />
        </button>
      </div>
      <div className="rounded-[14px] bg-subtle p-4 pt-5">
        <p className="text-xs text-fg-muted">You receive</p>
        <div className="mt-1 flex items-center gap-3">
          <output aria-label="You receive" className="min-w-0 flex-1 truncate text-2xl font-semibold tabular-nums text-fg">{formatAssetAmount(receive, target, locale)}</output>
          <span className="rounded-full bg-surface px-3 py-1 text-sm font-medium text-fg shadow-[var(--shadow-hairline)]">{target.symbol}</span>
        </div>
      </div>
      <p className="mt-3 flex justify-between px-1 text-xs tabular-nums text-fg-muted" aria-live="polite">
        <span>{rateText}</span>
        {feeBps > 0 && <span>Fee {(feeBps / 100).toFixed(2)}%</span>}
      </p>
      {tooMuch && <p role="alert" className="mt-1 px-1 text-xs text-danger-text">Amount is more than your balance</p>}
      <button type="submit" disabled={amount <= 0 || tooMuch} className={`mt-3 h-11 w-full rounded-[12px] bg-[image:var(--grad-primary)] text-sm font-medium text-[var(--inverse-fg)] shadow-[var(--shadow-btn-primary)] disabled:opacity-50 ${ring}`}>
        Swap
      </button>
    </form>
  );
}
