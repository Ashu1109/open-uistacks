"use client";

import { useState } from "react";
import { Activity, Cable, Download, FlaskConical, GitBranch, LayoutDashboard } from "lucide-react";
import { Button } from "../../registry/ui/button";
import { AppShell } from "../blocks/app-shell";
import { DataPipelinesConnectorHealth } from "../blocks/data-pipelines-connector-health";
import { DataPipelinesDataTests } from "../blocks/data-pipelines-data-tests";
import { DataPipelinesFailedSync } from "../blocks/data-pipelines-failed-sync";
import { DataPipelinesFreshness } from "../blocks/data-pipelines-freshness";
import { DataPipelinesNightlyRun } from "../blocks/data-pipelines-nightly-run";
import { DataPipelinesRowsLoaded } from "../blocks/data-pipelines-rows-loaded";
import { DataPipelinesWarehouseSpend } from "../blocks/data-pipelines-warehouse-spend";

/* Data pipelines template: Conduit, a fictional ELT observability product. Overview shows rows loaded, spend, freshness and the nightly run; Connectors adds health and failed syncs; Quality adds data tests. */

export interface DataPipelinesProps {
  className?: string;
}

const SECTIONS = [
  {
    items: [
      { id: "overview", label: "Overview", icon: <LayoutDashboard size={16} /> },
      { id: "connectors", label: "Connectors", icon: <Cable size={16} />, badge: 6 },
      { id: "quality", label: "Quality", icon: <FlaskConical size={16} /> },
    ],
  },
];

const TITLES: Record<string, string> = { overview: "Overview", connectors: "Connectors", quality: "Quality" };

const mark = (
  <span className="grid size-8 place-items-center rounded-[10px] bg-[image:var(--grad-primary)] text-[var(--inverse-fg)]" aria-hidden>
    <GitBranch size={16} />
  </span>
);

const grid = "grid grid-cols-1 gap-4 @[900px]:grid-cols-12";

export function DataPipelines({ className = "" }: DataPipelinesProps) {
  const [view, setView] = useState("overview");
  return (
    <AppShell
      className={className}
      product={{ name: "Conduit", mark }}
      sections={SECTIONS}
      activeId={view}
      onNavigate={setView}
      title={TITLES[view]}
      subtitle="Production warehouse · last 24 hours"
      actions={
        <Button size="sm" variant="secondary" leadingIcon={<Download size={14} aria-hidden />}>
          Export
        </Button>
      }
      sidebarFooter={
        <p className="flex items-center gap-2 px-3 py-2 text-[13px] text-fg-muted">
          <Activity size={14} aria-hidden /> Pipeline status: degraded
        </p>
      }
    >
      <div className="@container">
        {view === "overview" && (
          <div className={grid}>
            <DataPipelinesRowsLoaded className="@[900px]:col-span-8" />
            <DataPipelinesWarehouseSpend className="@[900px]:col-span-4" />
            <DataPipelinesFreshness className="@[900px]:col-span-4" />
            <DataPipelinesFailedSync className="@[900px]:col-span-8" />
            <DataPipelinesNightlyRun className="@[900px]:col-span-12" />
          </div>
        )}
        {view === "connectors" && (
          <div className={grid}>
            <DataPipelinesConnectorHealth className="@[900px]:col-span-7" />
            <DataPipelinesFailedSync className="@[900px]:col-span-5" />
            <DataPipelinesRowsLoaded className="@[900px]:col-span-12" />
          </div>
        )}
        {view === "quality" && (
          <div className={grid}>
            <DataPipelinesDataTests className="@[900px]:col-span-7" />
            <DataPipelinesFreshness className="@[900px]:col-span-5" />
            <DataPipelinesNightlyRun className="@[900px]:col-span-12" />
          </div>
        )}
      </div>
    </AppShell>
  );
}
