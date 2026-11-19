"use client";

import { useState } from "react";
import { Activity, AlertTriangle, LayoutDashboard, Radar } from "lucide-react";
import { AppShell } from "../blocks/app-shell";
import { Button } from "../../registry/ui/button";
import { Avatar } from "../../registry/ui/avatar";
import type { NavSection } from "../ui/sidebar-nav";
import { DevopsActiveIncidents } from "../blocks/devops-active-incidents";
import { DevopsErrorBudget } from "../blocks/devops-error-budget";
import { DevopsHotHosts } from "../blocks/devops-hot-hosts";
import { DevopsLatency } from "../blocks/devops-latency";
import { DevopsOnCall } from "../blocks/devops-on-call";
import { DevopsRegions } from "../blocks/devops-regions";
import { DevopsServiceStatus } from "../blocks/devops-service-status";
import { DevopsUptimeHistory } from "../blocks/devops-uptime-history";

/* Devops template: Pulsegrid, a fictional SRE monitoring app with an Overview dashboard and a Services view, built from the devops blocks. */

export interface DevopsProps {
  className?: string;
}

type View = "overview" | "services";

const SECTIONS: NavSection[] = [
  {
    title: "Monitor",
    items: [
      { id: "overview", label: "Overview", icon: <LayoutDashboard size={16} aria-hidden /> },
      { id: "services", label: "Services", icon: <Activity size={16} aria-hidden /> },
    ],
  },
];

const VIEW_TITLE: Record<View, { title: string; subtitle: string }> = {
  overview: { title: "Overview", subtitle: "Production · live" },
  services: { title: "Services", subtitle: "Status, uptime and regional health" },
};

const Mark = (
  <span aria-hidden className="grid size-8 place-items-center rounded-[10px] bg-[image:var(--grad-primary)] text-[var(--inverse-fg)]">
    <Radar size={18} />
  </span>
);

export function Devops({ className = "" }: DevopsProps) {
  const [view, setView] = useState<View>("overview");
  const head = VIEW_TITLE[view];

  return (
    <AppShell
      className={className}
      product={{ name: "Pulsegrid", mark: Mark }}
      sections={SECTIONS}
      activeId={view}
      onNavigate={(id) => setView(id as View)}
      title={head.title}
      subtitle={head.subtitle}
      actions={<Button size="sm" variant="outline" leadingIcon={<AlertTriangle />}>Declare incident</Button>}
      sidebarFooter={
        <div className="flex items-center gap-2.5 rounded-[14px] px-3 py-2">
          <Avatar name="Priya Nair" size="sm" />
          <span className="truncate text-[13px] text-fg-muted">Priya Nair</span>
        </div>
      }
    >
      <div className="@container">
        {view === "overview" ? (
          <div className="grid grid-cols-1 gap-4 @[900px]:grid-cols-12">
            <DevopsActiveIncidents className="@[900px]:col-span-8" />
            <DevopsOnCall className="@[900px]:col-span-4" />
            <DevopsLatency className="@[900px]:col-span-8" />
            <DevopsErrorBudget className="@[900px]:col-span-4" />
            <DevopsHotHosts className="@[900px]:col-span-6" />
            <DevopsServiceStatus className="@[900px]:col-span-6" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 @[900px]:grid-cols-12">
            <DevopsRegions className="@[900px]:col-span-12" />
            <DevopsServiceStatus className="@[900px]:col-span-5" />
            <DevopsUptimeHistory className="@[900px]:col-span-7" />
          </div>
        )}
      </div>
    </AppShell>
  );
}
