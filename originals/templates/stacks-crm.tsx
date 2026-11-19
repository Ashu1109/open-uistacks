"use client";

import { useState } from "react";
import { Handshake, LayoutDashboard, Plus, Sprout, Users } from "lucide-react";
import { AppShell } from "../blocks/app-shell";
import { Button } from "../../registry/ui/button";
import { ContactRecord } from "../blocks/contact-record";
import { CustomersSummary } from "../blocks/customers-summary";
import { DealPipelineBoard } from "../blocks/deal-pipeline-board";
import { DealsClosingSoon } from "../blocks/deals-closing-soon";
import { SalesKpiRow } from "../blocks/sales-kpi-row";
import { SalesToday } from "../blocks/sales-today";

/* Stacks CRM: a sales CRM screen for the fictional Orchard product. Overview combines KPIs, today's work, deals closing soon and the pipeline; Pipeline and Contacts are focused views. */

const SECTIONS = [
  {
    items: [
      { id: "overview", label: "Overview", icon: <LayoutDashboard size={16} /> },
      { id: "pipeline", label: "Pipeline", icon: <Handshake size={16} /> },
      { id: "contacts", label: "Contacts", icon: <Users size={16} /> },
    ],
  },
];

const VIEWS = {
  overview: { title: "Overview", subtitle: "November 2026" },
  pipeline: { title: "Pipeline", subtitle: "Deals by stage" },
  contacts: { title: "Contacts", subtitle: "Customers and people" },
} as const;

type ViewId = keyof typeof VIEWS;

export interface StacksCrmProps {
  className?: string;
}

export function StacksCrm({ className = "" }: StacksCrmProps) {
  const [view, setView] = useState<ViewId>("overview");
  const { title, subtitle } = VIEWS[view];
  return (
    <AppShell
      className={className}
      product={{ name: "Orchard", mark: <span className="grid size-8 place-items-center rounded-[10px] bg-[image:var(--grad-primary)] text-[var(--inverse-fg)]"><Sprout size={17} aria-hidden /></span> }}
      sections={SECTIONS}
      activeId={view}
      onNavigate={(id) => setView(id as ViewId)}
      title={title}
      subtitle={subtitle}
      actions={<Button size="sm" leadingIcon={<Plus />}>New deal</Button>}
    >
      <div className="@container">
        {view === "overview" && (
          <div className="grid gap-4">
            <SalesKpiRow />
            <div className="grid gap-4 @[960px]:grid-cols-2">
              <SalesToday />
              <DealsClosingSoon />
            </div>
            <DealPipelineBoard />
          </div>
        )}
        {view === "pipeline" && <DealPipelineBoard />}
        {view === "contacts" && (
          <div className="grid gap-4">
            <CustomersSummary />
            <ContactRecord />
          </div>
        )}
      </div>
    </AppShell>
  );
}
