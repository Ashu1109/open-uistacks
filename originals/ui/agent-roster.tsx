"use client";

import { useRef, useState, type KeyboardEvent } from "react";

/* Agent roster: a keyboard-navigable listbox of agents with role, live status dot and current task; selection is controlled or uncontrolled. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export type AgentStatus = "working" | "idle" | "blocked" | "offline";
export interface RosterAgent {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  task?: string;
}

const DOT: Record<AgentStatus, string> = { working: "var(--select)", idle: "var(--success)", blocked: "var(--warning)", offline: "var(--track-strong)" };
const LABEL: Record<AgentStatus, string> = { working: "Working", idle: "Idle", blocked: "Blocked", offline: "Offline" };

export function statusCounts(agents: RosterAgent[]): Record<AgentStatus, number> {
  const c: Record<AgentStatus, number> = { working: 0, idle: 0, blocked: 0, offline: 0 };
  for (const a of agents) c[a.status] += 1;
  return c;
}

export interface AgentRosterProps {
  agents: RosterAgent[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (id: string) => void;
  className?: string;
}

export function AgentRoster({ agents, value, defaultValue, onValueChange, className = "" }: AgentRosterProps) {
  const [inner, setInner] = useState(defaultValue);
  const selected = value ?? inner;
  const refs = useRef<(HTMLLIElement | null)[]>([]);
  const select = (id: string) => {
    setInner(id);
    onValueChange?.(id);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLLIElement>, i: number) => {
    const move = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: agents.length - 1 }[e.key];
    if (move !== undefined) {
      e.preventDefault();
      refs.current[Math.min(Math.max(move, 0), agents.length - 1)]?.focus();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      select(agents[i].id);
    }
  };
  const focusable = Math.max(0, agents.findIndex((a) => a.id === selected));
  return (
    <ul role="listbox" aria-label="Agents" className={`space-y-1 rounded-[16px] bg-surface p-2 shadow-[var(--shadow-card)] dark:bg-raised ${className}`}>
      {agents.map((a, i) => (
        <li
          key={a.id}
          ref={(el) => { refs.current[i] = el; }}
          role="option"
          aria-selected={a.id === selected}
          tabIndex={i === focusable ? 0 : -1}
          onClick={() => select(a.id)}
          onKeyDown={(e) => onKeyDown(e, i)}
          className={`flex cursor-pointer items-center gap-3 rounded-[12px] px-3 py-2 ${a.id === selected ? "bg-select-soft" : "hover:bg-[color-mix(in_srgb,var(--fg)_4%,var(--surface))]"} ${ring}`}
        >
          <span aria-hidden className={`size-2 shrink-0 rounded-full ${a.status === "working" ? "animate-pulse motion-reduce:animate-none" : ""}`} style={{ background: DOT[a.status] }} />
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-medium text-fg">{a.name} <span className="font-normal text-fg-subtle">· {a.role}</span></span>
            {a.task && <span className="block truncate text-xs text-fg-muted">{a.task}</span>}
          </span>
          <span className="text-xs text-fg-subtle">{LABEL[a.status]}</span>
        </li>
      ))}
    </ul>
  );
}
