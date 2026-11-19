import { useEffect, useState } from "react";
import { BLOCKS, COMPONENTS, TEMPLATES, type Tier } from "./catalog";
import { DESCRIPTIONS } from "./meta";

/* Docs data and routing: one flat list of every component, block and template, grouped for the index pages, plus the hash router. */

export type ItemKind = "component" | "block" | "template";
export type Section = "docs" | "components" | "blocks" | "templates";

export interface Item {
  kind: ItemKind;
  slug: string;
  name: string;
  group: string;
  tier?: Tier;
  description: string;
}

export const SECTION_OF_KIND: Record<ItemKind, Exclude<Section, "docs">> = { component: "components", block: "blocks", template: "templates" };

export const ITEMS: Item[] = [
  ...COMPONENTS.map((c) => ({ kind: "component" as const, slug: c.slug, name: c.name, group: c.category, tier: c.tier, description: DESCRIPTIONS[c.slug] ?? "" })),
  ...BLOCKS.map((b) => ({ kind: "block" as const, slug: b.slug, name: b.name, group: b.family, description: DESCRIPTIONS[b.slug] ?? "" })),
  ...TEMPLATES.map((t) => ({ kind: "template" as const, slug: t.slug, name: t.name, group: "Templates", description: DESCRIPTIONS[t.slug] ?? "" })),
];

export const groupId = (group: string) => group.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function itemsOf(kind: ItemKind): Item[] {
  return ITEMS.filter((i) => i.kind === kind);
}

/** Groups in first-seen order, so the catalog's category order is the page order. */
export function groupItems(items: Item[]): { group: string; items: Item[] }[] {
  const groups = new Map<string, Item[]>();
  items.forEach((item) => groups.set(item.group, [...(groups.get(item.group) ?? []), item]));
  return [...groups].map(([group, list]) => ({ group, items: list }));
}

export type TierFilter = "all" | "free" | "pro";

export function matches(item: Item, tier: TierFilter, query: string): boolean {
  if (tier !== "all" && item.tier && item.tier.toLowerCase() !== tier) return false;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return `${item.name} ${item.group} ${item.slug} ${item.description}`.toLowerCase().includes(q);
}

export const pascal = (slug: string) => slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");

export interface Route {
  section: Section;
  slug?: string;
  group?: string;
}

const SECTIONS: Section[] = ["docs", "components", "blocks", "templates"];

export function parseHash(hash: string): Route {
  const parts = decodeURIComponent(hash.replace(/^#\/?/, "")).split("/").filter(Boolean);
  const section = SECTIONS.find((s) => s === parts[0]) ?? "components";
  if (parts[1] === "group" && parts[2]) return { section, group: parts[2] };
  return { section, slug: parts[1] };
}

export const href = (section: Section, slug?: string) => `#/${section}${slug ? `/${slug}` : ""}`;
export const groupHref = (section: Section, group: string) => `#/${section}/group/${groupId(group)}`;
export const itemHref = (item: Item) => href(SECTION_OF_KIND[item.kind], item.slug);

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const onHash = () => setRoute(parseHash(window.location.hash));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return route;
}
