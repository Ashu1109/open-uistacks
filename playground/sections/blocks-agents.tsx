import type { ReactNode } from "react";
import { useDemoView, useIsolated } from "../demo";
import { AgentsOverview } from "../../originals/blocks/agents-overview";
import { RunTrace } from "../../originals/blocks/run-trace";
import { ApprovalWithHistory } from "../../originals/blocks/approval-with-history";
import { ApprovalsInbox } from "../../originals/blocks/approvals-inbox";
import { StacksAgents } from "../../originals/templates/stacks-agents";

function Demo({ title, slug, children }: { title: string; slug: string; children: ReactNode }) {
  const view = useDemoView(slug);
  if (view === "hidden") return null;
  if (view === "bare") return <div data-demo className="col-span-full w-full min-w-0">{children}</div>;
  return (
    <section id={slug} className="grid gap-3">
      <h3 className="text-sm font-medium text-fg-muted">{title}</h3>
      <div className="rounded-[20px] bg-subtle/50 p-6">{children}</div>
    </section>
  );
}

export function Section() {
  const isolated = useIsolated();
  return (
    <div className="grid gap-10">
      <Demo title="Agents overview" slug="agents-overview"><AgentsOverview /></Demo>
      <Demo title="Run trace" slug="run-trace"><RunTrace /></Demo>
      <Demo title="Approval with history" slug="approval-with-history">
        <div className="max-w-[560px]"><ApprovalWithHistory /></div>
      </Demo>
      <Demo title="Approvals inbox" slug="approvals-inbox"><ApprovalsInbox /></Demo>
      {!isolated && (
      <section id="stacks-agents" className="grid gap-3">
        <h3 className="text-sm font-medium text-fg-muted">Stacks Agents template</h3>
        <div className="h-[860px] overflow-hidden rounded-[20px] shadow-[var(--shadow-card)]"><StacksAgents /></div>
      </section>
      )}
    </div>
  );
}
