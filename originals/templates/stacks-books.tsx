"use client";

import { useState } from "react";
import { BookOpen, FileText, LayoutDashboard, Plus } from "lucide-react";
import { AppShell } from "../blocks/app-shell";
import { InvoicesWorkspace, type Invoice } from "../blocks/invoices-workspace";
import { PnlOverview } from "../blocks/pnl-overview";
import { TreasuryOverview } from "../blocks/treasury-overview";

/* Stacks Books template: a small-business accounting screen with an Overview (profit and loss beside treasury) and an Invoices workspace, switched from the sidebar. */

const SECTIONS = [{ items: [{ id: "overview", label: "Overview", icon: <LayoutDashboard size={16} aria-hidden /> }, { id: "invoices", label: "Invoices", icon: <FileText size={16} aria-hidden />, badge: 2 }] }];

export interface StacksBooksProps {
  invoices?: Invoice[];
  onNewInvoice?: () => void;
  className?: string;
}

export function StacksBooks({ invoices, onNewInvoice, className = "" }: StacksBooksProps) {
  const [view, setView] = useState("overview");
  return (
    <AppShell
      className={className}
      product={{ name: "Stacks Books", mark: <span className="grid size-8 place-items-center rounded-[10px] bg-select text-[var(--inverse-fg)]"><BookOpen size={16} aria-hidden /></span> }}
      sections={SECTIONS}
      activeId={view}
      onNavigate={setView}
      title={view === "overview" ? "Overview" : "Invoices"}
      subtitle="Juniper Works LLC"
      actions={<button type="button" onClick={onNewInvoice} className="inline-flex items-center gap-1.5 rounded-full bg-[image:var(--grad-primary)] px-4 py-2 text-sm font-medium text-[var(--inverse-fg)] shadow-[var(--shadow-btn-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)]"><Plus size={14} aria-hidden />New invoice</button>}
    >
      {view === "overview" ? (
        <div className="@container grid gap-4 @[900px]:grid-cols-12">
          <PnlOverview className="@[900px]:col-span-7" />
          <TreasuryOverview className="@[900px]:col-span-5" />
        </div>
      ) : (
        <InvoicesWorkspace invoices={invoices} />
      )}
    </AppShell>
  );
}
