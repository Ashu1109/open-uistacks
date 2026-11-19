"use client";

import { useState } from "react";
import { ArrowLeftRight, Hexagon, LineChart, Wallet } from "lucide-react";
import { AppShell } from "../blocks/app-shell";
import { TreasuryOverview } from "../blocks/treasury-overview";
import { BalanceCard } from "../ui/balance-card";
import { PortfolioChart } from "../ui/portfolio-chart";
import { TransactionList, type Transaction } from "../ui/transaction-list";
import { Watchlist, type WatchItem } from "../ui/watchlist";
import { Candlestick, type Candle } from "../ui/candlestick";
import { SwapCard, type SwapAsset, type SwapRequest } from "../ui/swap-card";

/* Stacks Crypto template: a digital-asset portfolio screen with invented assets; Portfolio (balance, value chart, activity, reserves) and Markets (candles, watchlist, swap form) views. Display only; Swap reports a request through a callback. */

const SECTIONS = [{ items: [{ id: "portfolio", label: "Portfolio", icon: <Wallet size={16} aria-hidden /> }, { id: "markets", label: "Markets", icon: <LineChart size={16} aria-hidden /> }] }];

const wave = (base: number, amp: number, n: number, drift: number) => Array.from({ length: n }, (_, i) => Math.round(base + drift * i + Math.sin(i * 0.9) * amp));

const RANGES = [
  { id: "1w", label: "1W", values: wave(41200, 900, 14, 60) },
  { id: "1m", label: "1M", values: wave(38000, 1400, 30, 120) },
  { id: "1y", label: "1Y", values: wave(22000, 2600, 52, 380) },
];

const WATCH: WatchItem[] = [
  { symbol: "LMN", name: "Lumen", price: 184_250, changePct: 3.42, series: wave(170, 6, 12, 1.2) },
  { symbol: "ORB", name: "Orbital", price: 6_120, changePct: -1.87, series: wave(65, 3, 12, -0.4) },
  { symbol: "KLP", name: "Kelp", price: 92, changePct: 0.65, series: wave(90, 2, 12, 0.1) },
  { symbol: "VTX", name: "Vertex", price: 1_048_300, changePct: 5.1, series: wave(900, 40, 12, 12) },
];

const CANDLES: Candle[] = Array.from({ length: 24 }, (_, i) => {
  const open = 180 + Math.sin(i * 0.6) * 12 + i * 0.4;
  const close = open + Math.cos(i * 1.3) * 6;
  return { label: `D${i + 1}`, open: Math.round(open * 100) / 100, close: Math.round(close * 100) / 100, high: Math.round((Math.max(open, close) + 4) * 100) / 100, low: Math.round((Math.min(open, close) - 4) * 100) / 100 };
});

const ACTIVITY: Transaction[] = [
  { id: "t1", title: "Bought Lumen", subtitle: "12.5 LMN", amount: -230_000, date: "2026-11-17", status: "completed" },
  { id: "t2", title: "Staking reward", subtitle: "Vertex", amount: 4_850, date: "2026-11-17", status: "completed" },
  { id: "t3", title: "Sold Orbital", subtitle: "300 ORB", amount: 183_600, date: "2026-11-15", status: "pending" },
];

const LMN: SwapAsset = { symbol: "LMN", name: "Lumen", decimals: 6 };
const USDS: SwapAsset = { symbol: "USDS", name: "Stable dollar", decimals: 2 };

const RESERVES = [{ name: "Cold storage", balance: 31_200_000 }, { name: "Exchange float", balance: 4_150_000 }, { name: "Stable reserve", balance: 8_900_000 }];

export interface StacksCryptoProps {
  onSwap?: (request: SwapRequest) => void;
  className?: string;
}

export function StacksCrypto({ onSwap, className = "" }: StacksCryptoProps) {
  const [view, setView] = useState("portfolio");
  return (
    <AppShell
      className={className}
      product={{ name: "Stacks Crypto", mark: <span className="grid size-8 place-items-center rounded-[10px] bg-select text-[var(--inverse-fg)]"><Hexagon size={16} aria-hidden /></span> }}
      sections={SECTIONS}
      activeId={view}
      onNavigate={setView}
      title={view === "portfolio" ? "Portfolio" : "Markets"}
      subtitle="Sample data, not live prices"
      actions={<span className="inline-flex items-center gap-1.5 text-[13px] text-fg-muted"><ArrowLeftRight size={14} aria-hidden />Demo account</span>}
    >
      {view === "portfolio" ? (
        <div className="@container grid gap-4 @[900px]:grid-cols-12">
          <BalanceCard className="@[900px]:col-span-4" label="Total balance" balance={4_218_600} change={142_300} changeLabel="this week" history={RANGES[0].values} />
          <PortfolioChart className="@[900px]:col-span-8" ranges={RANGES} defaultRange="1m" />
          <TreasuryOverview className="@[900px]:col-span-6" accounts={RESERVES} />
          <div className="rounded-[20px] bg-surface p-4 shadow-[var(--shadow-card)] @[900px]:col-span-6">
            <h2 className="mb-2 text-[15px] font-semibold text-fg">Activity</h2>
            <TransactionList items={ACTIVITY} now={new Date("2026-11-18T12:00:00")} />
          </div>
        </div>
      ) : (
        <div className="@container grid gap-4 @[900px]:grid-cols-12">
          <div className="rounded-[20px] bg-surface p-4 shadow-[var(--shadow-card)] @[900px]:col-span-8">
            <Candlestick data={CANDLES} label="Lumen daily price" />
          </div>
          <SwapCard className="@[900px]:col-span-4" from={LMN} to={USDS} rate={184.25} balance={12_500_000} feeBps={30} onSwap={onSwap} />
          <div className="rounded-[20px] bg-surface p-4 shadow-[var(--shadow-card)] @[900px]:col-span-12">
            <Watchlist items={WATCH} />
          </div>
        </div>
      )}
    </AppShell>
  );
}
