"use client";

import { useState } from "react";
import { Badge } from "../../registry/ui/badge";

/* Dev tools deploys today: today's deploys with an environment filter, version, author and outcome. A card, 1/2 width of a 12-column grid (6 columns), responsive to its container. */

export type DeployEnv = "production" | "staging";
export type DeployStatus = "succeeded" | "failed" | "rolled-back" | "in-progress";

export interface Deploy {
  id: string;
  service: string;
  env: DeployEnv;
  version: string;
  author: string;
  time: string;
  status: DeployStatus;
}

export interface DevToolsDeploysTodayProps {
  deploys?: Deploy[];
  onSelect?: (deploy: Deploy) => void;
  className?: string;
}

export const DEMO_DEPLOYS: Deploy[] = [
  { id: "d1", service: "api-gateway", env: "production", version: "v2.8.3", author: "Priya N.", time: "14:12", status: "in-progress" },
  { id: "d2", service: "billing-worker", env: "production", version: "v1.41.0", author: "Marcus T.", time: "11:40", status: "succeeded" },
  { id: "d3", service: "web-app", env: "staging", version: "v2.9.0-rc1", author: "Lena K.", time: "11:05", status: "succeeded" },
  { id: "d4", service: "search-indexer", env: "production", version: "v0.19.2", author: "Omar H.", time: "09:48", status: "rolled-back" },
  { id: "d5", service: "web-app", env: "production", version: "v2.8.2", author: "Lena K.", time: "09:15", status: "succeeded" },
  { id: "d6", service: "notifier", env: "staging", version: "v3.2.1", author: "Ana R.", time: "08:30", status: "failed" },
];

export function filterDeploys(deploys: Deploy[], env: DeployEnv | "all"): Deploy[] {
  return env === "all" ? deploys : deploys.filter((d) => d.env === env);
}

const STATUS = {
  succeeded: { label: "Succeeded", tone: "success" },
  failed: { label: "Failed", tone: "danger" },
  "rolled-back": { label: "Rolled back", tone: "warning" },
  "in-progress": { label: "In progress", tone: "accent" },
} as const;

const FILTERS: { id: DeployEnv | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "production", label: "Production" },
  { id: "staging", label: "Staging" },
];

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export function DevToolsDeploysToday({ deploys = DEMO_DEPLOYS, onSelect, className = "" }: DevToolsDeploysTodayProps) {
  const [env, setEnv] = useState<DeployEnv | "all">("all");
  const rows = filterDeploys(deploys, env);
  return (
    <section aria-label="Deploys today" className={`@container rounded-[20px] bg-surface p-4 shadow-[var(--shadow-card)] @[480px]:p-5 ${className}`}>
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[15px] font-semibold text-fg">Deploys today <span className="font-normal text-fg-muted">({deploys.length})</span></h2>
        <div role="group" aria-label="Environment" className="flex gap-1 rounded-full bg-subtle p-0.5">
          {FILTERS.map((f) => (
            <button key={f.id} type="button" aria-pressed={env === f.id} onClick={() => setEnv(f.id)} className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${env === f.id ? "bg-surface text-fg shadow-[var(--shadow-card)]" : "text-fg-muted hover:text-fg"} ${ring}`}>
              {f.label}
            </button>
          ))}
        </div>
      </header>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-fg-muted">No deploys in this environment today.</p>
      ) : (
        <ul className="grid gap-1">
          {rows.map((d) => (
            <li key={d.id}>
              <button type="button" onClick={() => onSelect?.(d)} className={`flex w-full items-center gap-3 rounded-[12px] px-2 py-2 text-left hover:bg-[color-mix(in_srgb,var(--fg)_4%,var(--surface))] ${ring}`}>
                <span className="w-11 shrink-0 text-[12px] tabular-nums text-fg-subtle">{d.time}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium text-fg">{d.service}</span>
                  <span className="block truncate text-[12px] text-fg-muted">{d.version} · {d.env} · {d.author}</span>
                </span>
                <Badge tone={STATUS[d.status].tone} dot live={d.status === "in-progress"}>{STATUS[d.status].label}</Badge>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
