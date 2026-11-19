"use client";

import { useState } from "react";
import { Tabs } from "../../registry/ui/tabs";
import { AgentCard, type AgentStatus } from "../ui/agent-card";
import { RunCard, type RunStatus } from "../ui/run-card";
import { CountUp } from "../ui/chart-utils";

/* Agents overview: a full-width fleet section with headline counts, a status filter over agent cards, and the latest runs beside them; it adapts to its container, from one column to a cards-plus-runs split. */

export interface FleetAgent {
  id: string;
  name: string;
  role: string;
  model: string;
  status: AgentStatus;
  runsToday: number;
  successRate: number;
}

export interface FleetRun {
  id: string;
  title: string;
  agent: string;
  status: RunStatus;
  stepsDone: number;
  stepsTotal: number;
  elapsedMs: number;
  costUsd?: number;
}

export interface AgentsOverviewProps {
  agents?: FleetAgent[];
  runs?: FleetRun[];
  onOpenAgent?: (id: string) => void;
  onOpenRun?: (id: string) => void;
  onStopRun?: (id: string) => void;
  className?: string;
}

export const DEMO_AGENTS: FleetAgent[] = [
  { id: "a1", name: "Triage", role: "Sorts inbound tickets", model: "Atlas 3", status: "busy", runsToday: 142, successRate: 97 },
  { id: "a2", name: "Refunds", role: "Handles refund requests", model: "Atlas 3", status: "online", runsToday: 38, successRate: 91 },
  { id: "a3", name: "Researcher", role: "Compiles account briefs", model: "Orbit 2", status: "busy", runsToday: 21, successRate: 95 },
  { id: "a4", name: "Reconciler", role: "Matches invoices to payouts", model: "Orbit 2", status: "online", runsToday: 64, successRate: 99 },
  { id: "a5", name: "Scheduler", role: "Books customer calls", model: "Atlas 3 mini", status: "offline", runsToday: 0, successRate: 88 },
];

export const DEMO_RUNS: FleetRun[] = [
  { id: "r1", title: "Sort 40 new tickets", agent: "Triage", status: "running", stepsDone: 6, stepsTotal: 9, elapsedMs: 41_000, costUsd: 0.18 },
  { id: "r2", title: "Refund order #20418", agent: "Refunds", status: "succeeded", stepsDone: 5, stepsTotal: 5, elapsedMs: 18_400, costUsd: 0.07 },
  { id: "r3", title: "Brief for Northwind", agent: "Researcher", status: "failed", stepsDone: 4, stepsTotal: 8, elapsedMs: 96_000, costUsd: 0.42 },
  { id: "r4", title: "Match October payouts", agent: "Reconciler", status: "succeeded", stepsDone: 12, stepsTotal: 12, elapsedMs: 122_000, costUsd: 0.51 },
];

export interface FleetSummary {
  total: number;
  active: number;
  runsToday: number;
  avgSuccess: number;
}

export function summarizeFleet(agents: FleetAgent[]): FleetSummary {
  const runsToday = agents.reduce((n, a) => n + a.runsToday, 0);
  const weighted = agents.reduce((n, a) => n + a.successRate * a.runsToday, 0);
  return {
    total: agents.length,
    active: agents.filter((a) => a.status !== "offline").length,
    runsToday,
    avgSuccess: runsToday === 0 ? 0 : Math.round(weighted / runsToday),
  };
}

export function filterAgents(agents: FleetAgent[], filter: "all" | AgentStatus): FleetAgent[] {
  return filter === "all" ? agents : agents.filter((a) => a.status === filter);
}

export function AgentsOverview({ agents = DEMO_AGENTS, runs = DEMO_RUNS, onOpenAgent, onOpenRun, onStopRun, className = "" }: AgentsOverviewProps) {
  const [filter, setFilter] = useState<"all" | AgentStatus>("all");
  const summary = summarizeFleet(agents);
  const shown = filterAgents(agents, filter);
  const count = (s: AgentStatus) => agents.filter((a) => a.status === s).length;
  const stats = [
    { label: "Agents active", value: `${summary.active} of ${summary.total}` },
    { label: "Runs today", value: String(summary.runsToday) },
    { label: "Success rate", value: `${summary.avgSuccess}%` },
  ];

  return (
    <section aria-label="Agents overview" className={`@container w-full ${className}`}>
      <dl className="grid grid-cols-1 gap-3 @[480px]:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-[16px] bg-surface p-4 shadow-[var(--shadow-card)] dark:bg-raised">
            <dt className="text-[13px] text-fg-muted">{s.label}</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-fg"><CountUp text={String(s.value)} /></dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 grid gap-6 @[900px]:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-[15px] font-medium text-fg">Fleet</h3>
            <Tabs
              variant="pill"
              size="sm"
              label="Filter agents by status"
              value={filter}
              onValueChange={(v) => setFilter(v as "all" | AgentStatus)}
              items={[
                { value: "all", label: "All", count: agents.length },
                { value: "online", label: "Online", count: count("online") },
                { value: "busy", label: "Working", count: count("busy") },
                { value: "offline", label: "Offline", count: count("offline") },
              ]}
            />
          </div>
          {shown.length === 0 ? (
            <p className="rounded-[16px] bg-subtle p-6 text-center text-sm text-fg-muted">No agents with this status.</p>
          ) : (
            <ul className="grid gap-3 @[640px]:grid-cols-2">
              {shown.map((a) => (
                <li key={a.id}>
                  <AgentCard
                    className="max-w-none"
                    name={a.name}
                    role={a.role}
                    model={a.model}
                    status={a.status}
                    stats={[{ label: "Runs today", value: String(a.runsToday) }, { label: "Success", value: `${a.successRate}%` }]}
                    onSelect={onOpenAgent ? () => onOpenAgent(a.id) : undefined}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="min-w-0">
          <h3 className="mb-3 text-[15px] font-medium text-fg">Recent runs</h3>
          <ul className="grid gap-3">
            {runs.map((r) => (
              <li key={r.id}>
                <RunCard
                  title={r.title}
                  agent={r.agent}
                  status={r.status}
                  stepsDone={r.stepsDone}
                  stepsTotal={r.stepsTotal}
                  elapsedMs={r.elapsedMs}
                  costUsd={r.costUsd}
                  onOpen={onOpenRun ? () => onOpenRun(r.id) : undefined}
                  onStop={onStopRun ? () => onStopRun(r.id) : undefined}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
