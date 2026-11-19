"use client";

import { Check } from "lucide-react";
import { formatTokens } from "./context-meter";

/* Model card: a selectable summary of a model with provider, description, context window, per-million-token prices and capability tags. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

/** $3, $0.25, Free. */
export function formatPrice(usdPerMillion: number): string {
  if (usdPerMillion === 0) return "Free";
  return `$${Number.isInteger(usdPerMillion) ? usdPerMillion : usdPerMillion.toFixed(2).replace(/0$/, "")}`;
}

export interface ModelCardProps {
  name: string;
  provider: string;
  description?: string;
  contextWindow: number;
  inputPrice: number;
  outputPrice: number;
  capabilities?: string[];
  selected?: boolean;
  onSelect?: () => void;
  className?: string;
}

export function ModelCard({ name, provider, description, contextWindow, inputPrice, outputPrice, capabilities = [], selected = false, onSelect, className = "" }: ModelCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`block w-full rounded-[16px] bg-surface p-4 text-left shadow-[var(--shadow-card)] transition-shadow dark:bg-raised ${selected ? "ring-2 ring-[var(--select)]" : "hover:shadow-[var(--shadow-overlay)]"} ${ring} ${className}`}
    >
      <span className="flex items-start justify-between gap-2">
        <span>
          <span className="block text-sm font-medium text-fg">{name}</span>
          <span className="block text-xs text-fg-subtle">{provider}</span>
        </span>
        {selected && <span className="grid size-5 place-items-center rounded-full bg-select text-[var(--inverse-fg)]"><Check size={12} aria-hidden /><span className="sr-only">Selected</span></span>}
      </span>
      {description && <span className="mt-2 block text-[13px] text-fg-muted">{description}</span>}
      <span className="mt-3 grid grid-cols-3 gap-2 text-xs tabular-nums">
        {[["Context", formatTokens(contextWindow)], ["Input / 1M", formatPrice(inputPrice)], ["Output / 1M", formatPrice(outputPrice)]].map(([k, v]) => (
          <span key={k} className="rounded-[10px] bg-subtle px-2 py-1.5">
            <span className="block text-fg-subtle">{k}</span>
            <span className="block text-fg">{v}</span>
          </span>
        ))}
      </span>
      {capabilities.length > 0 && (
        <span className="mt-3 flex flex-wrap gap-1.5">
          {capabilities.map((c) => <span key={c} className="rounded-full bg-select-soft px-2 py-0.5 text-[11px] text-select-text">{c}</span>)}
        </span>
      )}
    </button>
  );
}
