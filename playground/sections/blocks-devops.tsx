import type { ReactNode } from "react";
import { useDemoView, useIsolated } from "../demo";
import { DevopsActiveIncidents } from "../../originals/blocks/devops-active-incidents";
import { DevopsErrorBudget } from "../../originals/blocks/devops-error-budget";
import { DevopsHotHosts } from "../../originals/blocks/devops-hot-hosts";
import { DevopsLatency } from "../../originals/blocks/devops-latency";
import { DevopsOnCall } from "../../originals/blocks/devops-on-call";
import { DevopsRegions } from "../../originals/blocks/devops-regions";
import { DevopsServiceStatus } from "../../originals/blocks/devops-service-status";
import { DevopsUptimeHistory } from "../../originals/blocks/devops-uptime-history";
import { Devops } from "../../originals/templates/devops";

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
      <Demo title="Devops active incidents" slug="devops-active-incidents"><div className="max-w-[640px]"><DevopsActiveIncidents /></div></Demo>
      <Demo title="Devops error budget" slug="devops-error-budget"><div className="max-w-[420px]"><DevopsErrorBudget /></div></Demo>
      <Demo title="Devops hot hosts" slug="devops-hot-hosts"><div className="max-w-[640px]"><DevopsHotHosts /></div></Demo>
      <Demo title="Devops latency" slug="devops-latency"><DevopsLatency /></Demo>
      <Demo title="Devops on call" slug="devops-on-call"><div className="max-w-[420px]"><DevopsOnCall /></div></Demo>
      <Demo title="Devops regions" slug="devops-regions"><DevopsRegions /></Demo>
      <Demo title="Devops service status" slug="devops-service-status"><div className="max-w-[640px]"><DevopsServiceStatus /></div></Demo>
      <Demo title="Devops uptime history" slug="devops-uptime-history"><DevopsUptimeHistory /></Demo>
      {!isolated && (
      <section id="devops" className="grid gap-3">
        <h3 className="text-sm font-medium text-fg-muted">Devops template</h3>
        <div className="h-[860px] overflow-hidden rounded-[20px] shadow-[var(--shadow-card)]"><Devops /></div>
      </section>
      )}
    </div>
  );
}
