"use client";

import { Fragment } from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { formatMoney } from "./balance-card";

/* Transaction list: payments grouped under day headings (Today, Yesterday, then dates) with signed amounts, a pending badge and optional row selection. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface Transaction {
  id: string;
  title: string;
  subtitle?: string;
  /** Signed minor units: negative is money out. */
  amount: number;
  /** ISO date or date-time. */
  date: string;
  status?: "completed" | "pending" | "failed";
}

export interface TransactionGroup {
  key: string;
  label: string;
  items: Transaction[];
  /** Net of the day in minor units. */
  net: number;
}

export function toLocalDate(iso: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(iso);
}

const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function dayLabel(date: Date, now: Date, locale = "en-US"): string {
  const key = dayKey(date);
  if (key === dayKey(now)) return "Today";
  if (key === dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1))) return "Yesterday";
  return new Intl.DateTimeFormat(locale, { weekday: "short", month: "short", day: "numeric" }).format(date);
}

/** Newest day first, newest transaction first within a day. */
export function groupTransactions(items: Transaction[], now = new Date(), locale = "en-US"): TransactionGroup[] {
  const sorted = [...items].sort((a, b) => toLocalDate(b.date).getTime() - toLocalDate(a.date).getTime());
  const groups = new Map<string, TransactionGroup>();
  for (const item of sorted) {
    const date = toLocalDate(item.date);
    const key = dayKey(date);
    const group = groups.get(key) ?? { key, label: dayLabel(date, now, locale), items: [], net: 0 };
    groups.set(key, { ...group, items: [...group.items, item], net: group.net + item.amount });
  }
  return [...groups.values()];
}

export interface TransactionListProps {
  items: Transaction[];
  currency?: string;
  locale?: string;
  /** Makes rows buttons. */
  onSelect?: (item: Transaction) => void;
  emptyText?: string;
  /** Reference "now" for Today/Yesterday labels. */
  now?: Date;
  className?: string;
}

export function TransactionList({ items, currency = "USD", locale = "en-US", onSelect, emptyText = "No transactions yet", now, className = "" }: TransactionListProps) {
  if (items.length === 0) return <p className={`rounded-[16px] bg-subtle px-4 py-8 text-center text-sm text-fg-muted ${className}`}>{emptyText}</p>;
  const groups = groupTransactions(items, now, locale);

  return (
    <div className={`w-full max-w-md rounded-[20px] bg-surface p-2 shadow-[var(--shadow-card)] ${className}`}>
      {groups.map((group) => (
        <section key={group.key} aria-label={group.label}>
          <div className="flex items-baseline justify-between px-3 pb-1 pt-3">
            <h4 className="text-xs font-medium uppercase tracking-wide text-fg-subtle">{group.label}</h4>
            <span className="text-xs tabular-nums text-fg-subtle">{formatMoney(group.net, currency, locale, true)}</span>
          </div>
          <ul>
            {group.items.map((item) => {
              const incoming = item.amount > 0;
              const body = (
                <Fragment>
                  <span className={`grid size-9 shrink-0 place-items-center rounded-full ${incoming ? "bg-success-soft text-success-text" : "bg-subtle text-fg-muted"}`}>
                    {incoming ? <ArrowDownLeft size={16} aria-hidden /> : <ArrowUpRight size={16} aria-hidden />}
                  </span>
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block truncate text-sm font-medium text-fg">{item.title}</span>
                    {item.subtitle && <span className="block truncate text-xs text-fg-muted">{item.subtitle}</span>}
                  </span>
                  <span className="text-right">
                    <span className={`block text-sm font-medium tabular-nums ${incoming ? "text-success-text" : item.status === "failed" ? "text-danger-text line-through" : "text-fg"}`}>{formatMoney(item.amount, currency, locale, true)}</span>
                    {item.status && item.status !== "completed" && (
                      <span className={`block text-[11px] ${item.status === "failed" ? "text-danger-text" : "text-warning-text"}`}>{item.status === "failed" ? "Failed" : "Pending"}</span>
                    )}
                  </span>
                </Fragment>
              );
              const row = "flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5";
              return (
                <li key={item.id}>
                  {onSelect ? (
                    <button type="button" onClick={() => onSelect(item)} className={`${row} transition-colors hover:bg-[color-mix(in_srgb,var(--fg)_4%,var(--surface))] ${ring}`}>{body}</button>
                  ) : (
                    <div className={row}>{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
