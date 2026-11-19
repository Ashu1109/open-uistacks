"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";

/* Prompt versions: a version history list beside a word-level diff of the selected version against the one before it, with a restore button. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface PromptVersion {
  id: string;
  label: string;
  /** Display date, e.g. "Mar 4". */
  date: string;
  author?: string;
  text: string;
}

export interface PromptVersionsProps {
  /** Oldest first. */
  versions: PromptVersion[];
  selected?: string;
  defaultSelected?: string;
  onSelect?: (id: string) => void;
  onRestore?: (id: string) => void;
  className?: string;
}

export interface DiffPart {
  type: "same" | "add" | "del";
  text: string;
}

/** Word-level diff via longest common subsequence; whitespace is kept as tokens so the parts concatenate back to the text. */
export function diffWords(before: string, after: string): DiffPart[] {
  const a = before.split(/(\s+)/).filter(Boolean);
  const b = after.split(/(\s+)/).filter(Boolean);
  const table = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--) table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
  const raw: DiffPart[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) raw.push({ type: "same", text: a[i++] }), j++;
    else if (j < b.length && (i === a.length || table[i][j + 1] >= table[i + 1][j])) raw.push({ type: "add", text: b[j++] });
    else raw.push({ type: "del", text: a[i++] });
  }
  return raw.reduce<DiffPart[]>((merged, part) => {
    const last = merged[merged.length - 1];
    if (last && last.type === part.type) return [...merged.slice(0, -1), { type: part.type, text: last.text + part.text }];
    return [...merged, part];
  }, []);
}

export function PromptVersions({ versions, selected, defaultSelected, onSelect, onRestore, className = "" }: PromptVersionsProps) {
  const [inner, setInner] = useState(defaultSelected ?? versions[versions.length - 1]?.id);
  const currentId = selected ?? inner;
  const index = Math.max(versions.findIndex((v) => v.id === currentId), 0);
  const version = versions[index];
  if (!version) return null;
  const previous = versions[index - 1];
  const parts = previous ? diffWords(previous.text, version.text) : [{ type: "same" as const, text: version.text }];
  const pick = (id: string) => {
    if (selected === undefined) setInner(id);
    onSelect?.(id);
  };

  return (
    <div className={`grid overflow-hidden rounded-[18px] bg-surface shadow-[var(--shadow-card)] dark:bg-raised sm:grid-cols-[200px_1fr] ${className}`}>
      <ul aria-label="Versions" className="border-b border-track p-2 sm:border-b-0 sm:border-r">
        {[...versions].reverse().map((v) => (
          <li key={v.id}>
            <button type="button" aria-pressed={v.id === version.id} onClick={() => pick(v.id)} className={`w-full rounded-[10px] px-3 py-2 text-left transition-colors ${v.id === version.id ? "bg-select-soft" : "hover:bg-subtle"} ${ring}`}>
              <span className={`block text-[13px] font-medium ${v.id === version.id ? "text-select-text" : "text-fg"}`}>{v.label}</span>
              <span className="block text-xs text-fg-subtle">{v.date}{v.author ? ` · ${v.author}` : ""}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-fg-subtle">{previous ? `Changes from ${previous.label}` : "First version"}</p>
          {onRestore && index < versions.length - 1 && (
            <button type="button" onClick={() => onRestore(version.id)} className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-fg-muted hover:bg-subtle ${ring}`}>
              <RotateCcw size={13} aria-hidden /> Restore {version.label}
            </button>
          )}
        </div>
        <p aria-label="Diff" className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-fg-muted">
          {parts.map((p, k) =>
            p.type === "same" ? <span key={k}>{p.text}</span> : p.type === "add" ? <ins key={k} className="rounded bg-success-soft text-success-text no-underline">{p.text}</ins> : <del key={k} className="rounded bg-danger-soft text-danger-text">{p.text}</del>,
          )}
        </p>
      </div>
    </div>
  );
}
