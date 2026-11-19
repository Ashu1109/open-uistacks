"use client";

import { useState } from "react";
import { Bot, Inbox, LayoutDashboard, Route } from "lucide-react";
import { AppShell } from "../blocks/app-shell";
import { AgentsOverview } from "../blocks/agents-overview";
import { RunTrace } from "../blocks/run-trace";
import { ApprovalsInbox } from "../blocks/approvals-inbox";
import { ApprovalWithHistory } from "../blocks/approval-with-history";

/* Stacks Agents template: an operations app for an AI-agent fleet, with the fleet overview, a full run trace, and an approvals inbox, switched from the sidebar. */

export interface StacksAgentsProps {
  className?: string;
}

type View = "overview" | "trace" | "approvals";

const TITLES: Record<View, { title: string; subtitle: string }> = {
  overview: { title: "Fleet overview", subtitle: "Live status of every agent" },
  trace: { title: "Run trace", subtitle: "Steps, tool calls and timing" },
  approvals: { title: "Approvals", subtitle: "Requests waiting on a human" },
};

const SECTIONS = [
  {
    items: [
      { id: "overview", label: "Overview", icon: <LayoutDashboard size={18} aria-hidden /> },
      { id: "trace", label: "Run trace", icon: <Route size={18} aria-hidden /> },
      { id: "approvals", label: "Approvals", icon: <Inbox size={18} aria-hidden />, badge: 4 },
    ],
  },
];

const mark = (
  <span className="grid size-8 place-items-center rounded-[10px] bg-[image:var(--grad-primary)] text-[var(--inverse-fg)]">
    <Bot size={18} aria-hidden />
  </span>
);

export function StacksAgents({ className = "" }: StacksAgentsProps) {
  const [view, setView] = useState<View>("overview");
  const { title, subtitle } = TITLES[view];

  return (
    <div className={`@container h-full w-full ${className}`}>
      <AppShell product={{ name: "Relay Ops", mark }} sections={SECTIONS} activeId={view} onNavigate={(id) => setView(id as View)} title={title} subtitle={subtitle}>
        {view === "overview" && (
          <div className="grid gap-6">
            <AgentsOverview onOpenRun={() => setView("trace")} />
            <div className="grid gap-6 @[900px]:grid-cols-2">
              <ApprovalWithHistory />
            </div>
          </div>
        )}
        {view === "trace" && <RunTrace />}
        {view === "approvals" && <ApprovalsInbox />}
      </AppShell>
    </div>
  );
}
