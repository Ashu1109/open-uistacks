"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Copy, X } from "lucide-react";
import { useId, useState, useSyncExternalStore, type KeyboardEvent, type ReactNode } from "react";

/* Artifact panel: a side panel for something the assistant made, with Preview and Code tabs, a version switcher, copy and close; the tabs follow the WAI-ARIA arrow-key pattern. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export type ArtifactTab = "preview" | "code";
const TABS: ArtifactTab[] = ["preview", "code"];

/** The tab an arrow, Home or End key moves to, or null. */
export function nextTab(current: ArtifactTab, key: string): ArtifactTab | null {
  const i = TABS.indexOf(current);
  if (key === "ArrowRight") return TABS[(i + 1) % TABS.length];
  if (key === "ArrowLeft") return TABS[(i + TABS.length - 1) % TABS.length];
  if (key === "Home") return TABS[0];
  if (key === "End") return TABS[TABS.length - 1];
  return null;
}

export interface ArtifactVersion {
  id: string;
  label: string;
  code: string;
  preview?: ReactNode;
}

export interface ArtifactPanelProps {
  title: string;
  versions: ArtifactVersion[];
  /** Index of the version shown first; defaults to the latest. */
  defaultVersion?: number;
  defaultTab?: ArtifactTab;
  onClose?: () => void;
  className?: string;
}

export function ArtifactPanel({ title, versions, defaultVersion, defaultTab = "preview", onClose, className = "" }: ArtifactPanelProps) {
  const id = useId();
  const reduce = useReduce();
  const [tab, setTab] = useState<ArtifactTab>(defaultTab);
  const [index, setIndex] = useState(defaultVersion ?? versions.length - 1);
  const [copied, setCopied] = useState(false);
  const version = versions[Math.min(Math.max(index, 0), versions.length - 1)];

  const onTabKey = (e: KeyboardEvent) => {
    const next = nextTab(tab, e.key);
    if (!next) return;
    e.preventDefault();
    setTab(next);
    document.getElementById(`${id}-tab-${next}`)?.focus();
  };
  const copy = () => {
    void navigator.clipboard?.writeText(version.code).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <aside aria-label={title} className={`flex h-96 w-full max-w-xl flex-col overflow-hidden rounded-[20px] bg-surface shadow-[var(--shadow-card)] ${className}`}>
      <header className="flex items-center gap-2 border-b border-track px-3 py-2">
        <h3 className="min-w-0 flex-1 truncate text-sm font-medium text-fg">{title}</h3>
        {versions.length > 1 && (
          <select aria-label="Version" value={index} onChange={(e) => setIndex(Number(e.target.value))} className={`rounded-full bg-subtle px-2 py-1 text-xs text-fg-muted ${ring}`}>
            {versions.map((v, i) => <option key={v.id} value={i}>{v.label}</option>)}
          </select>
        )}
        <button type="button" onClick={copy} aria-label={copied ? "Copied" : "Copy code"} className={`grid size-7 place-items-center rounded-full text-fg-muted hover:bg-subtle ${ring}`}>{copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}</button>
        {onClose && <button type="button" onClick={onClose} aria-label="Close panel" className={`grid size-7 place-items-center rounded-full text-fg-muted hover:bg-subtle ${ring}`}><X size={14} aria-hidden /></button>}
      </header>
      <div role="tablist" aria-label="Artifact view" onKeyDown={onTabKey} className="flex gap-1 px-3 pt-2">
        {TABS.map((t) => (
          <button key={t} id={`${id}-tab-${t}`} role="tab" type="button" aria-selected={tab === t} aria-controls={`${id}-panel`} tabIndex={tab === t ? 0 : -1} onClick={() => setTab(t)} className={`rounded-full px-3 py-1 text-[13px] font-medium capitalize ${tab === t ? "bg-select-soft text-select-text" : "text-fg-muted hover:bg-subtle"} ${ring}`}>{t}</button>
        ))}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${tab}-${version.id}`}
          id={`${id}-panel`}
          role="tabpanel"
          aria-labelledby={`${id}-tab-${tab}`}
          tabIndex={0}
          initial={{ opacity: 0, y: reduce ? 0 : 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 34 }}
          className={`min-h-0 flex-1 overflow-auto p-3 ${ring}`}
        >
          {tab === "code" ? <pre className="whitespace-pre-wrap rounded-[12px] bg-subtle p-3 font-mono text-xs leading-5 text-fg"><code>{version.code}</code></pre> : (version.preview ?? <p className="text-[13px] text-fg-muted">No preview for this version.</p>)}
        </motion.div>
      </AnimatePresence>
    </aside>
  );
}
