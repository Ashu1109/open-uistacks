"use client";

import { formatMoney } from "../ui/balance-card";
import { CountUp } from "../ui/chart-utils";

/* Treasury overview: a 1/2-width card (or full width) showing cash across accounts, runway in months from the monthly burn, and inflows against outflows for recent months as paired bars. Display only; money is integer minor units. */

export interface TreasuryAccount {
  name: string;
  /** Minor units. */
  balance: number;
}

export interface TreasuryFlow {
  label: string;
  inflow: number;
  outflow: number;
}

export interface TreasuryOverviewProps {
  accounts?: TreasuryAccount[];
  flows?: TreasuryFlow[];
  currency?: string;
  locale?: string;
  className?: string;
}

const DEMO_ACCOUNTS: TreasuryAccount[] = [
  { name: "Operating checking", balance: 18_420_000 },
  { name: "Tax reserve", balance: 6_150_000 },
  { name: "High-yield savings", balance: 24_000_000 },
];

const DEMO_FLOWS: TreasuryFlow[] = [
  { label: "Jun", inflow: 8_100_000, outflow: 7_400_000 },
  { label: "Jul", inflow: 7_600_000, outflow: 7_900_000 },
  { label: "Aug", inflow: 8_800_000, outflow: 7_700_000 },
  { label: "Sep", inflow: 8_900_000, outflow: 8_200_000 },
  { label: "Oct", inflow: 9_450_000, outflow: 7_945_000 },
];

export const totalCash = (accounts: TreasuryAccount[]) => accounts.reduce((s, a) => s + a.balance, 0);

/** Average monthly net outflow across the flows; 0 when cash is growing. */
export function monthlyBurn(flows: TreasuryFlow[]): number {
  if (flows.length === 0) return 0;
  const net = flows.reduce((s, f) => s + f.outflow - f.inflow, 0) / flows.length;
  return Math.max(0, Math.round(net));
}

/** Months of cash left at the burn rate; null when there is no burn (runway is unbounded). */
export function runwayMonths(cash: number, burn: number): number | null {
  return burn <= 0 ? null : Math.round((cash / burn) * 10) / 10;
}

export function TreasuryOverview({ accounts = DEMO_ACCOUNTS, flows = DEMO_FLOWS, currency = "USD", locale = "en-US", className = "" }: TreasuryOverviewProps) {
  const cash = totalCash(accounts);
  const burn = monthlyBurn(flows);
  const runway = runwayMonths(cash, burn);
  const max = Math.max(1, ...flows.flatMap((f) => [f.inflow, f.outflow]));
  const money = (n: number) => formatMoney(n, currency, locale);

  return (
    <section aria-label="Treasury" className={`@container rounded-[20px] bg-surface p-4 shadow-[var(--shadow-card)] @[480px]:p-5 ${className}`}>
      <h2 className="text-[15px] font-semibold text-fg">Treasury</h2>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <p className="text-xs text-fg-muted">Total cash</p>
          <p className="text-2xl font-semibold tabular-nums text-fg"><CountUp text={money(cash)} /></p>
        </div>
        <div className="text-right">
          <p className="text-xs text-fg-muted">Runway</p>
          <p className="text-lg font-semibold tabular-nums text-fg"><CountUp text={runway === null ? "Cash positive" : `${runway} months`} /></p>
        </div>
      </div>
      <ul aria-label="Accounts" className="mt-4 grid gap-2">
        {accounts.map((a) => (
          <li key={a.name} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-fg-muted">{a.name}</span>
            <span className="tabular-nums text-fg">{money(a.balance)}</span>
          </li>
        ))}
      </ul>
      <h3 className="mt-5 flex items-center justify-between text-[13px] font-medium text-fg-muted">
        Inflows and outflows
        <span className="flex gap-3 text-xs font-normal"><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-[var(--success)]" />In</span><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-[var(--danger)]" />Out</span></span>
      </h3>
      <ul className="mt-3 flex h-28 items-end gap-3">
        {flows.map((f) => (
          <li key={f.label} role="img" aria-label={`${f.label}: in ${money(f.inflow)}, out ${money(f.outflow)}`} className="flex h-full flex-1 flex-col justify-end gap-1">
            <div className="flex flex-1 items-end justify-center gap-1">
              <div className="w-full max-w-4 rounded-t-[4px] bg-[var(--success)]" style={{ height: `${(f.inflow / max) * 100}%` }} />
              <div className="w-full max-w-4 rounded-t-[4px] bg-[var(--danger)]" style={{ height: `${(f.outflow / max) * 100}%` }} />
            </div>
            <span className="text-center text-[11px] text-fg-subtle">{f.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
