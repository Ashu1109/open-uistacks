import type { ReactNode } from "react";
import { useDemoView, useIsolated } from "../demo";
import { LlmOpsAgentRuns } from "../../originals/blocks/llm-ops-agent-runs";
import { LlmOpsCostByFeature } from "../../originals/blocks/llm-ops-cost-by-feature";
import { LlmOpsCostByProvider } from "../../originals/blocks/llm-ops-cost-by-provider";
import { LlmOpsEvalScorecard } from "../../originals/blocks/llm-ops-eval-scorecard";
import { LlmOpsLatency } from "../../originals/blocks/llm-ops-latency";
import { LlmOpsModelSpend } from "../../originals/blocks/llm-ops-model-spend";
import { LlmOpsPromptCache } from "../../originals/blocks/llm-ops-prompt-cache";
import { LlmOpsProviderHealth } from "../../originals/blocks/llm-ops-provider-health";
import { LlmOps } from "../../originals/templates/llm-ops";

function Demo({ title, slug, children, narrow = false }: { title: string; slug: string; children: ReactNode; narrow?: boolean }) {
  const view = useDemoView(slug);
  if (view === "hidden") return null;
  if (view === "bare") return <div data-demo className="col-span-full w-full min-w-0">{children}</div>;
  return (
    <section id={slug} className="grid gap-3">
      <h3 className="text-sm font-medium text-fg-muted">{title}</h3>
      <div className="rounded-[20px] bg-subtle/50 p-6">
        <div className={narrow ? "max-w-[420px]" : ""}>{children}</div>
      </div>
    </section>
  );
}

export function Section() {
  const isolated = useIsolated();
  return (
    <div className="grid gap-10">
      <Demo title="LLM ops agent runs" slug="llm-ops-agent-runs"><LlmOpsAgentRuns /></Demo>
      <Demo title="LLM ops cost by feature" slug="llm-ops-cost-by-feature" narrow><LlmOpsCostByFeature /></Demo>
      <Demo title="LLM ops cost by provider" slug="llm-ops-cost-by-provider" narrow><LlmOpsCostByProvider /></Demo>
      <Demo title="LLM ops eval scorecard" slug="llm-ops-eval-scorecard" narrow><LlmOpsEvalScorecard /></Demo>
      <Demo title="LLM ops latency" slug="llm-ops-latency"><LlmOpsLatency /></Demo>
      <Demo title="LLM ops model spend" slug="llm-ops-model-spend"><LlmOpsModelSpend /></Demo>
      <Demo title="LLM ops prompt cache" slug="llm-ops-prompt-cache" narrow><LlmOpsPromptCache /></Demo>
      <Demo title="LLM ops provider health" slug="llm-ops-provider-health"><LlmOpsProviderHealth /></Demo>
      {!isolated && (
      <section id="llm-ops" className="grid gap-3">
        <h3 className="text-sm font-medium text-fg-muted">LlmOps template</h3>
        <div className="h-[860px] overflow-hidden rounded-[20px] shadow-[var(--shadow-card)]"><LlmOps /></div>
      </section>
      )}
    </div>
  );
}
