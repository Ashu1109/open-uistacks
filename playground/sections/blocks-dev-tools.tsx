import type { ReactNode } from "react";
import { useDemoView, useIsolated } from "../demo";
import { DevToolsBuildHealth } from "../../originals/blocks/dev-tools-build-health";
import { DevToolsCiMinutes } from "../../originals/blocks/dev-tools-ci-minutes";
import { DevToolsDeploysToday } from "../../originals/blocks/dev-tools-deploys-today";
import { DevToolsDora } from "../../originals/blocks/dev-tools-dora";
import { DevToolsFlakyTests } from "../../originals/blocks/dev-tools-flaky-tests";
import { DevToolsReleaseGate } from "../../originals/blocks/dev-tools-release-gate";
import { DevToolsReviewQueue } from "../../originals/blocks/dev-tools-review-queue";
import { DevToolsTopErrors } from "../../originals/blocks/dev-tools-top-errors";
import { DevTools } from "../../originals/templates/dev-tools";

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
    <>
      <Demo title="Dev tools build health" slug="dev-tools-build-health"><div className="max-w-[640px]"><DevToolsBuildHealth /></div></Demo>
      <Demo title="Dev tools CI minutes" slug="dev-tools-ci-minutes"><div className="max-w-[400px]"><DevToolsCiMinutes /></div></Demo>
      <Demo title="Dev tools deploys today" slug="dev-tools-deploys-today"><div className="max-w-[640px]"><DevToolsDeploysToday /></div></Demo>
      <Demo title="Dev tools DORA" slug="dev-tools-dora"><DevToolsDora /></Demo>
      <Demo title="Dev tools flaky tests" slug="dev-tools-flaky-tests"><div className="max-w-[640px]"><DevToolsFlakyTests /></div></Demo>
      <Demo title="Dev tools release gate" slug="dev-tools-release-gate"><div className="max-w-[480px]"><DevToolsReleaseGate /></div></Demo>
      <Demo title="Dev tools review queue" slug="dev-tools-review-queue"><div className="max-w-[640px]"><DevToolsReviewQueue /></div></Demo>
      <Demo title="Dev tools top errors" slug="dev-tools-top-errors"><div className="max-w-[640px]"><DevToolsTopErrors /></div></Demo>
      {!isolated && (
      <section id="dev-tools" className="grid gap-3">
        <h3 className="text-sm font-medium text-fg-muted">Dev tools template</h3>
        <div className="h-[860px] overflow-hidden rounded-[20px] shadow-[var(--shadow-card)]"><DevTools /></div>
      </section>
      )}
    </>
  );
}
