"use client";

import { useState } from "react";
import { ArrowRight, Zap } from "lucide-react";

/* Automation card: a trigger-to-action rule with an on/off switch, last run time and run count; the switch is controlled or uncontrolled. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface AutomationCardProps {
  name: string;
  trigger: string;
  action: string;
  lastRun?: string;
  runCount?: number;
  enabled?: boolean;
  defaultEnabled?: boolean;
  onEnabledChange?: (enabled: boolean) => void;
  className?: string;
}

export function AutomationCard({ name, trigger, action, lastRun, runCount, enabled, defaultEnabled = true, onEnabledChange, className = "" }: AutomationCardProps) {
  const [inner, setInner] = useState(defaultEnabled);
  const on = enabled ?? inner;
  const toggle = () => {
    setInner(!on);
    onEnabledChange?.(!on);
  };
  return (
    <article aria-label={name} className={`rounded-[16px] bg-surface p-4 shadow-[var(--shadow-card)] dark:bg-raised ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <h4 className="flex items-center gap-2 text-sm font-medium text-fg"><Zap size={14} aria-hidden className={on ? "text-warning" : "text-fg-subtle"} />{name}</h4>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label={`${name} enabled`}
          onClick={toggle}
          className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${on ? "bg-select" : "bg-track-strong"} ${ring}`}
        >
          <span className={`absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow transition-transform ${on ? "translate-x-4" : ""}`} />
        </button>
      </div>
      <div className={`mt-3 flex items-center gap-2 text-[13px] ${on ? "text-fg" : "text-fg-subtle"}`}>
        <span className="rounded-[8px] bg-subtle px-2 py-1">{trigger}</span>
        <ArrowRight size={13} aria-hidden className="shrink-0 text-fg-subtle" />
        <span className="rounded-[8px] bg-subtle px-2 py-1">{action}</span>
      </div>
      {(lastRun || runCount !== undefined) && (
        <p className="mt-3 text-xs tabular-nums text-fg-subtle">{lastRun && `Last run ${lastRun}`}{lastRun && runCount !== undefined && " · "}{runCount !== undefined && `${runCount} runs`}</p>
      )}
    </article>
  );
}
