"use client";

import { useState, type ReactNode } from "react";
import { Check } from "lucide-react";

/* Connect apps: a grid of integrations, each with a Connect / Disconnect button that shows a pending state while the async handler runs and reports failures inline. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface ConnectApp {
  id: string;
  name: string;
  description: string;
  icon?: ReactNode;
}

export interface ConnectAppsProps {
  apps: ConnectApp[];
  value?: string[];
  defaultValue?: string[];
  /** Called with the app id and the desired state; reject to show an error. */
  onToggle?: (id: string, connect: boolean) => void | Promise<void>;
  onValueChange?: (ids: string[]) => void;
  className?: string;
}

/** A new list with `id` added or removed. */
export function toggleId(ids: readonly string[], id: string, on: boolean): string[] {
  const rest = ids.filter((x) => x !== id);
  return on ? [...rest, id] : rest;
}

export function ConnectApps({ apps, value, defaultValue = [], onToggle, onValueChange, className = "" }: ConnectAppsProps) {
  const [inner, setInner] = useState(defaultValue);
  const [pending, setPending] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const connected = value ?? inner;

  const toggle = async (id: string) => {
    const connect = !connected.includes(id);
    setPending(id);
    setFailed(null);
    try {
      await onToggle?.(id, connect);
      const next = toggleId(connected, id, connect);
      if (value === undefined) setInner(next);
      onValueChange?.(next);
    } catch {
      setFailed(id);
    } finally {
      setPending(null);
    }
  };

  return (
    <ul aria-label="Apps" className={`grid gap-3 sm:grid-cols-2 ${className}`}>
      {apps.map((a) => {
        const on = connected.includes(a.id);
        return (
          <li key={a.id} className="flex flex-col rounded-[18px] bg-surface p-4 shadow-[var(--shadow-card)] dark:bg-raised">
            <div className="flex items-center gap-3">
              <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-subtle text-sm font-semibold text-fg-muted">{a.icon ?? a.name[0]}</span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-fg">{a.name}</p>
                {on && <p className="flex items-center gap-1 text-xs text-success-text"><Check size={12} aria-hidden /> Connected</p>}
              </div>
            </div>
            <p className="mt-2 flex-1 text-xs leading-relaxed text-fg-muted">{a.description}</p>
            <button type="button" disabled={pending === a.id} aria-label={`${on ? "Disconnect" : "Connect"} ${a.name}`} onClick={() => void toggle(a.id)} className={`mt-3 h-8 rounded-[10px] text-[13px] font-medium transition-colors disabled:opacity-60 ${on ? "bg-subtle text-fg-muted hover:bg-track" : "bg-[image:var(--grad-primary)] text-[var(--inverse-fg)] shadow-[var(--shadow-btn-primary)]"} ${ring}`}>
              {pending === a.id ? (on ? "Disconnecting…" : "Connecting…") : on ? "Disconnect" : "Connect"}
            </button>
            {failed === a.id && <p role="alert" className="mt-2 text-xs text-danger-text">Couldn't reach {a.name}. Try again.</p>}
          </li>
        );
      })}
    </ul>
  );
}
