"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { formatMoney, sparklinePath } from "./balance-card";

/* Watchlist: tracked assets with price, percent change and a sparkline, sortable by name or change, with optional remove and select. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface WatchItem {
  symbol: string;
  name: string;
  /** Minor units. */
  price: number;
  /** Percent change, 1.25 means +1.25 %. */
  changePct: number;
  series?: number[];
}

export type WatchSort = "default" | "name" | "change";

export function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${Math.abs(value).toFixed(2)}%`;
}

export function sortWatchlist(items: WatchItem[], sort: WatchSort): WatchItem[] {
  if (sort === "name") return [...items].sort((a, b) => a.name.localeCompare(b.name));
  if (sort === "change") return [...items].sort((a, b) => b.changePct - a.changePct);
  return [...items];
}

export interface WatchlistProps {
  items: WatchItem[];
  currency?: string;
  locale?: string;
  onRemove?: (symbol: string) => void;
  onSelect?: (item: WatchItem) => void;
  className?: string;
}

const SORTS: { id: WatchSort; label: string }[] = [
  { id: "default", label: "Added" },
  { id: "name", label: "Name" },
  { id: "change", label: "Change" },
];

export function Watchlist({ items, currency = "USD", locale = "en-US", onRemove, onSelect, className = "" }: WatchlistProps) {
  const [sort, setSort] = useState<WatchSort>("default");
  const rows = sortWatchlist(items, sort);

  return (
    <div className={`w-full max-w-md rounded-[20px] bg-surface p-3 shadow-[var(--shadow-card)] ${className}`}>
      <div className="flex items-center justify-between px-2 pb-2">
        <h3 className="text-sm font-medium text-fg">Watchlist</h3>
        <div role="group" aria-label="Sort by" className="flex rounded-full bg-subtle p-0.5">
          {SORTS.map((s) => (
            <button key={s.id} type="button" aria-pressed={sort === s.id} onClick={() => setSort(s.id)} className={`rounded-full px-2.5 py-1 text-xs transition-colors ${sort === s.id ? "bg-surface text-fg shadow-[var(--shadow-hairline)]" : "text-fg-muted hover:text-fg"} ${ring}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="px-2 py-6 text-center text-sm text-fg-muted">Nothing on your watchlist</p>
      ) : (
        <ul>
          {rows.map((item) => {
            const up = item.changePct >= 0;
            const body = (
              <>
                <span className="min-w-0 flex-1 text-left">
                  <span className="block text-sm font-medium text-fg">{item.symbol}</span>
                  <span className="block truncate text-xs text-fg-muted">{item.name}</span>
                </span>
                {item.series && (
                  <svg width={64} height={24} viewBox="0 0 64 24" aria-hidden>
                    <path d={sparklinePath(item.series, 64, 24)} fill="none" stroke={up ? "var(--success)" : "var(--danger)"} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                <span className="w-20 text-right">
                  <span className="block text-sm tabular-nums text-fg">{formatMoney(item.price, currency, locale)}</span>
                  <span className={`block text-xs tabular-nums ${up ? "text-success-text" : "text-danger-text"}`}>{formatPercent(item.changePct)}</span>
                </span>
              </>
            );
            return (
              <li key={item.symbol} className="group flex items-center gap-1 rounded-[12px] hover:bg-[color-mix(in_srgb,var(--fg)_4%,var(--surface))]">
                {onSelect ? (
                  <button type="button" onClick={() => onSelect(item)} className={`flex min-w-0 flex-1 items-center gap-3 rounded-[12px] px-2 py-2.5 ${ring}`}>{body}</button>
                ) : (
                  <div className="flex min-w-0 flex-1 items-center gap-3 px-2 py-2.5">{body}</div>
                )}
                {onRemove && (
                  <button type="button" aria-label={`Remove ${item.symbol}`} onClick={() => onRemove(item.symbol)} className={`grid size-7 shrink-0 place-items-center rounded-full text-fg-subtle opacity-0 transition-opacity hover:bg-subtle hover:text-fg focus-visible:opacity-100 group-hover:opacity-100 ${ring}`}>
                    <X size={14} aria-hidden />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
