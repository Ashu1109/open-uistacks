"use client";

import { useState } from "react";
import { CalendarClock } from "lucide-react";
import { formatMoney } from "./balance-card";
import { toLocalDate } from "./transaction-list";

/* Recurring bills: upcoming subscriptions and bills sorted by due date, with a due-in label, an autopay switch per bill and a monthly total. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export type BillFrequency = "weekly" | "monthly" | "quarterly" | "yearly";

export interface Bill {
  id: string;
  name: string;
  /** Minor units per cycle. */
  amount: number;
  frequency: BillFrequency;
  /** ISO date of the next charge. */
  nextDue: string;
  autopay?: boolean;
}

const PER_MONTH: Record<BillFrequency, number> = { weekly: 52 / 12, monthly: 1, quarterly: 1 / 3, yearly: 1 / 12 };

export function monthlyEquivalent(amount: number, frequency: BillFrequency): number {
  return Math.round(amount * PER_MONTH[frequency]);
}

export function monthlyTotal(bills: Bill[]): number {
  return bills.reduce((sum, b) => sum + monthlyEquivalent(b.amount, b.frequency), 0);
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

export function daysUntil(iso: string, now = new Date()): number {
  return Math.round((startOfDay(toLocalDate(iso)) - startOfDay(now)) / 86_400_000);
}

export function dueLabel(days: number): string {
  if (days < -1) return `Overdue by ${-days} days`;
  if (days === -1) return "Overdue by 1 day";
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

export interface RecurringBillsProps {
  bills: Bill[];
  onAutopayChange?: (id: string, autopay: boolean) => void;
  currency?: string;
  locale?: string;
  now?: Date;
  className?: string;
}

export function RecurringBills({ bills, onAutopayChange, currency = "USD", locale = "en-US", now, className = "" }: RecurringBillsProps) {
  const [autopay, setAutopay] = useState<Record<string, boolean>>(() => Object.fromEntries(bills.map((b) => [b.id, Boolean(b.autopay)])));
  const sorted = [...bills].sort((a, b) => toLocalDate(a.nextDue).getTime() - toLocalDate(b.nextDue).getTime());
  const money = (n: number) => formatMoney(n, currency, locale);

  return (
    <div className={`w-full max-w-md rounded-[20px] bg-surface p-3 shadow-[var(--shadow-card)] ${className}`}>
      <div className="flex items-baseline justify-between px-2 pb-2">
        <h3 className="text-sm font-medium text-fg">Recurring bills</h3>
        <p className="text-xs tabular-nums text-fg-muted">{money(monthlyTotal(bills))} / month</p>
      </div>
      <ul>
        {sorted.map((bill) => {
          const days = daysUntil(bill.nextDue, now);
          const on = autopay[bill.id] ?? Boolean(bill.autopay);
          return (
            <li key={bill.id} className="flex items-center gap-3 rounded-[12px] px-2 py-2.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-subtle text-fg-muted"><CalendarClock size={16} aria-hidden /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-fg">{bill.name}</span>
                <span className={`block text-xs ${days < 0 ? "text-danger-text" : days <= 3 ? "text-warning-text" : "text-fg-muted"}`}>{dueLabel(days)} · {bill.frequency}</span>
              </span>
              <span className="text-sm tabular-nums text-fg">{money(bill.amount)}</span>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={`Autopay for ${bill.name}`}
                onClick={() => {
                  setAutopay({ ...autopay, [bill.id]: !on });
                  onAutopayChange?.(bill.id, !on);
                }}
                className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${on ? "bg-[var(--select)]" : "bg-track-strong"} ${ring}`}
              >
                <span className={`absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow transition-transform ${on ? "translate-x-4" : ""}`} />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
