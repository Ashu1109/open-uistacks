"use client";

import { UptimeBars, type UptimeDay, type UptimeStatus } from "../ui/uptime-bars";

/* LLM ops provider health: a full-width or 1/2-width (6 of 12 columns) card listing each model provider with a 30-day uptime strip, error rate and current status. */

export interface ProviderHealthRow {
  provider: string;
  days: UptimeDay[];
  /** Share of requests that errored, 0 to 1. */
  errorRate: number;
}

export type ProviderState = "healthy" | "degraded" | "down";

export function providerState(row: ProviderHealthRow): ProviderState {
  const last = row.days[row.days.length - 1]?.status;
  if (last === "down" || row.errorRate >= 0.05) return "down";
  if (last === "degraded" || row.errorRate >= 0.01) return "degraded";
  return "healthy";
}

function strip(pattern: Record<number, UptimeStatus>): UptimeDay[] {
  return Array.from({ length: 30 }, (_, i) => ({ date: i < 12 ? `Oct ${i + 20}` : `Nov ${i - 11}`, status: pattern[i] ?? "up" }));
}

export const DEMO_PROVIDER_HEALTH: ProviderHealthRow[] = [
  { provider: "Northwind AI", days: strip({ 6: "degraded" }), errorRate: 0.004 },
  { provider: "Lumen Labs", days: strip({ 12: "down", 13: "degraded", 29: "degraded" }), errorRate: 0.017 },
  { provider: "Orbital Models", days: strip({ 3: "degraded", 21: "degraded", 22: "degraded", 28: "down", 29: "down" }), errorRate: 0.062 },
  { provider: "Self-hosted", days: strip({}), errorRate: 0.001 },
];

const STATE = {
  healthy: { text: "Healthy", tone: "text-success-text" },
  degraded: { text: "Degraded", tone: "text-warning-text" },
  down: { text: "Outage", tone: "text-danger-text" },
} as const;

export interface LlmOpsProviderHealthProps {
  providers?: ProviderHealthRow[];
  className?: string;
}

export function LlmOpsProviderHealth({ providers = DEMO_PROVIDER_HEALTH, className = "" }: LlmOpsProviderHealthProps) {
  return (
    <section aria-label="Provider health" className={`@container rounded-[20px] bg-surface p-5 shadow-[var(--shadow-card)] dark:bg-raised ${className}`}>
      <h3 className="text-[15px] font-semibold text-fg">Provider health</h3>
      <p className="text-[13px] text-fg-muted">Last 30 days</p>
      <ul className="mt-4 grid gap-5">
        {providers.map((p) => {
          const state = STATE[providerState(p)];
          return (
            <li key={p.provider}>
              <div className="mb-1 flex items-center justify-between text-[12px]">
                <span className={`font-medium ${state.tone}`}>{state.text}</span>
                <span className="tabular-nums text-fg-muted">
                  {(p.errorRate * 100).toFixed(1)}% errors
                </span>
              </div>
              <UptimeBars name={p.provider} days={p.days} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
