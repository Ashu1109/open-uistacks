"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";

/* Model fallback: an ordered chain of models tried top to bottom when one fails; each can be switched off and moved up or down. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface FallbackModel {
  id: string;
  name: string;
  detail?: string;
  enabled: boolean;
}

export interface ModelFallbackProps {
  value?: FallbackModel[];
  defaultValue?: FallbackModel[];
  onValueChange?: (models: FallbackModel[]) => void;
  className?: string;
}

/** A new array with the item at `from` moved to `to`; out-of-range moves return a copy unchanged. */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const next = [...items];
  if (from < 0 || from >= next.length || to < 0 || to >= next.length) return next;
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function ModelFallback({ value, defaultValue = [], onValueChange, className = "" }: ModelFallbackProps) {
  const [inner, setInner] = useState(defaultValue);
  const models = value ?? inner;
  const commit = (next: FallbackModel[]) => {
    if (value === undefined) setInner(next);
    onValueChange?.(next);
  };
  const toggle = (id: string) => commit(models.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m)));
  let rank = 0;

  return (
    <ol aria-label="Fallback chain" className={`grid gap-2 ${className}`}>
      {models.map((m, i) => {
        const position = m.enabled ? rank++ : -1;
        return (
          <li key={m.id} className={`flex items-center gap-3 rounded-[14px] bg-surface p-3 shadow-[var(--shadow-card)] dark:bg-raised ${m.enabled ? "" : "opacity-60"}`}>
            <span className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-medium tabular-nums ${m.enabled ? "bg-select-soft text-select-text" : "bg-track text-fg-subtle"}`}>{m.enabled ? position + 1 : "–"}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-fg">{m.name}</p>
              <p className="truncate text-xs text-fg-subtle">{m.enabled ? (position === 0 ? "Primary" : `Fallback ${position}`) : "Skipped"}{m.detail ? ` · ${m.detail}` : ""}</p>
            </div>
            <button type="button" aria-label={`Move ${m.name} up`} disabled={i === 0} onClick={() => commit(moveItem(models, i, i - 1))} className={`grid size-8 place-items-center rounded-lg text-fg-muted hover:bg-subtle disabled:opacity-30 ${ring}`}>
              <ArrowUp size={15} aria-hidden />
            </button>
            <button type="button" aria-label={`Move ${m.name} down`} disabled={i === models.length - 1} onClick={() => commit(moveItem(models, i, i + 1))} className={`grid size-8 place-items-center rounded-lg text-fg-muted hover:bg-subtle disabled:opacity-30 ${ring}`}>
              <ArrowDown size={15} aria-hidden />
            </button>
            <button type="button" role="switch" aria-checked={m.enabled} aria-label={`Use ${m.name}`} onClick={() => toggle(m.id)} className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${m.enabled ? "bg-select" : "bg-track-strong"} ${ring}`}>
              <span className={`absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow transition-transform ${m.enabled ? "translate-x-4" : ""}`} />
            </button>
          </li>
        );
      })}
    </ol>
  );
}
