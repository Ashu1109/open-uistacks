"use client";

import { useState } from "react";
import { Activity } from "lucide-react";

/* Devops service status: every service with its current state, error rate and latency; a toggle narrows the list to services with problems. A card, 1/2 width or full width. */

export type ServiceState = "operational" | "degraded" | "outage";

export interface ServiceRow {
  id: string;
  name: string;
  state: ServiceState;
  /** Errors as a percentage of requests. */
  errorRate: number;
  p95Ms: number;
}

export interface DevopsServiceStatusProps {
  services?: ServiceRow[];
  className?: string;
}

const COLOR: Record<ServiceState, string> = { operational: "var(--success)", degraded: "var(--warning)", outage: "var(--danger)" };
const TEXT: Record<ServiceState, string> = { operational: "Operational", degraded: "Degraded", outage: "Outage" };
const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export const withProblems = (services: ServiceRow[]) => services.filter((s) => s.state !== "operational");

const DEMO: ServiceRow[] = [
  { id: "gateway", name: "API gateway", state: "operational", errorRate: 0.02, p95Ms: 118 },
  { id: "payments", name: "Payments API", state: "outage", errorRate: 14.6, p95Ms: 2310 },
  { id: "auth", name: "Auth service", state: "operational", errorRate: 0.01, p95Ms: 64 },
  { id: "search", name: "Search", state: "degraded", errorRate: 1.9, p95Ms: 840 },
  { id: "media", name: "Media workers", state: "degraded", errorRate: 0.7, p95Ms: 1620 },
  { id: "notifier", name: "Notifier", state: "operational", errorRate: 0.18, p95Ms: 210 },
  { id: "billing", name: "Billing jobs", state: "operational", errorRate: 0.0, p95Ms: 390 },
];

export function DevopsServiceStatus({ services = DEMO, className = "" }: DevopsServiceStatusProps) {
  const [onlyProblems, setOnlyProblems] = useState(false);
  const shown = onlyProblems ? withProblems(services) : services;
  const issueCount = withProblems(services).length;

  return (
    <section aria-labelledby="devops-services-title" className={`@container rounded-[20px] bg-surface p-5 shadow-[var(--shadow-card)] ${className}`}>
      <header className="mb-3 flex items-center justify-between gap-3">
        <h3 id="devops-services-title" className="flex items-center gap-2 text-[15px] font-semibold text-fg"><Activity className="size-4 text-fg-muted" aria-hidden /> Service status</h3>
        <button type="button" aria-pressed={onlyProblems} onClick={() => setOnlyProblems((v) => !v)} className={`rounded-full px-3 py-1 text-xs font-medium ${ring} ${onlyProblems ? "bg-select-soft text-select-text" : "bg-subtle text-fg-muted"}`}>
          Problems only ({issueCount})
        </button>
      </header>
      {shown.length === 0 ? (
        <p className="py-6 text-center text-sm text-fg-muted">All services are operational.</p>
      ) : (
        <ul className="m-0 grid list-none gap-0.5 p-0">
          {shown.map((s) => (
            <li key={s.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 rounded-[12px] px-2 py-2 text-[13px] hover:bg-[color-mix(in_srgb,var(--fg)_4%,var(--surface))] @[480px]:grid-cols-[auto_1fr_6rem_5rem_5rem]">
              <span aria-hidden className="size-2.5 rounded-full" style={{ background: COLOR[s.state] }} />
              <span className="truncate font-medium text-fg">{s.name}</span>
              <span className="hidden text-fg-muted @[480px]:block">{TEXT[s.state]}</span>
              <span className="hidden text-right tabular-nums text-fg-muted @[480px]:block">{s.errorRate.toFixed(2)}%</span>
              <span className="text-right tabular-nums text-fg-muted">{s.p95Ms} ms</span>
              <span className="sr-only">{`${TEXT[s.state]}, ${s.errorRate.toFixed(2)}% errors`}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
