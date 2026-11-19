"use client";

import { DonutChart } from "../../registry/ui/donut-chart";

/* LLM ops cost by provider: a card (1/2 or 1/3 width of 12 columns) with a donut of spend split across model providers; hover or pick a slice to read its amount and share. */

export interface ProviderCost {
  provider: string;
  costUsd: number;
}

export const DEMO_PROVIDER_COSTS: ProviderCost[] = [
  { provider: "Northwind AI", costUsd: 6240 },
  { provider: "Lumen Labs", costUsd: 3980 },
  { provider: "Orbital Models", costUsd: 1860 },
  { provider: "Self-hosted", costUsd: 925 },
];

export interface LlmOpsCostByProviderProps {
  items?: ProviderCost[];
  period?: string;
  className?: string;
}

export function LlmOpsCostByProvider({ items = DEMO_PROVIDER_COSTS, period = "November", className = "" }: LlmOpsCostByProviderProps) {
  return (
    <section aria-label="Cost by provider" className={`@container ${className}`}>
      <DonutChart
        title="Cost by provider"
        description={period}
        totalLabel="Total spend"
        slices={items.map((i) => ({ label: i.provider, value: i.costUsd }))}
        format={(v) => `$${Math.round(v).toLocaleString("en-US")}`}
        className="w-full"
      />
    </section>
  );
}
