import type { ReactNode } from "react";
import { useDemoView, useIsolated } from "../demo";
import { ContactRecord } from "../../originals/blocks/contact-record";
import { CustomersSummary } from "../../originals/blocks/customers-summary";
import { DealPipelineBoard } from "../../originals/blocks/deal-pipeline-board";
import { DealsClosingSoon } from "../../originals/blocks/deals-closing-soon";
import { SalesKpiRow } from "../../originals/blocks/sales-kpi-row";
import { SalesToday } from "../../originals/blocks/sales-today";
import { StacksCrm } from "../../originals/templates/stacks-crm";

function Demo({ title, slug, wide = true, children }: { title: string; slug: string; wide?: boolean; children: ReactNode }) {
  const view = useDemoView(slug);
  if (view === "hidden") return null;
  if (view === "bare") return <div data-demo className="col-span-full w-full min-w-0">{children}</div>;
  return (
    <section id={slug} className="grid gap-3">
      <h3 className="text-sm font-medium text-fg-muted">{title}</h3>
      <div className="rounded-[20px] bg-subtle/50 p-6">
        <div className={wide ? "" : "max-w-xl"}>{children}</div>
      </div>
    </section>
  );
}

export function Section() {
  const isolated = useIsolated();
  return (
    <>
      <Demo title="Contact record" slug="contact-record"><ContactRecord /></Demo>
      <Demo title="Customers summary" slug="customers-summary"><CustomersSummary /></Demo>
      <Demo title="Deal pipeline board" slug="deal-pipeline-board"><DealPipelineBoard /></Demo>
      <Demo title="Deals closing soon" slug="deals-closing-soon" wide={false}><DealsClosingSoon /></Demo>
      <Demo title="Sales KPI row" slug="sales-kpi-row"><SalesKpiRow /></Demo>
      <Demo title="Sales today" slug="sales-today" wide={false}><SalesToday /></Demo>
      {!isolated && (
      <section id="stacks-crm" className="grid gap-3">
        <h3 className="text-sm font-medium text-fg-muted">Stacks CRM template</h3>
        <div className="h-[860px] overflow-hidden rounded-[20px] shadow-[var(--shadow-card)]"><StacksCrm /></div>
      </section>
      )}
    </>
  );
}
