"use client";

import { Clock } from "lucide-react";
import { Badge, type BadgeTone } from "../../registry/ui/badge";

/* Data pipelines freshness: a card (1/3 or 1/2 width) showing how old each warehouse table is against its freshness SLA, worst first, with a marker at the SLA limit. */

export interface FreshnessTable {
  id: string;
  /** e.g. "analytics.orders". */
  name: string;
  /** Minutes since the last successful load. */
  ageMinutes: number;
  /** The most age the table may reach, in minutes. */
  slaMinutes: number;
}

export interface DataPipelinesFreshnessProps {
  tables?: FreshnessTable[];
  className?: string;
}

export type FreshnessState = "fresh" | "at-risk" | "stale";

export const DEMO_FRESHNESS: FreshnessTable[] = [
  { id: "a", name: "analytics.orders", ageMinutes: 22, slaMinutes: 60 },
  { id: "b", name: "analytics.sessions", ageMinutes: 14, slaMinutes: 30 },
  { id: "c", name: "analytics.payments", ageMinutes: 190, slaMinutes: 120 },
  { id: "d", name: "marts.ad_spend", ageMinutes: 340, slaMinutes: 360 },
  { id: "e", name: "marts.ticket_volume", ageMinutes: 55, slaMinutes: 240 },
];

export function freshnessState(ageMinutes: number, slaMinutes: number): FreshnessState {
  if (ageMinutes > slaMinutes) return "stale";
  return ageMinutes >= slaMinutes * 0.8 ? "at-risk" : "fresh";
}

export function formatAge(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

const TONE: Record<FreshnessState, BadgeTone> = { fresh: "success", "at-risk": "warning", stale: "danger" };
const LABEL: Record<FreshnessState, string> = { fresh: "Fresh", "at-risk": "At risk", stale: "Stale" };
const COLOR: Record<FreshnessState, string> = { fresh: "var(--success)", "at-risk": "var(--warning)", stale: "var(--danger)" };
const SCALE = 1.5;

export function DataPipelinesFreshness({ tables = DEMO_FRESHNESS, className = "" }: DataPipelinesFreshnessProps) {
  const sorted = [...tables].sort((a, b) => b.ageMinutes / b.slaMinutes - a.ageMinutes / a.slaMinutes);
  const stale = tables.filter((t) => freshnessState(t.ageMinutes, t.slaMinutes) === "stale").length;
  return (
    <section aria-label="Table freshness" className={`@container grid content-start gap-4 rounded-[20px] bg-surface p-5 shadow-[var(--shadow-card)] ${className}`}>
      <header className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold text-fg">
          <Clock size={16} className="text-fg-muted" aria-hidden /> Freshness
        </h2>
        <p className={`text-[13px] ${stale ? "text-danger-text" : "text-fg-muted"}`}>{stale ? `${stale} past SLA` : "All within SLA"}</p>
      </header>
      {sorted.length === 0 ? (
        <p className="py-6 text-center text-sm text-fg-muted">No tables are tracked yet.</p>
      ) : (
        <ul className="grid gap-4">
          {sorted.map((t) => {
            const state = freshnessState(t.ageMinutes, t.slaMinutes);
            const fill = Math.min(t.ageMinutes / (t.slaMinutes * SCALE), 1) * 100;
            return (
              <li key={t.id} className="grid gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate font-mono text-[13px] text-fg">{t.name}</span>
                  <Badge tone={TONE[state]} size="sm">
                    {LABEL[state]}
                  </Badge>
                </div>
                <div
                  role="meter"
                  aria-label={`${t.name} age`}
                  aria-valuemin={0}
                  aria-valuemax={t.slaMinutes}
                  aria-valuenow={Math.min(t.ageMinutes, t.slaMinutes)}
                  aria-valuetext={`${formatAge(t.ageMinutes)} old, SLA ${formatAge(t.slaMinutes)}`}
                  className="relative h-2 rounded-full bg-track"
                >
                  <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${fill}%`, background: COLOR[state] }} />
                  <span className="absolute -inset-y-0.5 w-0.5 rounded bg-fg" style={{ left: `${100 / SCALE}%` }} aria-hidden />
                </div>
                <p className="text-[12px] tabular-nums text-fg-muted">
                  {formatAge(t.ageMinutes)} old · SLA {formatAge(t.slaMinutes)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
