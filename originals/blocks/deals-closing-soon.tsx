"use client";

import { CalendarClock } from "lucide-react";
import { DEMO_DEALS, DEMO_NOW, formatDay, formatMoney, type Deal } from "./deal-pipeline-board";

/* Deals closing soon: a half-width card listing open deals whose close date falls inside the next few days, soonest first, with the value at stake. */

const DAY_MS = 86_400_000;

export interface ClosingDeal extends Deal {
  daysLeft: number;
}

export function daysUntil(closeOn: string, now: string): number {
  return Math.round((Date.parse(closeOn) - Date.parse(now.slice(0, 10))) / DAY_MS);
}

/** Deals due within `days` days (overdue ones included), soonest first. */
export function closingSoon(deals: readonly Deal[], now: string, days: number): ClosingDeal[] {
  return deals
    .map((d) => ({ ...d, daysLeft: daysUntil(d.closeOn, now) }))
    .filter((d) => d.daysLeft <= days)
    .sort((a, b) => a.daysLeft - b.daysLeft || b.amountMinor - a.amountMinor);
}

export function dueLabel(daysLeft: number): string {
  if (daysLeft < 0) return `${-daysLeft}d overdue`;
  if (daysLeft === 0) return "Today";
  if (daysLeft === 1) return "Tomorrow";
  return `In ${daysLeft} days`;
}

export interface DealsClosingSoonProps {
  deals?: Deal[];
  /** Reference day, YYYY-MM-DD. */
  now?: string;
  days?: number;
  currency?: string;
  onOpenDeal?: (dealId: string) => void;
  className?: string;
}

export function DealsClosingSoon({ deals = DEMO_DEALS, now = DEMO_NOW, days = 7, currency = "USD", onOpenDeal, className = "" }: DealsClosingSoonProps) {
  const list = closingSoon(deals, now, days);
  const total = list.reduce((sum, d) => sum + d.amountMinor, 0);
  return (
    <section aria-label="Deals closing soon" className={`@container rounded-[20px] bg-surface p-4 shadow-[var(--shadow-card)] ${className}`}>
      <header className="flex items-start justify-between gap-3 pb-3">
        <div>
          <h2 className="text-[15px] font-semibold text-fg">Closing soon</h2>
          <p className="text-[13px] text-fg-muted">Next {days} days</p>
        </div>
        <p className="text-right text-sm font-semibold tabular-nums text-fg">{formatMoney(total, currency)}</p>
      </header>
      {list.length === 0 ? (
        <p className="py-6 text-center text-sm text-fg-muted">Nothing closes in the next {days} days.</p>
      ) : (
        <ul className="grid gap-1">
          {list.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                onClick={() => onOpenDeal?.(d.id)}
                className="flex w-full items-center gap-3 rounded-[12px] px-2 py-2 text-left outline-none hover:bg-[color-mix(in_srgb,var(--fg)_4%,var(--surface))] focus-visible:ring-2 focus-visible:ring-[var(--select)]"
              >
                <span className={`grid size-8 shrink-0 place-items-center rounded-full ${d.daysLeft <= 1 ? "bg-warning-soft text-warning-text" : "bg-subtle text-fg-muted"}`}>
                  <CalendarClock size={15} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-fg">{d.name}</span>
                  <span className="block truncate text-xs text-fg-muted">{d.company}, {formatDay(d.closeOn)}, {dueLabel(d.daysLeft)}</span>
                </span>
                <span className="text-sm font-medium tabular-nums text-fg">{formatMoney(d.amountMinor, currency)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
