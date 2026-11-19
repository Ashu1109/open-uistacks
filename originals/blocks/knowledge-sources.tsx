"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Cloud, FileText, Globe, Plus, RefreshCw, Table2 } from "lucide-react";
import { Badge, type BadgeTone } from "../../registry/ui/badge";
import { Button } from "../../registry/ui/button";
import { Switch } from "../../registry/ui/switch";

/* Knowledge sources: a manager for the places an assistant reads from, with each source's sync status, document count, an enable switch, Sync now, and an Add source menu. A full-width section; rows stack their details under the name when the container is narrower than 600px. */

export type SourceStatus = "synced" | "syncing" | "error";
export type SourceKind = "drive" | "web" | "docs" | "sheets";

export interface KnowledgeSource {
  id: string;
  name: string;
  kind: SourceKind;
  status: SourceStatus;
  documents: number;
  /** Already formatted, such as "5 min ago". */
  lastSync: string;
  enabled: boolean;
}

export interface KnowledgeSourcesProps {
  sources?: KnowledgeSource[];
  /** How long a started sync shows "Syncing" in this demo. */
  syncMs?: number;
  onChange?: (sources: KnowledgeSource[]) => void;
  className?: string;
}

const KIND: Record<SourceKind, { label: string; icon: ReactNode }> = {
  drive: { label: "Cloud drive", icon: <Cloud size={18} /> },
  web: { label: "Website", icon: <Globe size={18} /> },
  docs: { label: "Docs space", icon: <FileText size={18} /> },
  sheets: { label: "Spreadsheet", icon: <Table2 size={18} /> },
};

const STATUS: Record<SourceStatus, { label: string; tone: BadgeTone }> = {
  synced: { label: "Synced", tone: "success" },
  syncing: { label: "Syncing", tone: "accent" },
  error: { label: "Sync failed", tone: "danger" },
};

export const DEFAULT_KNOWLEDGE: KnowledgeSource[] = [
  { id: "k1", name: "Team drive", kind: "drive", status: "synced", documents: 1284, lastSync: "5 min ago", enabled: true },
  { id: "k2", name: "help.northwind.example", kind: "web", status: "syncing", documents: 212, lastSync: "Running now", enabled: true },
  { id: "k3", name: "Engineering handbook", kind: "docs", status: "error", documents: 96, lastSync: "Yesterday", enabled: true },
  { id: "k4", name: "Pricing sheet", kind: "sheets", status: "synced", documents: 4, lastSync: "2 days ago", enabled: false },
];

export function totalDocuments(sources: KnowledgeSource[]): number {
  return sources.filter((s) => s.enabled).reduce((sum, s) => sum + s.documents, 0);
}

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export function KnowledgeSources({ sources: initial = DEFAULT_KNOWLEDGE, syncMs = 1800, onChange, className = "" }: KnowledgeSourcesProps) {
  const [sources, setSources] = useState(initial);
  const [menu, setMenu] = useState(false);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const nextId = useRef(initial.length + 1);

  useEffect(() => {
    const live = timers.current;
    return () => {
      live.forEach(clearTimeout);
      live.clear();
    };
  }, []);

  const reported = useRef(sources);
  useEffect(() => {
    if (reported.current === sources) return;
    reported.current = sources;
    onChange?.(sources);
  }, [sources, onChange]);

  const commit = setSources;

  const patch = (id: string, change: Partial<KnowledgeSource>) => commit((prev) => prev.map((s) => (s.id === id ? { ...s, ...change } : s)));

  const sync = (id: string) => {
    patch(id, { status: "syncing", lastSync: "Running now" });
    const t = setTimeout(() => {
      timers.current.delete(t);
      patch(id, { status: "synced", lastSync: "Just now" });
    }, syncMs);
    timers.current.add(t);
  };

  const add = (kind: SourceKind) => {
    const id = `k${nextId.current++}`;
    commit((prev) => [...prev, { id, name: `New ${KIND[kind].label.toLowerCase()}`, kind, status: "syncing", documents: 0, lastSync: "Running now", enabled: true }]);
    setMenu(false);
    const t = setTimeout(() => {
      timers.current.delete(t);
      patch(id, { status: "synced", documents: 40, lastSync: "Just now" });
    }, syncMs);
    timers.current.add(t);
  };

  return (
    <section aria-label="Knowledge sources" className={`@container flex w-full flex-col gap-4 ${className}`}>
      <header className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-semibold text-fg">Knowledge sources</h2>
          <p className="text-[13px] text-fg-muted" aria-live="polite">
            {totalDocuments(sources).toLocaleString("en-US")} documents available to the assistant
          </p>
        </div>
        <div className="relative">
          <Button size="sm" leadingIcon={<Plus />} aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((o) => !o)}>
            Add source
          </Button>
          {menu ? (
            <ul role="menu" aria-label="Source types" onKeyDown={(e) => e.key === "Escape" && setMenu(false)} className="absolute right-0 top-full z-10 mt-2 w-48 rounded-[14px] bg-surface p-1.5 shadow-[var(--shadow-overlay)] dark:bg-raised">
              {(Object.keys(KIND) as SourceKind[]).map((k) => (
                <li key={k} role="none">
                  <button type="button" role="menuitem" onClick={() => add(k)} className={`flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[14px] text-fg hover:bg-[color-mix(in_srgb,var(--fg)_4%,var(--surface))] ${ring}`}>
                    {KIND[k].icon}
                    {KIND[k].label}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </header>
      <ul className="flex flex-col divide-y divide-[var(--border)] rounded-[18px] bg-surface shadow-[var(--shadow-card)]">
        {sources.map((s) => (
          <li key={s.id} className="flex flex-col gap-3 p-4 @[600px]:flex-row @[600px]:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-subtle text-fg-muted" aria-hidden>
                {KIND[s.kind].icon}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[14px] font-medium text-fg">{s.name}</p>
                <p className="truncate text-[12px] text-fg-subtle">
                  {KIND[s.kind].label} · {s.documents.toLocaleString("en-US")} documents · {s.lastSync}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 @[600px]:justify-end">
              <Badge tone={STATUS[s.status].tone} size="md">
                {STATUS[s.status].label}
              </Badge>
              <Button variant="ghost" size="xs" leadingIcon={<RefreshCw />} disabled={s.status === "syncing"} onClick={() => sync(s.id)} aria-label={`Sync ${s.name} now`}>
                Sync now
              </Button>
              <Switch size="sm" checked={s.enabled} onCheckedChange={(enabled) => patch(s.id, { enabled })} aria-label={`Use ${s.name}`} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
