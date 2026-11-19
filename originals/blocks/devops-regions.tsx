"use client";

import { Globe } from "lucide-react";
import { DotMap } from "../ui/dot-map";

/* Devops regions: per-region health on a dot map beside a status list with latency, plus counts by status. A card, 1/2 width or full width. */

export type RegionStatus = "healthy" | "degraded" | "down";

export interface Region {
  id: string;
  name: string;
  lat: number;
  lon: number;
  status: RegionStatus;
  latencyMs: number;
}

export interface DevopsRegionsProps {
  regions?: Region[];
  className?: string;
}

const COLOR: Record<RegionStatus, string> = { healthy: "var(--success)", degraded: "var(--warning)", down: "var(--danger)" };
const TEXT: Record<RegionStatus, string> = { healthy: "Healthy", degraded: "Degraded", down: "Down" };

export function regionCounts(regions: Region[]): Record<RegionStatus, number> {
  return regions.reduce((acc, r) => ({ ...acc, [r.status]: acc[r.status] + 1 }), { healthy: 0, degraded: 0, down: 0 });
}

const DEMO: Region[] = [
  { id: "us-east", name: "US East", lat: 38.9, lon: -77.4, status: "healthy", latencyMs: 82 },
  { id: "us-west", name: "US West", lat: 45.6, lon: -121.2, status: "healthy", latencyMs: 91 },
  { id: "sa-east", name: "Sao Paulo", lat: -23.5, lon: -46.6, status: "degraded", latencyMs: 246 },
  { id: "eu-west", name: "Dublin", lat: 53.3, lon: -6.3, status: "healthy", latencyMs: 74 },
  { id: "eu-central", name: "Frankfurt", lat: 50.1, lon: 8.7, status: "healthy", latencyMs: 69 },
  { id: "ap-south", name: "Mumbai", lat: 19.1, lon: 72.9, status: "down", latencyMs: 0 },
  { id: "ap-se", name: "Singapore", lat: 1.35, lon: 103.8, status: "healthy", latencyMs: 118 },
  { id: "ap-ne", name: "Tokyo", lat: 35.7, lon: 139.7, status: "degraded", latencyMs: 203 },
];

export function DevopsRegions({ regions = DEMO, className = "" }: DevopsRegionsProps) {
  const counts = regionCounts(regions);
  return (
    <section aria-labelledby="devops-regions-title" className={`@container rounded-[20px] bg-surface p-5 shadow-[var(--shadow-card)] ${className}`}>
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 id="devops-regions-title" className="flex items-center gap-2 text-[15px] font-semibold text-fg"><Globe className="size-4 text-fg-muted" aria-hidden /> Regions</h3>
        <p className="m-0 flex gap-3 text-xs text-fg-muted" aria-label="Regions by status">
          {(["healthy", "degraded", "down"] as const).map((s) => (
            <span key={s} className="inline-flex items-center gap-1 tabular-nums"><span aria-hidden className="size-2 rounded-full" style={{ background: COLOR[s] }} />{counts[s]} {TEXT[s].toLowerCase()}</span>
          ))}
        </p>
      </header>
      <div className="grid gap-4 @[640px]:grid-cols-[1.4fr_1fr] @[640px]:items-center">
        <DotMap label="Region health map" locations={regions.map((r) => ({ label: r.name, lat: r.lat, lon: r.lon, value: r.latencyMs }))} format={(n) => (n ? `${n} ms` : "unreachable")} />
        <ul className="m-0 grid list-none gap-1.5 p-0">
          {regions.map((r) => (
            <li key={r.id} className="flex items-center gap-2 text-[13px]">
              <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: COLOR[r.status] }} />
              <span className="flex-1 truncate text-fg">{r.name}</span>
              <span className="sr-only">{TEXT[r.status]}</span>
              <span className="tabular-nums text-fg-muted">{r.status === "down" ? "no response" : `${r.latencyMs} ms`}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
