import type { ReactNode } from "react";
import { useDemoView, useIsolated } from "../demo";
import { InvoicesWorkspace } from "../../originals/blocks/invoices-workspace";
import { PnlOverview } from "../../originals/blocks/pnl-overview";
import { TreasuryOverview } from "../../originals/blocks/treasury-overview";
import { StacksBooks } from "../../originals/templates/stacks-books";
import { StacksCrypto } from "../../originals/templates/stacks-crypto";

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

function Template({ slug, name, children }: { slug: string; name: string; children: ReactNode }) {
  if (useIsolated()) return null;
  return (
    <section id={slug} className="grid gap-3">
      <h3 className="text-sm font-medium text-fg-muted">{name} template</h3>
      <div className="h-[860px] overflow-hidden rounded-[20px] shadow-[var(--shadow-card)]">{children}</div>
    </section>
  );
}

export function Section() {
  const isolated = useIsolated();
  return (
    <div className="grid gap-10">
      <Demo title="Invoices workspace" slug="invoices-workspace"><InvoicesWorkspace /></Demo>
      <Demo title="P&L overview" slug="pnl-overview"><PnlOverview /></Demo>
      <Demo title="Treasury overview" slug="treasury-overview"><div className="max-w-xl"><TreasuryOverview /></div></Demo>
      <Template slug="stacks-books" name="Stacks Books"><StacksBooks /></Template>
      <Template slug="stacks-crypto" name="Stacks Crypto"><StacksCrypto /></Template>
    </div>
  );
}
