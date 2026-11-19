"use client";

import { useState } from "react";
import { Activity, Gauge, HeartPulse, LayoutDashboard, ListChecks, Wallet } from "lucide-react";
import { AppShell } from "../blocks/app-shell";
import { LlmOpsAgentRuns } from "../blocks/llm-ops-agent-runs";
import { LlmOpsCostByFeature } from "../blocks/llm-ops-cost-by-feature";
import { LlmOpsCostByProvider } from "../blocks/llm-ops-cost-by-provider";
import { LlmOpsEvalScorecard } from "../blocks/llm-ops-eval-scorecard";
import { LlmOpsLatency } from "../blocks/llm-ops-latency";
import { LlmOpsModelSpend } from "../blocks/llm-ops-model-spend";
import { LlmOpsPromptCache } from "../blocks/llm-ops-prompt-cache";
import { LlmOpsProviderHealth } from "../blocks/llm-ops-provider-health";
import type { NavSection } from "../ui/sidebar-nav";

/* LLM ops template: Plumb, a fictional LLM observability product, with an Overview of runs, spend, evals and latency and a Reliability view of provider health, latency and caching. */

const icon = (I: typeof Activity) => <I size={16} aria-hidden />;

const SECTIONS: NavSection[] = [
  {
    items: [
      { id: "overview", label: "Overview", icon: icon(LayoutDashboard) },
      { id: "reliability", label: "Reliability", icon: icon(HeartPulse) },
    ],
  },
  {
    title: "Workspace",
    items: [
      { id: "runs", label: "Agent runs", icon: icon(Activity) },
      { id: "evals", label: "Evaluations", icon: icon(ListChecks) },
      { id: "spend", label: "Spend", icon: icon(Wallet) },
    ],
  },
];

const VIEWS: Record<string, { title: string; subtitle: string }> = {
  overview: { title: "Overview", subtitle: "Last 30 days · all projects" },
  reliability: { title: "Reliability", subtitle: "Providers, latency and caching" },
  runs: { title: "Agent runs", subtitle: "Live and recent runs" },
  evals: { title: "Evaluations", subtitle: "Quality by model" },
  spend: { title: "Spend", subtitle: "Cost by feature, provider and month" },
};

export interface LlmOpsProps {
  className?: string;
}

function Mark() {
  return (
    <span className="grid size-8 place-items-center rounded-[10px] bg-[image:var(--grad-primary)] text-[var(--inverse-fg)]">
      <Gauge size={16} aria-hidden />
    </span>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="@container"><div className="grid grid-cols-1 gap-4 @[900px]:grid-cols-12">{children}</div></div>;
}

export function LlmOps({ className = "" }: LlmOpsProps) {
  const [view, setView] = useState("overview");
  const meta = VIEWS[view] ?? VIEWS.overview;

  return (
    <AppShell product={{ name: "Plumb", mark: <Mark /> }} sections={SECTIONS} activeId={view} onNavigate={setView} title={meta.title} subtitle={meta.subtitle} className={className}>
      {view === "overview" && (
        <Grid>
          <div className="@[900px]:col-span-8"><LlmOpsModelSpend /></div>
          <div className="@[900px]:col-span-4"><LlmOpsCostByProvider /></div>
          <div className="@[900px]:col-span-12"><LlmOpsAgentRuns /></div>
          <div className="@[900px]:col-span-6"><LlmOpsCostByFeature /></div>
          <div className="@[900px]:col-span-6"><LlmOpsEvalScorecard /></div>
        </Grid>
      )}
      {view === "reliability" && (
        <Grid>
          <div className="@[900px]:col-span-12"><LlmOpsLatency /></div>
          <div className="@[900px]:col-span-8"><LlmOpsProviderHealth /></div>
          <div className="@[900px]:col-span-4"><LlmOpsPromptCache /></div>
        </Grid>
      )}
      {view === "runs" && <LlmOpsAgentRuns />}
      {view === "evals" && (
        <Grid>
          <div className="@[900px]:col-span-6"><LlmOpsEvalScorecard /></div>
          <div className="@[900px]:col-span-6"><LlmOpsLatency /></div>
        </Grid>
      )}
      {view === "spend" && (
        <Grid>
          <div className="@[900px]:col-span-12"><LlmOpsModelSpend /></div>
          <div className="@[900px]:col-span-6"><LlmOpsCostByFeature /></div>
          <div className="@[900px]:col-span-6"><LlmOpsCostByProvider /></div>
        </Grid>
      )}
    </AppShell>
  );
}
