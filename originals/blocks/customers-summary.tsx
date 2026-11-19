"use client";

import { DataTable, type DataColumn } from "../ui/data-table";
import { Badge, type BadgeTone } from "../../registry/ui/badge";
import { formatDay, formatMoney } from "./deal-pipeline-board";
import { CountUp } from "../ui/chart-utils";

/* Customers summary: a full-width section with account totals above a sortable, filterable customers table (status, owner, annual value in minor units, last contact). */

export type CustomerStatus = "active" | "at-risk" | "churned";

export interface Customer {
  id: string;
  name: string;
  industry: string;
  owner: string;
  status: CustomerStatus;
  /** Annual recurring value, integer minor units. */
  arrMinor: number;
  /** YYYY-MM-DD. */
  lastContact: string;
}

export const DEMO_CUSTOMERS: Customer[] = [
  { id: "c1", name: "Brightwell Foods", industry: "Food", owner: "Maya Okafor", status: "active", arrMinor: 4_800_000, lastContact: "2026-11-17" },
  { id: "c2", name: "Northfield Labs", industry: "Biotech", owner: "Jonas Pell", status: "active", arrMinor: 2_150_000, lastContact: "2026-11-14" },
  { id: "c3", name: "Quarry & Vale", industry: "Mining", owner: "Maya Okafor", status: "at-risk", arrMinor: 960_000, lastContact: "2026-10-22" },
  { id: "c4", name: "Harbor Street Co", industry: "Retail", owner: "Ines Duarte", status: "active", arrMinor: 1_320_000, lastContact: "2026-11-12" },
  { id: "c5", name: "Lumen Textiles", industry: "Apparel", owner: "Jonas Pell", status: "churned", arrMinor: 540_000, lastContact: "2026-08-30" },
  { id: "c6", name: "Kestrel Freight", industry: "Logistics", owner: "Ines Duarte", status: "at-risk", arrMinor: 3_300_000, lastContact: "2026-11-02" },
  { id: "c7", name: "Tidewater Group", industry: "Marine", owner: "Jonas Pell", status: "active", arrMinor: 2_700_000, lastContact: "2026-11-16" },
];

const TONE: Record<CustomerStatus, BadgeTone> = { active: "success", "at-risk": "warning", churned: "danger" };
const LABEL: Record<CustomerStatus, string> = { active: "Active", "at-risk": "At risk", churned: "Churned" };

export function summarize(customers: readonly Customer[]) {
  const kept = customers.filter((c) => c.status !== "churned");
  return {
    total: customers.length,
    active: customers.filter((c) => c.status === "active").length,
    atRisk: customers.filter((c) => c.status === "at-risk").length,
    arrMinor: kept.reduce((sum, c) => sum + c.arrMinor, 0),
  };
}

export interface CustomersSummaryProps {
  customers?: Customer[];
  currency?: string;
  onOpenCustomer?: (id: string) => void;
  className?: string;
}

export function CustomersSummary({ customers = DEMO_CUSTOMERS, currency = "USD", onOpenCustomer, className = "" }: CustomersSummaryProps) {
  const s = summarize(customers);
  const columns: DataColumn<Customer>[] = [
    {
      key: "name", header: "Customer", sortable: true,
      cell: (c) => onOpenCustomer
        ? <button type="button" onClick={() => onOpenCustomer(c.id)} className="rounded-[6px] font-medium text-fg outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--select)]">{c.name}</button>
        : <span className="font-medium text-fg">{c.name}</span>,
    },
    { key: "industry", header: "Industry", sortable: true },
    { key: "owner", header: "Owner", sortable: true },
    { key: "status", header: "Status", sortable: true, value: (c) => LABEL[c.status], cell: (c) => <Badge tone={TONE[c.status]} dot>{LABEL[c.status]}</Badge> },
    { key: "arrMinor", header: "Annual value", sortable: true, align: "right", value: (c) => c.arrMinor, cell: (c) => <span className="tabular-nums">{formatMoney(c.arrMinor, currency)}</span> },
    { key: "lastContact", header: "Last contact", sortable: true, align: "right", cell: (c) => formatDay(c.lastContact) },
  ];
  const stats = [
    { label: "Customers", value: String(s.total) },
    { label: "Active", value: String(s.active) },
    { label: "At risk", value: String(s.atRisk) },
    { label: "Annual value", value: formatMoney(s.arrMinor, currency) },
  ];
  return (
    <section aria-label="Customers summary" className={`@container grid gap-3 ${className}`}>
      <dl className="grid grid-cols-2 gap-3 @[720px]:grid-cols-4">
        {stats.map((x) => (
          <div key={x.label} className="rounded-[16px] bg-surface px-4 py-3 shadow-[var(--shadow-card)]">
            <dt className="text-xs text-fg-muted">{x.label}</dt>
            <dd className="text-lg font-semibold tabular-nums text-fg"><CountUp text={String(x.value)} /></dd>
          </div>
        ))}
      </dl>
      <DataTable columns={columns} rows={customers} getRowId={(c) => c.id} label="Customers" pageSize={5} />
    </section>
  );
}
