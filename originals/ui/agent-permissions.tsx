"use client";

import { useId, useState } from "react";

/* Agent permissions: one row per tool or scope with a Deny / Ask / Allow segmented choice (native radios, so arrows work) and a summary count. */

export type PermissionLevel = "deny" | "ask" | "allow";

export interface PermissionTool {
  id: string;
  name: string;
  description?: string;
}

export type PermissionMap = Record<string, PermissionLevel>;

export interface AgentPermissionsProps {
  tools: PermissionTool[];
  value?: PermissionMap;
  defaultValue?: PermissionMap;
  onValueChange?: (value: PermissionMap) => void;
  className?: string;
}

const LEVELS: { id: PermissionLevel; label: string; on: string }[] = [
  { id: "deny", label: "Deny", on: "bg-danger-soft text-danger-text" },
  { id: "ask", label: "Ask", on: "bg-warning-soft text-warning-text" },
  { id: "allow", label: "Allow", on: "bg-success-soft text-success-text" },
];

/** "2 allowed · 1 ask · 1 denied"; tools missing from the map count as Ask. */
export function summarize(tools: PermissionTool[], value: PermissionMap): string {
  const count = { allow: 0, ask: 0, deny: 0 };
  for (const t of tools) count[value[t.id] ?? "ask"] += 1;
  return `${count.allow} allowed · ${count.ask} ask · ${count.deny} denied`;
}

export function AgentPermissions({ tools, value, defaultValue = {}, onValueChange, className = "" }: AgentPermissionsProps) {
  const group = useId();
  const [inner, setInner] = useState(defaultValue);
  const map = value ?? inner;
  const set = (id: string, level: PermissionLevel) => {
    const next = { ...map, [id]: level };
    if (value === undefined) setInner(next);
    onValueChange?.(next);
  };

  return (
    <section aria-label="Agent permissions" className={`overflow-hidden rounded-[16px] bg-surface shadow-[var(--shadow-card)] dark:bg-raised ${className}`}>
      <ul className="divide-y divide-track">
        {tools.map((t) => {
          const level = map[t.id] ?? "ask";
          return (
            <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-fg">{t.name}</p>
                {t.description && <p className="text-xs text-fg-muted">{t.description}</p>}
              </div>
              <div role="radiogroup" aria-label={`${t.name} permission`} className="flex rounded-[10px] bg-subtle p-0.5">
                {LEVELS.map((l) => (
                  <label key={l.id} className={`relative cursor-pointer rounded-[8px] px-3 py-1 text-xs font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--select)] ${level === l.id ? l.on : "text-fg-muted hover:text-fg"}`}>
                    <input type="radio" name={`${group}-${t.id}`} value={l.id} checked={level === l.id} onChange={() => set(t.id, l.id)} className="absolute inset-0 cursor-pointer opacity-0" aria-label={`${l.label} ${t.name}`} />
                    {l.label}
                  </label>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
      <p aria-live="polite" className="border-t border-track bg-subtle/60 px-4 py-2 text-xs tabular-nums text-fg-subtle">{summarize(tools, map)}</p>
    </section>
  );
}
