"use client";

import type { ReactNode } from "react";
import { Pause, Play, Square } from "lucide-react";

/* Agent control frame: a bordered viewport around whatever the agent is operating, with a live state badge and Pause / Resume / Stop controls. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export type ControlState = "running" | "paused" | "stopped";

const BADGE: Record<ControlState, { label: string; tone: string; dot: string }> = {
  running: { label: "Agent is working", tone: "bg-select-soft text-select-text", dot: "var(--select)" },
  paused: { label: "Paused", tone: "bg-warning-soft text-warning-text", dot: "var(--warning)" },
  stopped: { label: "Stopped", tone: "bg-subtle text-fg-muted", dot: "var(--series-3)" },
};

export interface AgentControlFrameProps {
  state: ControlState;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
  children?: ReactNode;
  className?: string;
}

export function AgentControlFrame({ state, onPause, onResume, onStop, children, className = "" }: AgentControlFrameProps) {
  const b = BADGE[state];
  const btn = `inline-flex h-7 items-center gap-1 rounded-[8px] px-2 text-xs text-fg hover:bg-subtle ${ring}`;
  return (
    <div
      role="group"
      aria-label="Agent controls"
      className={`overflow-hidden rounded-[18px] bg-surface shadow-[var(--shadow-card)] dark:bg-raised ${state === "running" ? "ring-2 ring-[color-mix(in_srgb,var(--select)_45%,transparent)]" : ""} ${className}`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-track px-3 py-2">
        <span role="status" className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${b.tone}`}>
          <span className={`size-1.5 rounded-full ${state === "running" ? "animate-pulse motion-reduce:animate-none" : ""}`} style={{ background: b.dot }} />
          {b.label}
        </span>
        <div className="flex gap-1">
          {state === "running" && <button type="button" onClick={onPause} className={btn}><Pause size={12} aria-hidden />Pause</button>}
          {state === "paused" && <button type="button" onClick={onResume} className={btn}><Play size={12} aria-hidden />Resume</button>}
          {state !== "stopped" && <button type="button" onClick={onStop} className={`${btn} !text-danger-text`}><Square size={12} aria-hidden />Stop</button>}
        </div>
      </div>
      <div className={`p-4 transition-opacity ${state === "stopped" ? "opacity-60" : ""}`} inert={state !== "running" ? true : undefined}>{children}</div>
    </div>
  );
}
