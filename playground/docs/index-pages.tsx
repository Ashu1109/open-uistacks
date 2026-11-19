import { useState } from "react";
import { CardGrid, ItemCard, PageHeader } from "./ui";
import { groupId, groupItems, itemsOf, matches, type Item, type ItemKind, type TierFilter } from "./items";

/* Index pages: components, blocks and templates as live-preview card grids, grouped by category (or one group when
   the route names it), filtered by tier and the sidebar search. */

interface IndexProps {
  tier: TierFilter;
  query: string;
  group?: string;
}

type Sort = "category" | "name";

function Groups({ items, kind }: { items: Item[]; kind: ItemKind }) {
  const wide = kind !== "component";
  const height = kind === "block" ? 320 : 300;
  if (items.length === 0) return <p className="rounded-[20px] bg-subtle/60 p-10 text-center text-sm text-fg-muted">Nothing matches that search.</p>;
  return (
    <div className="grid gap-12">
      {groupItems(items).map(({ group, items: list }) => (
        <section key={group} id={groupId(group)} aria-labelledby={`${groupId(group)}-title`} className="grid scroll-mt-24 gap-5">
          <h2 id={`${groupId(group)}-title`} className="flex items-baseline gap-2 text-[22px] font-semibold tracking-[-0.01em] text-fg">
            {group} <span className="text-[15px] font-normal tabular-nums text-fg-subtle">{list.length}</span>
          </h2>
          <CardGrid wide={wide}>
            {list.map((item) => (
              <ItemCard key={item.slug} item={item} previewHeight={height} />
            ))}
          </CardGrid>
        </section>
      ))}
    </div>
  );
}

function SortSelect({ value, onChange }: { value: Sort; onChange: (s: Sort) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-fg-muted">
      Sort
      <select
        value={value}
        onChange={(e) => onChange(e.target.value === "name" ? "name" : "category")}
        className="h-10 rounded-full bg-subtle px-4 text-sm text-fg outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)]"
      >
        <option value="category">By category</option>
        <option value="name">A to Z</option>
      </select>
    </label>
  );
}

function useFiltered(kind: ItemKind, { tier, query, group }: IndexProps, sort: Sort): Item[] {
  const list = itemsOf(kind).filter((i) => matches(i, tier, query) && (!group || groupId(i.group) === group));
  if (sort === "category") return list;
  return [...list].sort((a, b) => a.name.localeCompare(b.name)).map((i) => ({ ...i, group: "All" }));
}

const COPY: Record<ItemKind, { title: string; lead: (n: number) => string }> = {
  component: { title: "Components", lead: (n) => `${n} animated React components, from AI chat to charts and data tables. Each page has a live preview, the full source, install steps and a props table.` },
  block: { title: "Blocks", lead: (n) => `${n} ready-made sections built from the components: dashboard cards, workspaces and list-and-detail views, with sample data so they work as soon as you drop them in.` },
  template: { title: "Templates", lead: (n) => `${n} complete app screens, each a fictional product built on the app shell with its family of blocks.` },
};

export function IndexPage({ kind, ...props }: IndexProps & { kind: ItemKind }) {
  const [sort, setSort] = useState<Sort>("category");
  const items = useFiltered(kind, props, sort);
  const total = itemsOf(kind).length;
  const groupName = props.group ? itemsOf(kind).find((i) => groupId(i.group) === props.group)?.group : undefined;
  return (
    <div className="grid gap-12">
      <PageHeader title={groupName ?? COPY[kind].title} aside={kind !== "template" && <SortSelect value={sort} onChange={setSort} />}>
        {groupName ? `${items.length} ${COPY[kind].title.toLowerCase()} in ${groupName}.` : COPY[kind].lead(total)}
      </PageHeader>
      <Groups items={items} kind={kind} />
    </div>
  );
}
