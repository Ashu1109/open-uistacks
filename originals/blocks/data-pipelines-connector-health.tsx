"use client";

import { useState, type ReactNode } from "react";
import { Database } from "lucide-react";
import { Badge, type BadgeTone } from "../../registry/ui/badge";
import { Tabs } from "../../registry/ui/tabs";

/* Data pipelines connector health: a card (1/2 width, or full width in a 12-column grid) listing every source connector with its sync status, last sync and rows moved, filterable by status. */

export type ConnectorStatus = "healthy" | "delayed" | "failing" | "paused";

export interface Connector {
  id: string;
  name: string;
  /** The system it reads from, e.g. "PostgreSQL". */
  source: string;
  status: ConnectorStatus;
  /** Display text, e.g. "4 min ago". */
  lastSync: string;
  /** Rows moved by the last sync. */
  rows: number;
  icon?: ReactNode;
}

export interface DataPipelinesConnectorHealthProps {
  connectors?: Connector[];
  onSelect?: (connector: Connector) => void;
  className?: string;
}

export const DEMO_CONNECTORS: Connector[] = [
  { id: "c1", name: "Orders DB", source: "PostgreSQL", status: "healthy", lastSync: "4 min ago", rows: 182400 },
  { id: "c2", name: "Storefront events", source: "Webhook stream", status: "healthy", lastSync: "1 min ago", rows: 964210 },
  { id: "c3", name: "Billing", source: "Payments API", status: "delayed", lastSync: "52 min ago", rows: 8120 },
  { id: "c4", name: "Support desk", source: "Ticketing API", status: "failing", lastSync: "3 h ago", rows: 0 },
  { id: "c5", name: "Ad spend", source: "Ads platform", status: "healthy", lastSync: "18 min ago", rows: 2310 },
  { id: "c6", name: "Legacy CRM", source: "SFTP drop", status: "paused", lastSync: "6 days ago", rows: 0 },
];

const TONE: Record<ConnectorStatus, BadgeTone> = { healthy: "success", delayed: "warning", failing: "danger", paused: "neutral" };
const LABEL: Record<ConnectorStatus, string> = { healthy: "Healthy", delayed: "Delayed", failing: "Failing", paused: "Paused" };

export function connectorCounts(connectors: readonly Connector[]): Record<ConnectorStatus, number> {
  const counts: Record<ConnectorStatus, number> = { healthy: 0, delayed: 0, failing: 0, paused: 0 };
  for (const c of connectors) counts[c.status] += 1;
  return counts;
}

export const formatRows = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

export function DataPipelinesConnectorHealth({ connectors = DEMO_CONNECTORS, onSelect, className = "" }: DataPipelinesConnectorHealthProps) {
  const [filter, setFilter] = useState("all");
  const counts = connectorCounts(connectors);
  const shown = filter === "all" ? connectors : connectors.filter((c) => c.status === filter);
  const tabs = [
    { value: "all", label: "All", count: connectors.length },
    ...(["healthy", "delayed", "failing", "paused"] as const).map((s) => ({ value: s, label: LABEL[s], count: counts[s] })),
  ];
  return (
    <section aria-label="Connector health" className={`@container grid content-start gap-4 rounded-[20px] bg-surface p-5 shadow-[var(--shadow-card)] ${className}`}>
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[15px] font-semibold text-fg">Connectors</h2>
        <p className="text-[13px] text-fg-muted">
          {counts.healthy} of {connectors.length} healthy
        </p>
      </header>
      <div className="-mx-1 overflow-x-auto px-1">
        <Tabs items={tabs} value={filter} onValueChange={setFilter} variant="pill" size="sm" label="Filter connectors by status" />
      </div>
      {shown.length === 0 ? (
        <p className="py-6 text-center text-sm text-fg-muted">No connectors with this status.</p>
      ) : (
        <ul className="grid">
          {shown.map((c) => (
            <li key={c.id} className="border-t border-track first:border-t-0">
              <button
                type="button"
                onClick={() => onSelect?.(c)}
                className="flex w-full items-center gap-3 rounded-[12px] px-2 py-2.5 text-left outline-none hover:bg-[color-mix(in_srgb,var(--fg)_4%,var(--surface))] focus-visible:ring-2 focus-visible:ring-[var(--select)]"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-subtle text-fg-muted" aria-hidden>
                  {c.icon ?? <Database size={16} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-fg">{c.name}</span>
                  <span className="block truncate text-[13px] text-fg-muted">
                    {c.source} · synced {c.lastSync}
                  </span>
                </span>
                <span className="hidden text-right text-[13px] tabular-nums text-fg-muted @[420px]:block">
                  {formatRows(c.rows)} <span className="text-fg-subtle">rows</span>
                </span>
                <Badge tone={TONE[c.status]} dot size="md">
                  {LABEL[c.status]}
                </Badge>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
