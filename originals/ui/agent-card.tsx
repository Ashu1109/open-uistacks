"use client";

import type { ReactNode } from "react";

/* Agent card: a profile card for an AI agent with initials avatar, status dot, role, model, a couple of stats and tags; clickable when onSelect is given. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export type AgentStatus = "online" | "busy" | "offline";

export interface AgentStat {
  label: string;
  value: string;
}

export interface AgentCardProps {
  name: string;
  role: string;
  model?: string;
  status?: AgentStatus;
  stats?: AgentStat[];
  tags?: string[];
  /** Replaces the initials avatar. */
  avatar?: ReactNode;
  onSelect?: () => void;
  className?: string;
}

export function agentInitials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

const STATUS: Record<AgentStatus, { label: string; dot: string }> = {
  online: { label: "Online", dot: "bg-success" },
  busy: { label: "Working", dot: "bg-warning" },
  offline: { label: "Offline", dot: "bg-track-strong" },
};

export function AgentCard({ name, role, model, status = "online", stats = [], tags = [], avatar, onSelect, className = "" }: AgentCardProps) {
  const body = (
    <>
      <div className="flex items-center gap-3">
        <span aria-hidden className="relative grid size-11 shrink-0 place-items-center rounded-[14px] bg-select-soft text-sm font-medium text-select-text">
          {avatar ?? agentInitials(name)}
          <span className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-surface dark:border-raised ${STATUS[status].dot}`} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-medium text-fg">{name}</p>
          <p className="truncate text-xs text-fg-subtle">{role}{model ? ` · ${model}` : ""}</p>
        </div>
        <span className="ml-auto shrink-0 text-xs text-fg-muted">{STATUS[status].label}</span>
      </div>
      {stats.length > 0 && (
        <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-track pt-3">
          {stats.map((s) => (
            <div key={s.label}>
              <dt className="text-[11px] text-fg-subtle">{s.label}</dt>
              <dd className="text-sm font-medium tabular-nums text-fg">{s.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {tags.length > 0 && (
        <ul aria-label="Skills" className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <li key={t} className="rounded-full bg-subtle px-2.5 py-0.5 text-xs text-fg-muted">{t}</li>
          ))}
        </ul>
      )}
    </>
  );
  const base = `block w-full max-w-sm rounded-[20px] bg-surface p-4 text-left shadow-[var(--shadow-card)] dark:bg-raised ${className}`;
  return onSelect ? (
    <button type="button" onClick={onSelect} className={`${base} transition-transform hover:-translate-y-0.5 motion-reduce:transition-none ${ring}`}>{body}</button>
  ) : (
    <article aria-label={name} className={base}>{body}</article>
  );
}
