"use client";

import { CircleAlert } from "lucide-react";
import { useState, type ReactNode } from "react";

/* Connectors strip: a row of toggleable data-source chips (drive, calendar, repo) showing connected, off or error state; each chip is a switch. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface Connector {
  id: string;
  name: string;
  icon?: ReactNode;
  /** Shown as the chip's error line; the chip cannot be toggled on while set. */
  error?: string;
}

/** Ids that are on after flipping `id`; unknown or errored connectors never turn on. */
export function toggleConnector(active: string[], id: string, connectors: Connector[]): string[] {
  if (active.includes(id)) return active.filter((a) => a !== id);
  return connectors.some((c) => c.id === id && !c.error) ? [...active, id] : active;
}

export interface ConnectorsStripProps {
  connectors: Connector[];
  /** Ids of the connectors that are on. */
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (ids: string[]) => void;
  className?: string;
}

export function ConnectorsStrip({ connectors, value, defaultValue = [], onValueChange, className = "" }: ConnectorsStripProps) {
  const [inner, setInner] = useState(defaultValue);
  const active = value ?? inner;
  const toggle = (id: string) => {
    const next = toggleConnector(active, id, connectors);
    if (value === undefined) setInner(next);
    onValueChange?.(next);
  };
  return (
    <ul aria-label="Connectors" className={`flex flex-wrap gap-2 ${className}`}>
      {connectors.map((c) => {
        const on = active.includes(c.id) && !c.error;
        return (
          <li key={c.id}>
            <button
              type="button"
              role="switch"
              aria-checked={on}
              title={c.error}
              onClick={() => toggle(c.id)}
              className={`inline-flex items-center gap-2 rounded-full py-1.5 pl-2.5 pr-3 text-[13px] font-medium transition-colors ${on ? "bg-select-soft text-select-text" : "bg-surface text-fg-muted shadow-[var(--shadow-btn-secondary)]"} ${c.error ? "text-danger-text" : ""} ${ring}`}
            >
              <span aria-hidden className="grid size-4 place-items-center">{c.error ? <CircleAlert size={14} /> : (c.icon ?? c.name.charAt(0))}</span>
              {c.name}
              <span aria-hidden className={`size-1.5 rounded-full ${c.error ? "bg-danger" : on ? "bg-success" : "bg-track-strong"}`} />
              {c.error && <span className="sr-only">Error: {c.error}</span>}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
