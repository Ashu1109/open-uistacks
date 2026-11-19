import type { ReactNode } from "react";
import type { Tier } from "./catalog";
import { CardPreview } from "./preview";
import { itemHref, type Item } from "./items";

/* Small shared docs pieces: tier badge, page header and the index card. */

export function TierBadge({ tier }: { tier?: Tier }) {
  if (!tier) return null;
  const tone = tier === "Pro" ? "bg-select-soft text-select-text" : "bg-subtle text-fg-muted";
  return <span className={`inline-flex h-5 items-center rounded-full px-2 text-[11px] font-medium leading-none ${tone}`}>{tier}</span>;
}

export function PageHeader({ title, children, aside }: { title: ReactNode; children?: ReactNode; aside?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <h1 className="text-[40px] font-semibold leading-[1.1] tracking-[-0.02em] text-fg">{title}</h1>
        {children && <p className="mt-3 text-[16px] leading-7 text-fg-muted">{children}</p>}
      </div>
      {aside}
    </header>
  );
}

export function ItemCard({ item, previewHeight = 260 }: { item: Item; previewHeight?: number }) {
  const interactive = item.kind === "component";
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[22px] bg-surface shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-card),0_0_0_3px_var(--select-soft)] dark:bg-bg">
      <div className={`px-5 pt-5 ${interactive ? "relative" : ""}`}>
        <h3 className="flex items-center gap-2 text-[15px] font-medium text-fg">
          <a
            href={itemHref(item)}
            className={`outline-none after:absolute after:inset-0 after:z-10 focus-visible:after:ring-2 focus-visible:after:ring-[var(--select)] hover:underline ${interactive ? "after:rounded-t-[22px]" : "after:rounded-[22px] group-hover:underline"}`}
          >
            {item.name}
          </a>
          <TierBadge tier={item.tier} />
        </h3>
        <p className="mt-1 line-clamp-1 text-[13px] text-fg-muted">{item.description}</p>
      </div>
      <div className="relative" style={{ height: previewHeight }}>
        <CardPreview item={item} />
      </div>
    </article>
  );
}

export function CardGrid({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return <div className={`grid gap-5 ${wide ? "@[900px]:grid-cols-2" : "@[620px]:grid-cols-2 @[1500px]:grid-cols-3"}`}>{children}</div>;
}
