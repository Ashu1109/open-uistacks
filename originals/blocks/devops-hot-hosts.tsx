"use client";

import { useState } from "react";
import { Server } from "lucide-react";

/* Devops hot hosts: the hosts under the most load, ranked by CPU or memory with threshold-coloured bars. A card, 1/2 width or full width. */

export interface Host {
  name: string;
  /** Percent, 0 to 100. */
  cpu: number;
  memory: number;
  role?: string;
}

export type HostMetric = "cpu" | "memory";

export interface DevopsHotHostsProps {
  hosts?: Host[];
  defaultMetric?: HostMetric;
  /** How many hosts to show. */
  limit?: number;
  className?: string;
}

export const WARN_AT = 75;
export const DANGER_AT = 90;

export const loadColor = (pct: number) => (pct >= DANGER_AT ? "var(--danger)" : pct >= WARN_AT ? "var(--warning)" : "var(--success)");

export function rankHosts(hosts: Host[], metric: HostMetric, limit = hosts.length): Host[] {
  return [...hosts].sort((a, b) => b[metric] - a[metric]).slice(0, limit);
}

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

const DEMO: Host[] = [
  { name: "web-use1-014", cpu: 94, memory: 71, role: "web" },
  { name: "db-use1-002", cpu: 68, memory: 93, role: "postgres" },
  { name: "worker-euw1-007", cpu: 88, memory: 64, role: "worker" },
  { name: "cache-use1-003", cpu: 41, memory: 86, role: "redis" },
  { name: "web-apse1-021", cpu: 79, memory: 58, role: "web" },
  { name: "worker-use1-011", cpu: 52, memory: 49, role: "worker" },
  { name: "edge-euw1-005", cpu: 33, memory: 37, role: "proxy" },
];

export function DevopsHotHosts({ hosts = DEMO, defaultMetric = "cpu", limit = 5, className = "" }: DevopsHotHostsProps) {
  const [metric, setMetric] = useState<HostMetric>(defaultMetric);
  const ranked = rankHosts(hosts, metric, limit);

  return (
    <section aria-labelledby="devops-hosts-title" className={`@container rounded-[20px] bg-surface p-5 shadow-[var(--shadow-card)] ${className}`}>
      <header className="mb-3 flex items-center justify-between gap-3">
        <h3 id="devops-hosts-title" className="flex items-center gap-2 text-[15px] font-semibold text-fg"><Server className="size-4 text-fg-muted" aria-hidden /> Hot hosts</h3>
        <div role="group" aria-label="Rank by" className="flex gap-1 rounded-[12px] bg-subtle p-0.5">
          {(["cpu", "memory"] as const).map((m) => (
            <button key={m} type="button" aria-pressed={metric === m} onClick={() => setMetric(m)} className={`rounded-[10px] px-2.5 py-1 text-xs font-medium ${ring} ${metric === m ? "bg-surface text-fg shadow-[var(--shadow-card)]" : "text-fg-muted"}`}>
              {m === "cpu" ? "CPU" : "Memory"}
            </button>
          ))}
        </div>
      </header>
      <ol aria-label={`Hosts ranked by ${metric}`} className="m-0 grid list-none gap-2.5 p-0">
        {ranked.map((h) => (
          <li key={h.name} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 @[480px]:grid-cols-[10rem_1fr_1fr]">
            <div className="min-w-0">
              <p className="m-0 truncate text-[13px] font-medium text-fg">{h.name}</p>
              {h.role && <p className="m-0 text-xs text-fg-subtle">{h.role}</p>}
            </div>
            {(["cpu", "memory"] as const).map((m) => (
              <div key={m} className={`col-span-2 items-center gap-2 @[480px]:col-span-1 ${m === metric ? "flex" : "hidden @[480px]:flex"}`}>
                <span className="w-9 text-xs text-fg-subtle">{m === "cpu" ? "CPU" : "Mem"}</span>
                <div role="meter" aria-label={`${h.name} ${m === "cpu" ? "CPU" : "memory"}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={h[m]} className="h-1.5 flex-1 overflow-hidden rounded-full bg-track">
                  <div className="h-full rounded-full" style={{ width: `${h[m]}%`, background: loadColor(h[m]) }} />
                </div>
                <span className="w-9 text-right text-xs tabular-nums text-fg-muted">{h[m]}%</span>
              </div>
            ))}
          </li>
        ))}
      </ol>
    </section>
  );
}
