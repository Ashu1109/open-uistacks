import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { BookOpen, Boxes, LayoutGrid, LayoutTemplate, Menu, Moon, Search, Sun, X } from "lucide-react";
import { CommandPalette, type Command } from "../originals/ui/command-palette";
import { SegmentedControl } from "../originals/ui/segmented-control";
import { DOC_PAGES, DocsPage } from "./docs/docs-pages";
import { IndexPage } from "./docs/index-pages";
import { ItemPage } from "./docs/item-page";
import { ITEMS, SECTION_OF_KIND, groupHref, groupId, groupItems, href, itemHref, itemsOf, matches, useRoute, type ItemKind, type Route, type Section, type TierFilter } from "./docs/items";

/* Docs site: top bar (sections, search, theme), a sidebar (search, docs, tier filter, categories with counts) and the
   routed page — index grids, item pages or docs. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";
const NAV: { section: Section; label: string }[] = [
  { section: "components", label: "Components" },
  { section: "blocks", label: "Blocks" },
  { section: "templates", label: "Templates" },
  { section: "docs", label: "Docs" },
];

function readDark() {
  try {
    return localStorage.getItem("kit-theme") === "dark";
  } catch {
    return false;
  }
}

function Mark() {
  return (
    <span aria-hidden className="grid size-7 place-items-center rounded-[9px] bg-[image:var(--grad-primary)] text-[var(--inverse-fg)] shadow-[var(--shadow-btn-primary)]">
      <Boxes size={15} />
    </span>
  );
}

function SideLink({ to, active, children, count }: { to: string; active: boolean; children: ReactNode; count?: number }) {
  return (
    <a
      href={to}
      aria-current={active ? "page" : undefined}
      className={`flex items-center justify-between gap-2 rounded-[10px] px-3 py-1.5 text-[14px] transition-colors ${active ? "bg-subtle font-medium text-fg" : "text-fg-muted hover:bg-subtle/70 hover:text-fg"} ${ring}`}
    >
      <span className="truncate">{children}</span>
      {count !== undefined && <span className="rounded-full bg-subtle px-2 text-[11px] tabular-nums leading-5 text-fg-muted">{count}</span>}
    </a>
  );
}

function SideGroup({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="grid gap-1">
      <p className="flex items-center gap-2 px-3 pb-1 text-[13px] font-medium text-fg">
        <span className="text-fg-muted">{icon}</span>
        {title}
      </p>
      <div className="ml-[18px] grid gap-0.5 border-l border-track pl-2">{children}</div>
    </div>
  );
}

interface SidebarProps {
  route: Route;
  tier: TierFilter;
  setTier: (t: TierFilter) => void;
  query: string;
  setQuery: (q: string) => void;
}

function Sidebar({ route, tier, setTier, query, setQuery }: SidebarProps) {
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (e.key !== "/" || target?.closest("input, textarea, [contenteditable=true]")) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const groupsOf = (kind: ItemKind) => groupItems(itemsOf(kind).filter((i) => matches(i, kind === "component" ? tier : "all", query)));
  const components = groupsOf("component");
  const blocks = groupsOf("block");
  const templates = itemsOf("template").filter((i) => matches(i, "all", query));
  const total = (groups: { items: unknown[] }[]) => groups.reduce((n, g) => n + g.items.length, 0);
  const at = (section: Section, group?: string) => route.section === section && !route.slug && route.group === group;

  return (
    <nav aria-label="Docs navigation" className="grid gap-6 pb-10">
      <label className="relative block">
        <span className="sr-only">Search components</span>
        <Search size={15} aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle" />
        <input
          ref={searchRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search components"
          className="h-10 w-full rounded-full bg-subtle pl-10 pr-10 text-[14px] text-fg outline-none placeholder:text-fg-subtle focus-visible:ring-2 focus-visible:ring-[var(--select)]"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-[6px] bg-surface px-1.5 text-[11px] text-fg-subtle shadow-[var(--shadow-hairline)] dark:bg-raised">/</kbd>
      </label>

      <SideGroup icon={<BookOpen size={15} />} title="Docs">
        {DOC_PAGES.map((p) => (
          <SideLink key={p.slug} to={href("docs", p.slug)} active={route.section === "docs" && (route.slug ?? "introduction") === p.slug}>{p.name}</SideLink>
        ))}
      </SideGroup>

      <SegmentedControl
        label="Tier"
        value={tier}
        onValueChange={(v) => setTier(v === "free" || v === "pro" ? v : "all")}
        options={[{ value: "all", label: "All" }, { value: "free", label: "Free" }, { value: "pro", label: "Pro" }]}
        className="w-full [&>*]:flex-1"
      />

      <SideGroup icon={<LayoutGrid size={15} />} title="Components">
        <SideLink to={href("components")} active={at("components")} count={total(components)}>All components</SideLink>
        {components.map((g) => (
          <SideLink key={g.group} to={groupHref("components", g.group)} active={at("components", groupId(g.group))} count={g.items.length}>{g.group}</SideLink>
        ))}
      </SideGroup>

      <SideGroup icon={<Boxes size={15} />} title="Blocks">
        <SideLink to={href("blocks")} active={at("blocks")} count={total(blocks)}>All blocks</SideLink>
        {blocks.map((g) => (
          <SideLink key={g.group} to={groupHref("blocks", g.group)} active={at("blocks", groupId(g.group))} count={g.items.length}>{g.group}</SideLink>
        ))}
      </SideGroup>

      <SideGroup icon={<LayoutTemplate size={15} />} title="Templates">
        <SideLink to={href("templates")} active={at("templates")} count={templates.length}>All templates</SideLink>
        {templates.map((t) => (
          <SideLink key={t.slug} to={itemHref(t)} active={route.section === "templates" && route.slug === t.slug}>{t.name}</SideLink>
        ))}
      </SideGroup>
    </nav>
  );
}

function Page({ route, tier, query }: { route: Route; tier: TierFilter; query: string }) {
  if (route.section === "docs") return <DocsPage slug={route.slug} />;
  const kind = (Object.keys(SECTION_OF_KIND) as ItemKind[]).find((k) => SECTION_OF_KIND[k] === route.section) ?? "component";
  const item = route.slug ? ITEMS.find((i) => i.kind === kind && i.slug === route.slug) : undefined;
  if (route.slug && !item) return <p className="text-fg-muted">Nothing here. <a className="text-select-text" href={href(route.section)}>Back to {route.section}</a></p>;
  if (item) return <ItemPage key={item.slug} item={item} />;
  return <IndexPage key={`${route.section}-${route.group ?? "all"}`} kind={kind} tier={tier} query={query} group={route.group} />;
}

export function App() {
  const route = useRoute();
  const [dark, setDark] = useState(readDark);
  const [tier, setTier] = useState<TierFilter>("all");
  const [query, setQuery] = useState("");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem("kit-theme", dark ? "dark" : "light");
    } catch {
      /* storage blocked: the theme just won't persist */
    }
  }, [dark]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    setMenuOpen(false);
  }, [route.section, route.slug, route.group]);

  const commands = useMemo<Command[]>(
    () => [
      ...DOC_PAGES.map((p) => ({ id: `docs-${p.slug}`, label: p.name, group: "Docs", onSelect: () => (window.location.hash = href("docs", p.slug)) })),
      ...ITEMS.map((i) => ({ id: `${i.kind}-${i.slug}`, label: i.name, group: i.kind === "component" ? "Components" : i.kind === "block" ? "Blocks" : "Templates", keywords: [i.group, i.slug], onSelect: () => (window.location.hash = itemHref(i)) })),
    ],
    []
  );

  const sidebar = <Sidebar route={route} tier={tier} setTier={setTier} query={query} setQuery={setQuery} />;

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="sticky top-0 z-40 border-b border-track bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-6 px-4 lg:px-8">
          <button type="button" aria-label="Open navigation" onClick={() => setMenuOpen(true)} className={`grid size-9 place-items-center rounded-full text-fg-muted hover:bg-subtle lg:hidden ${ring}`}>
            <Menu size={18} aria-hidden />
          </button>
          <a href={href("docs", "introduction")} className={`flex items-center gap-2.5 rounded-[10px] text-[16px] font-semibold text-fg ${ring}`}>
            <Mark /> Component Kit
          </a>
          <nav aria-label="Sections" className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <a key={n.section} href={href(n.section)} aria-current={route.section === n.section ? "page" : undefined} className={`rounded-full px-3 py-1.5 text-[14px] transition-colors ${route.section === n.section ? "text-fg" : "text-fg-muted hover:text-fg"} ${ring}`}>
                {n.label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <button type="button" onClick={() => setPaletteOpen(true)} className={`hidden h-9 w-64 items-center gap-2 rounded-full bg-subtle px-3.5 text-[14px] text-fg-subtle hover:text-fg-muted sm:flex ${ring}`}>
              <Search size={15} aria-hidden /> Search
              <kbd className="ml-auto rounded-[6px] bg-surface px-1.5 text-[11px] shadow-[var(--shadow-hairline)] dark:bg-raised">⌘K</kbd>
            </button>
            <button type="button" aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} onClick={() => setDark((d) => !d)} className={`grid size-9 place-items-center rounded-full text-fg-muted hover:bg-subtle hover:text-fg ${ring}`}>
              {dark ? <Sun size={17} aria-hidden /> : <Moon size={17} aria-hidden />}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1440px] gap-10 px-4 lg:px-8">
        <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-[260px] shrink-0 overflow-y-auto border-r border-track py-8 pr-6 lg:block">{sidebar}</aside>
        <main className="@container min-w-0 flex-1 py-10 lg:py-12">
          <Page route={route} tier={tier} query={query} />
        </main>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div aria-hidden className="absolute inset-0 bg-black/30" onClick={() => setMenuOpen(false)} />
          <div role="dialog" aria-modal="true" aria-label="Navigation" className="absolute inset-y-0 left-0 w-[300px] max-w-[85vw] overflow-y-auto bg-bg p-5 shadow-[var(--shadow-overlay)]">
            <button type="button" aria-label="Close navigation" onClick={() => setMenuOpen(false)} className={`mb-4 grid size-9 place-items-center rounded-full text-fg-muted hover:bg-subtle ${ring}`}>
              <X size={17} aria-hidden />
            </button>
            {sidebar}
          </div>
        </div>
      )}

      <CommandPalette commands={commands} open={paletteOpen} onOpenChange={setPaletteOpen} placeholder="Search components, blocks and templates" label="Search the kit" />
    </div>
  );
}
