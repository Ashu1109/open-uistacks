"use client";

import { useState } from "react";
import { Timer } from "lucide-react";
import { MultiLine } from "../ui/multi-line";
import { CountUp } from "../ui/chart-utils";

/* Devops latency: p50, p95 and p99 request latency over a selectable time range, with the latest values above the chart. A full-width section, or 2/3 width. */

export interface LatencyRange {
  id: string;
  label: string;
  labels: string[];
  p50: number[];
  p95: number[];
  p99: number[];
}

export interface DevopsLatencyProps {
  ranges?: LatencyRange[];
  defaultRangeId?: string;
  className?: string;
}

export const formatMs = (ms: number) => (ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${Math.round(ms)} ms`);

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

function demoRange(id: string, label: string, points: number, stamp: (i: number) => string): LatencyRange {
  const idx = Array.from({ length: points }, (_, i) => i);
  const wave = (i: number, amp: number) => Math.sin(i * 0.7) * amp + Math.cos(i * 1.9) * amp * 0.4;
  const spike = (i: number) => (i === Math.floor(points * 0.7) ? 1 : 0);
  return {
    id,
    label,
    labels: idx.map(stamp),
    p50: idx.map((i) => Math.round(82 + wave(i, 6) + spike(i) * 30)),
    p95: idx.map((i) => Math.round(240 + wave(i, 22) + spike(i) * 190)),
    p99: idx.map((i) => Math.round(520 + wave(i, 60) + spike(i) * 640)),
  };
}

const DEMO: LatencyRange[] = [
  demoRange("1h", "1h", 12, (i) => `${String(i * 5).padStart(2, "0")}m`),
  demoRange("6h", "6h", 12, (i) => `${i * 30}m`),
  demoRange("24h", "24h", 12, (i) => `${String(i * 2).padStart(2, "0")}:00`),
];

export function DevopsLatency({ ranges = DEMO, defaultRangeId, className = "" }: DevopsLatencyProps) {
  const [rangeId, setRangeId] = useState(defaultRangeId ?? ranges[0]?.id);
  const range = ranges.find((r) => r.id === rangeId) ?? ranges[0];
  if (!range) return null;
  const latest = (v: number[]) => v[v.length - 1] ?? 0;
  const stats = [
    { name: "p50", value: latest(range.p50), color: "var(--series-1)" },
    { name: "p95", value: latest(range.p95), color: "var(--series-3)" },
    { name: "p99", value: latest(range.p99), color: "var(--danger)" },
  ];

  return (
    <section aria-labelledby="devops-latency-title" className={`@container rounded-[20px] bg-surface p-5 shadow-[var(--shadow-card)] ${className}`}>
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 id="devops-latency-title" className="flex items-center gap-2 text-[15px] font-semibold text-fg"><Timer className="size-4 text-fg-muted" aria-hidden /> Request latency</h3>
        <div role="group" aria-label="Time range" className="flex gap-1 rounded-[12px] bg-subtle p-0.5">
          {ranges.map((r) => (
            <button key={r.id} type="button" aria-pressed={r.id === range.id} onClick={() => setRangeId(r.id)} className={`rounded-[10px] px-2.5 py-1 text-xs font-medium ${ring} ${r.id === range.id ? "bg-surface text-fg shadow-[var(--shadow-card)]" : "text-fg-muted"}`}>
              {r.label}
            </button>
          ))}
        </div>
      </header>
      <dl className="m-0 mb-3 flex gap-6">
        {stats.map((s) => (
          <div key={s.name}>
            <dt className="flex items-center gap-1.5 text-xs text-fg-muted"><span aria-hidden className="size-2 rounded-full" style={{ background: s.color }} />{s.name}</dt>
            <dd className="m-0 text-xl font-semibold tabular-nums text-fg"><CountUp text={formatMs(s.value)} /></dd>
          </div>
        ))}
      </dl>
      <MultiLine
        label={`Latency percentiles over the last ${range.label}`}
        labels={range.labels}
        format={formatMs}
        smooth
        series={[
          { name: "p50", values: range.p50, color: "var(--series-1)" },
          { name: "p95", values: range.p95, color: "var(--series-3)" },
          { name: "p99", values: range.p99, color: "var(--danger)" },
        ]}
      />
    </section>
  );
}
