import type { ReactNode } from "react";
import { useDemoView, useIsolated } from "../demo";
import { OrdersWorkspace } from "../../originals/blocks/orders-workspace";
import { ProductCatalog } from "../../originals/blocks/product-catalog";
import { RevenueOverview } from "../../originals/blocks/revenue-overview";
import { ShipmentTracking } from "../../originals/blocks/shipment-tracking";
import { StacksShop } from "../../originals/templates/stacks-shop";

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
      <Demo title="Orders workspace" slug="orders-workspace"><OrdersWorkspace /></Demo>
      <Demo title="Product catalog" slug="product-catalog"><ProductCatalog /></Demo>
      <Demo title="Revenue overview" slug="revenue-overview"><RevenueOverview /></Demo>
      <Demo title="Shipment tracking" slug="shipment-tracking"><ShipmentTracking /></Demo>
      {!isolated && (
      <section id="stacks-shop" className="grid gap-3">
        <h3 className="text-sm font-medium text-fg-muted">Stacks Shop template</h3>
        <div className="h-[860px] overflow-hidden rounded-[20px] shadow-[var(--shadow-card)]"><StacksShop /></div>
      </section>
      )}
    </>
  );
}
