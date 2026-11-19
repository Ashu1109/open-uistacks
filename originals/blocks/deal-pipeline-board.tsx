"use client";

import { useState } from "react";
import { KanbanBoard, type KanbanColumn } from "../ui/kanban-board";

/* Deal pipeline board: a full-width kanban of deals by stage with a count and total per stage; dragging (or keyboard-moving) a deal re-totals both stages. Money is integer minor units. */

export interface Deal {
  id: string;
  name: string;
  company: string;
  /** Integer minor units (cents). */
  amountMinor: number;
  owner: string;
  stage: string;
  /** Expected close date, YYYY-MM-DD. */
  closeOn: string;
}

export interface Stage {
  id: string;
  title: string;
}

export interface StageTotal {
  stageId: string;
  title: string;
  count: number;
  totalMinor: number;
}

export const DEMO_NOW = "2026-11-18";

export const DEMO_STAGES: Stage[] = [
  { id: "lead", title: "Lead" },
  { id: "qualified", title: "Qualified" },
  { id: "proposal", title: "Proposal" },
  { id: "negotiation", title: "Negotiation" },
];

export const DEMO_DEALS: Deal[] = [
  { id: "d1", name: "Platform rollout", company: "Brightwell Foods", amountMinor: 4_800_000, owner: "Maya Okafor", stage: "negotiation", closeOn: "2026-11-20" },
  { id: "d2", name: "Annual licence", company: "Northfield Labs", amountMinor: 2_150_000, owner: "Jonas Pell", stage: "proposal", closeOn: "2026-11-24" },
  { id: "d3", name: "Pilot expansion", company: "Quarry & Vale", amountMinor: 960_000, owner: "Maya Okafor", stage: "qualified", closeOn: "2026-12-02" },
  { id: "d4", name: "Team seats x40", company: "Harbor Street Co", amountMinor: 1_320_000, owner: "Ines Duarte", stage: "proposal", closeOn: "2026-11-19" },
  { id: "d5", name: "Support upgrade", company: "Lumen Textiles", amountMinor: 540_000, owner: "Jonas Pell", stage: "lead", closeOn: "2026-12-15" },
  { id: "d6", name: "Data migration", company: "Kestrel Freight", amountMinor: 3_300_000, owner: "Ines Duarte", stage: "negotiation", closeOn: "2026-11-27" },
  { id: "d7", name: "Starter plan", company: "Olive & Ash", amountMinor: 180_000, owner: "Maya Okafor", stage: "lead", closeOn: "2026-12-20" },
  { id: "d8", name: "Regional licence", company: "Tidewater Group", amountMinor: 2_700_000, owner: "Jonas Pell", stage: "qualified", closeOn: "2026-12-09" },
];

export function formatMoney(minor: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(minor / 100);
}

export function formatDay(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(iso));
}

export function dealsToColumns(stages: readonly Stage[], deals: readonly Deal[], currency = "USD", now = DEMO_NOW): KanbanColumn[] {
  return stages.map((stage) => ({
    id: stage.id,
    title: stage.title,
    cards: deals
      .filter((d) => d.stage === stage.id)
      .map((d) => ({
        id: d.id,
        title: `${d.name}, ${d.company}`,
        labels: [{ text: formatMoney(d.amountMinor, currency), tone: "info" as const }],
        assignee: d.owner,
        due: formatDay(d.closeOn),
        overdue: d.closeOn < now,
      })),
  }));
}

/** Count and total per column, in column order, from a deal lookup. */
export function stageTotals(columns: readonly KanbanColumn[], deals: readonly Deal[]): StageTotal[] {
  const amounts = new Map(deals.map((d) => [d.id, d.amountMinor]));
  return columns.map((c) => ({
    stageId: c.id,
    title: c.title,
    count: c.cards.length,
    totalMinor: c.cards.reduce((sum, card) => sum + (amounts.get(card.id) ?? 0), 0),
  }));
}

export interface DealPipelineBoardProps {
  deals?: Deal[];
  stages?: Stage[];
  currency?: string;
  /** Called when a deal lands in a different stage. */
  onDealMove?: (dealId: string, toStageId: string) => void;
  className?: string;
}

function stageById(columns: readonly KanbanColumn[]): Map<string, string> {
  return new Map(columns.flatMap((c) => c.cards.map((card) => [card.id, c.id] as const)));
}

export function DealPipelineBoard({ deals = DEMO_DEALS, stages = DEMO_STAGES, currency = "USD", onDealMove, className = "" }: DealPipelineBoardProps) {
  const [columns, setColumns] = useState(() => dealsToColumns(stages, deals, currency));
  const totals = stageTotals(columns, deals);
  const open = totals.reduce((sum, t) => sum + t.totalMinor, 0);

  const change = (next: KanbanColumn[]) => {
    const before = stageById(columns);
    for (const [id, stageId] of stageById(next)) if (before.get(id) !== stageId) onDealMove?.(id, stageId);
    setColumns(next);
  };

  return (
    <section aria-label="Deal pipeline" className={`@container grid grid-cols-1 gap-4 rounded-[20px] bg-subtle/50 p-4 ${className}`}>
      <header className="flex flex-wrap items-baseline justify-between gap-2 px-1">
        <h2 className="text-[15px] font-semibold text-fg">Pipeline</h2>
        <p className="text-sm text-fg-muted">
          <span className="font-medium tabular-nums text-fg">{formatMoney(open, currency)}</span> open across {totals.reduce((n, t) => n + t.count, 0)} deals
        </p>
      </header>
      <ul aria-label="Stage totals" className="grid grid-cols-2 gap-2 @[720px]:grid-cols-4">
        {totals.map((t) => (
          <li key={t.stageId} className="rounded-[14px] bg-surface px-3 py-2 shadow-[var(--shadow-card)] dark:bg-raised">
            <p className="text-xs text-fg-muted">{t.title} <span className="tabular-nums">({t.count})</span></p>
            <p className="text-[15px] font-semibold tabular-nums text-fg">{formatMoney(t.totalMinor, currency)}</p>
          </li>
        ))}
      </ul>
      <div className="overflow-x-auto">
        <KanbanBoard columns={columns} onColumnsChange={change} />
      </div>
    </section>
  );
}
