import type { ReactNode } from "react";
import { useDemoView, useIsolated } from "../demo";
import { DataPipelines } from "../../originals/templates/data-pipelines";
import { DataPipelinesConnectorHealth } from "../../originals/blocks/data-pipelines-connector-health";
import { DataPipelinesDataTests } from "../../originals/blocks/data-pipelines-data-tests";
import { DataPipelinesFailedSync } from "../../originals/blocks/data-pipelines-failed-sync";
import { DataPipelinesFreshness } from "../../originals/blocks/data-pipelines-freshness";
import { DataPipelinesNightlyRun } from "../../originals/blocks/data-pipelines-nightly-run";
import { DataPipelinesRowsLoaded } from "../../originals/blocks/data-pipelines-rows-loaded";
import { DataPipelinesWarehouseSpend } from "../../originals/blocks/data-pipelines-warehouse-spend";

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
      <Demo title="Data pipelines connector health" slug="data-pipelines-connector-health">
        <div className="max-w-xl"><DataPipelinesConnectorHealth /></div>
      </Demo>
      <Demo title="Data pipelines data tests" slug="data-pipelines-data-tests">
        <div className="max-w-xl"><DataPipelinesDataTests /></div>
      </Demo>
      <Demo title="Data pipelines failed sync" slug="data-pipelines-failed-sync">
        <div className="max-w-xl"><DataPipelinesFailedSync /></div>
      </Demo>
      <Demo title="Data pipelines freshness" slug="data-pipelines-freshness">
        <div className="max-w-md"><DataPipelinesFreshness /></div>
      </Demo>
      <Demo title="Data pipelines nightly run" slug="data-pipelines-nightly-run">
        <DataPipelinesNightlyRun />
      </Demo>
      <Demo title="Data pipelines rows loaded" slug="data-pipelines-rows-loaded">
        <div className="max-w-2xl"><DataPipelinesRowsLoaded /></div>
      </Demo>
      <Demo title="Data pipelines warehouse spend" slug="data-pipelines-warehouse-spend">
        <div className="max-w-md"><DataPipelinesWarehouseSpend /></div>
      </Demo>
      {!isolated && (
      <section id="data-pipelines" className="grid gap-3">
        <h3 className="text-sm font-medium text-fg-muted">DataPipelines template</h3>
        <div className="h-[860px] overflow-hidden rounded-[20px] shadow-[var(--shadow-card)]">
          <DataPipelines />
        </div>
      </section>
      )}
    </div>
  );
}
