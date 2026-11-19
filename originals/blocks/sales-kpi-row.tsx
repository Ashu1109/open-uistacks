"use client";

import { StatCard, type StatCardProps } from "../../registry/ui/stat-card";

/* Sales KPI row: four stat cards (revenue, win rate, pipeline, sales cycle length) with period trends; a full-width row that is 4 across when its container is wide, 2 by 2 when medium, stacked when narrow. */

export interface SalesKpi extends Omit<StatCardProps, "className"> {
  id: string;
}

const months = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];

export const DEMO_KPIS: SalesKpi[] = [
  {
    id: "revenue", label: "Revenue", value: 1_284_000, format: (v) => `$${Math.round(v).toLocaleString("en-US")}`, delta: 12.4, goodDirection: "up",
    comparison: "vs October", data: [820, 910, 880, 1010, 1140, 1284], previous: [760, 800, 850, 840, 960, 1050], labels: months,
  },
  {
    id: "win-rate", label: "Win rate", value: 31.5, format: (v) => `${v.toFixed(1)}%`, delta: 2.1, deltaLabel: "2.1 pts", goodDirection: "up",
    comparison: "vs October", data: [26, 27, 29, 28, 30, 31.5], previous: [25, 26, 26, 27, 28, 29.4], labels: months,
  },
  {
    id: "pipeline", label: "Open pipeline", value: 9_870_000, format: (v) => `$${Math.round(v).toLocaleString("en-US")}`, delta: -3.8, goodDirection: "up",
    comparison: "vs October", data: [10.4, 10.9, 10.2, 10.6, 10.3, 9.87], previous: [9.1, 9.6, 9.9, 10.1, 10.0, 10.26], labels: months,
  },
  {
    id: "cycle", label: "Sales cycle", value: 38, format: (v) => `${Math.round(v)} days`, delta: -4.5, deltaLabel: "2 days", goodDirection: "down",
    comparison: "vs October", data: [46, 44, 43, 41, 40, 38], previous: [48, 47, 46, 45, 43, 42], labels: months,
  },
];

export interface SalesKpiRowProps {
  kpis?: SalesKpi[];
  className?: string;
}

export function SalesKpiRow({ kpis = DEMO_KPIS, className = "" }: SalesKpiRowProps) {
  return (
    <section aria-label="Sales KPIs" className={`@container ${className}`}>
      <ul className="grid grid-cols-1 gap-3 @[480px]:grid-cols-2 @[960px]:grid-cols-4">
        {kpis.map(({ id, ...card }) => (
          <li key={id} className="min-w-0">
            <StatCard {...card} />
          </li>
        ))}
      </ul>
    </section>
  );
}
