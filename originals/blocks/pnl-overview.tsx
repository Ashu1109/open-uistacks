"use client";

import { formatMoney } from "../ui/balance-card";
import { CountUp } from "../ui/chart-utils";

/* P&L overview: a full-width profit-and-loss section; revenue, expenses and net margin for a period against the previous one, plus expenses by category as proportional bars. Pure display; all money is integer minor units. */

export interface PnlCategory {
  name: string;
  /** Minor units. */
  amount: number;
  /** Same category in the previous period, for the delta. */
  previous?: number;
}

export interface PnlOverviewProps {
  period?: string;
  previousPeriodLabel?: string;
  /** Minor units. */
  revenue?: number;
  previousRevenue?: number;
  expenses?: PnlCategory[];
  currency?: string;
  locale?: string;
  className?: string;
}

const DEMO_EXPENSES: PnlCategory[] = [
  { name: "Payroll", amount: 4_820_000, previous: 4_650_000 },
  { name: "Rent and utilities", amount: 1_260_000, previous: 1_260_000 },
  { name: "Software", amount: 612_000, previous: 540_000 },
  { name: "Marketing", amount: 905_000, previous: 1_120_000 },
  { name: "Supplies", amount: 348_000, previous: 301_000 },
];

export const sumAmounts = (items: { amount: number }[]) => items.reduce((s, i) => s + i.amount, 0);

/** Net margin as a percentage with one decimal; 0 when there is no revenue. */
export const netMargin = (revenue: number, expenses: number) => (revenue <= 0 ? 0 : Math.round(((revenue - expenses) / revenue) * 1000) / 10);

/** Percent change from `previous` to `current`; null when there is no baseline. */
export const percentDelta = (current: number, previous: number | undefined) => (previous === undefined || previous === 0 ? null : Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10);

function Delta({ value, goodWhenUp }: { value: number | null; goodWhenUp: boolean }) {
  if (value === null) return null;
  const good = value === 0 ? null : value > 0 === goodWhenUp;
  const tone = good === null ? "text-fg-muted" : good ? "text-success-text" : "text-danger-text";
  return <span className={`text-xs tabular-nums ${tone}`}>{value > 0 ? "+" : ""}{value}%</span>;
}

export function PnlOverview({ period = "October 2026", previousPeriodLabel = "September", revenue = 9_450_000, previousRevenue = 8_900_000, expenses = DEMO_EXPENSES, currency = "USD", locale = "en-US", className = "" }: PnlOverviewProps) {
  const totalExpenses = sumAmounts(expenses);
  const previousExpenses = expenses.every((e) => e.previous !== undefined) ? expenses.reduce((s, e) => s + (e.previous ?? 0), 0) : undefined;
  const profit = revenue - totalExpenses;
  const margin = netMargin(revenue, totalExpenses);
  const previousMargin = previousExpenses === undefined || previousRevenue === undefined ? null : netMargin(previousRevenue, previousExpenses);
  const max = Math.max(1, ...expenses.map((e) => e.amount));
  const money = (n: number) => formatMoney(n, currency, locale);
  const stats = [
    { label: "Revenue", value: money(revenue), delta: percentDelta(revenue, previousRevenue), goodWhenUp: true },
    { label: "Expenses", value: money(totalExpenses), delta: percentDelta(totalExpenses, previousExpenses), goodWhenUp: false },
    { label: "Net profit", value: money(profit), delta: percentDelta(profit, previousRevenue === undefined || previousExpenses === undefined ? undefined : previousRevenue - previousExpenses), goodWhenUp: true },
  ];

  return (
    <section aria-label="Profit and loss" className={`@container rounded-[20px] bg-surface p-4 shadow-[var(--shadow-card)] @[640px]:p-5 ${className}`}>
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[15px] font-semibold text-fg">Profit and loss</h2>
        <p className="text-[13px] text-fg-muted">{period} vs {previousPeriodLabel}</p>
      </header>
      <dl className="mt-4 grid gap-3 @[640px]:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-[14px] bg-subtle/60 p-3.5">
            <dt className="text-xs text-fg-muted">{s.label}</dt>
            <dd className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5"><span className="text-xl font-semibold tabular-nums text-fg"><CountUp text={String(s.value)} /></span><Delta value={s.delta} goodWhenUp={s.goodWhenUp} /></dd>
          </div>
        ))}
        <div className="rounded-[14px] bg-subtle/60 p-3.5">
          <dt className="text-xs text-fg-muted">Net margin</dt>
          <dd className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5"><span className="text-xl font-semibold tabular-nums text-fg"><CountUp text={`${margin}%`} /></span>{previousMargin !== null && <span className="text-xs tabular-nums text-fg-muted">was {previousMargin}%</span>}</dd>
        </div>
      </dl>
      <h3 className="mt-5 text-[13px] font-medium text-fg-muted">Expenses by category</h3>
      <ul className="mt-3 grid gap-3">
        {expenses.map((e) => (
          <li key={e.name} className="grid gap-1.5">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-fg">{e.name}</span>
              <span className="flex items-baseline gap-2"><Delta value={percentDelta(e.amount, e.previous)} goodWhenUp={false} /><span className="tabular-nums text-fg">{money(e.amount)}</span></span>
            </div>
            <div role="img" aria-label={`${e.name}: ${Math.round((e.amount / totalExpenses) * 100)}% of expenses`} className="h-2 overflow-hidden rounded-full bg-track">
              <div className="h-full rounded-full bg-[var(--series-1)]" style={{ width: `${(e.amount / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
