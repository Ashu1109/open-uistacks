"use client";

import { useState } from "react";
import { StatCard } from "../../registry/ui/stat-card";
import { SegmentedControl } from "../ui/segmented-control";

/* LLM ops latency: a full-width or 1/2-width (6 of 12 columns) section with p50, p95 and p99 stat cards for either time to first token or total latency, each with a trend line against the previous period. */

export type LatencyMetric = "ttft" | "total";

export interface LatencyPercentile {
  label: string;
  /** Milliseconds, one per time bucket, oldest first. */
  current: number[];
  previous: number[];
}

export type LatencyData = Record<LatencyMetric, LatencyPercentile[]>;

const line = (base: number, wobble: number, seed: number) => Array.from({ length: 12 }, (_, i) => Math.round(base + Math.sin(i * 1.3 + seed) * wobble + i * (wobble / 8)));

export const DEMO_LATENCY: LatencyData = {
  ttft: [
    { label: "p50", current: line(310, 28, 1), previous: line(340, 30, 2) },
    { label: "p95", current: line(720, 90, 3), previous: line(810, 95, 4) },
    { label: "p99", current: line(1380, 180, 5), previous: line(1420, 170, 6) },
  ],
  total: [
    { label: "p50", current: line(2100, 160, 1), previous: line(2300, 170, 2) },
    { label: "p95", current: line(5400, 520, 3), previous: line(5200, 500, 4) },
    { label: "p99", current: line(9800, 900, 5), previous: line(10400, 950, 6) },
  ],
};

export function latestAndChange(p: LatencyPercentile): { value: number; changePct: number } {
  const value = p.current[p.current.length - 1] ?? 0;
  const prev = p.previous[p.previous.length - 1] ?? 0;
  return { value, changePct: prev > 0 ? Math.round(((value - prev) / prev) * 1000) / 10 : 0 };
}

export const formatMs = (ms: number) => (ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${Math.round(ms)} ms`);

export interface LlmOpsLatencyProps {
  data?: LatencyData;
  className?: string;
}

export function LlmOpsLatency({ data = DEMO_LATENCY, className = "" }: LlmOpsLatencyProps) {
  const [metric, setMetric] = useState<LatencyMetric>("ttft");
  const labels = Array.from({ length: 12 }, (_, i) => `${i * 2}:00`);
  return (
    <section aria-label="Latency" className={`@container ${className}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-[15px] font-semibold text-fg">{metric === "ttft" ? "Time to first token" : "Total latency"}</h3>
        <SegmentedControl
          label="Latency metric"
          size="sm"
          options={[
            { value: "ttft", label: "First token" },
            { value: "total", label: "Total" },
          ]}
          value={metric}
          onValueChange={(v) => setMetric(v as LatencyMetric)}
        />
      </div>
      <div className="grid gap-3 @[560px]:grid-cols-3">
        {data[metric].map((p) => {
          const { value, changePct } = latestAndChange(p);
          return (
            <StatCard
              key={`${metric}-${p.label}`}
              label={p.label}
              value={value}
              format={formatMs}
              delta={changePct}
              goodDirection="down"
              comparison="vs last period"
              data={p.current}
              previous={p.previous}
              labels={labels}
            />
          );
        })}
      </div>
    </section>
  );
}
