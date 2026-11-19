"use client";

import { useState } from "react";
import { AlertTriangle, Check } from "lucide-react";
import { Badge, type BadgeTone } from "../../registry/ui/badge";
import { Button } from "../../registry/ui/button";

/* Devops active incidents: open incidents ordered by severity then age, each with an Acknowledge action that flips it to acknowledged. A card, 1/2 width on a 12-column grid (or full width). */

export type IncidentSeverity = "sev1" | "sev2" | "sev3";

export interface Incident {
  id: string;
  title: string;
  service: string;
  severity: IncidentSeverity;
  /** Minutes since the incident started. */
  minutesAgo: number;
  acknowledgedBy?: string;
}

export interface DevopsActiveIncidentsProps {
  incidents?: Incident[];
  /** Called when someone acknowledges an incident. */
  onAcknowledge?: (id: string) => void;
  className?: string;
}

const RANK: Record<IncidentSeverity, number> = { sev1: 0, sev2: 1, sev3: 2 };
const TONE: Record<IncidentSeverity, BadgeTone> = { sev1: "danger", sev2: "warning", sev3: "neutral" };
const LABEL: Record<IncidentSeverity, string> = { sev1: "SEV1", sev2: "SEV2", sev3: "SEV3" };

export function sortIncidents(incidents: Incident[]): Incident[] {
  return [...incidents].sort((a, b) => RANK[a.severity] - RANK[b.severity] || b.minutesAgo - a.minutesAgo);
}

export function formatAge(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  return minutes % 60 === 0 ? `${h}h` : `${h}h ${minutes % 60}m`;
}

const DEMO: Incident[] = [
  { id: "inc-2041", title: "Checkout API returning 5xx for card payments", service: "payments-api", severity: "sev1", minutesAgo: 18 },
  { id: "inc-2040", title: "Elevated queue depth on image resize workers", service: "media-workers", severity: "sev2", minutesAgo: 47, acknowledgedBy: "Priya N." },
  { id: "inc-2038", title: "Search index replication lag above 90s", service: "search", severity: "sev2", minutesAgo: 125 },
  { id: "inc-2036", title: "Intermittent webhook retries to partner endpoint", service: "notifier", severity: "sev3", minutesAgo: 340 },
];

export function DevopsActiveIncidents({ incidents = DEMO, onAcknowledge, className = "" }: DevopsActiveIncidentsProps) {
  const [acked, setAcked] = useState<ReadonlySet<string>>(new Set());
  const ordered = sortIncidents(incidents);
  const isAcked = (i: Incident) => Boolean(i.acknowledgedBy) || acked.has(i.id);
  const unacked = ordered.filter((i) => !isAcked(i)).length;

  const acknowledge = (id: string) => {
    setAcked((prev) => new Set(prev).add(id));
    onAcknowledge?.(id);
  };

  return (
    <section aria-labelledby="devops-incidents-title" className={`@container rounded-[20px] bg-surface p-5 shadow-[var(--shadow-card)] ${className}`}>
      <header className="mb-3 flex items-center justify-between gap-3">
        <h3 id="devops-incidents-title" className="flex items-center gap-2 text-[15px] font-semibold text-fg">
          <AlertTriangle className="size-4 text-danger-text" aria-hidden /> Active incidents
        </h3>
        <Badge tone={unacked ? "danger" : "success"} size="sm" live>{unacked ? `${unacked} unacknowledged` : "All acknowledged"}</Badge>
      </header>
      {ordered.length === 0 ? (
        <p className="py-6 text-center text-sm text-fg-muted">No active incidents.</p>
      ) : (
        <ul className="m-0 grid list-none grid-cols-1 gap-1 p-0">
          {ordered.map((i) => (
            <li key={i.id} className="flex flex-col gap-2 rounded-[14px] px-3 py-2.5 hover:bg-[color-mix(in_srgb,var(--fg)_4%,var(--surface))] @[480px]:flex-row @[480px]:items-center">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <Badge tone={TONE[i.severity]} variant="soft" size="sm" className="mt-0.5">{LABEL[i.severity]}</Badge>
                <div className="min-w-0">
                  <p className="m-0 truncate text-[14px] font-medium text-fg" title={i.title}>{i.title}</p>
                  <p className="m-0 text-xs text-fg-muted">{i.service} · started {formatAge(i.minutesAgo)} ago</p>
                </div>
              </div>
              {isAcked(i) ? (
                <span className="inline-flex items-center gap-1 text-xs text-success-text"><Check className="size-3.5" aria-hidden /> Acknowledged{i.acknowledgedBy ? ` by ${i.acknowledgedBy}` : ""}</span>
              ) : (
                <Button size="xs" variant="outline" aria-label={`Acknowledge ${i.id}`} onClick={() => acknowledge(i.id)}>Acknowledge</Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
