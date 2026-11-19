"use client";

import { useRef, useState, type KeyboardEvent } from "react";

/* Trust level: a segmented radio group for how much autonomy an agent gets, from asking every time to fully autonomous, with the chosen level explained below. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface TrustOption {
  id: string;
  label: string;
  description: string;
}

export const DEFAULT_TRUST_LEVELS: TrustOption[] = [
  { id: "ask", label: "Ask", description: "Asks before every action." },
  { id: "risky", label: "Ask when risky", description: "Runs safe actions, asks before anything destructive or costly." },
  { id: "edits", label: "Auto-edit", description: "Edits freely, asks before commands and external calls." },
  { id: "auto", label: "Autonomous", description: "Acts without asking. Review the activity log afterwards." },
];

export interface TrustLevelProps {
  levels?: TrustOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (id: string) => void;
  className?: string;
}

export function TrustLevel({ levels = DEFAULT_TRUST_LEVELS, value, defaultValue, onValueChange, className = "" }: TrustLevelProps) {
  const [inner, setInner] = useState(defaultValue ?? levels[0]?.id);
  const current = value ?? inner;
  const index = Math.max(0, levels.findIndex((l) => l.id === current));
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const choose = (i: number) => {
    const next = levels[(i + levels.length) % levels.length];
    setInner(next.id);
    onValueChange?.(next.id);
    refs.current[(i + levels.length) % levels.length]?.focus();
  };
  const onKeyDown = (e: KeyboardEvent) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (step !== undefined) {
      e.preventDefault();
      choose(index + step);
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      choose(e.key === "Home" ? 0 : levels.length - 1);
    }
  };
  return (
    <div className={className}>
      <div role="radiogroup" aria-label="Trust level" onKeyDown={onKeyDown} className="grid rounded-[14px] bg-subtle p-1" style={{ gridTemplateColumns: `repeat(${levels.length}, minmax(0, 1fr))` }}>
        {levels.map((l, i) => (
          <button
            key={l.id}
            ref={(el) => { refs.current[i] = el; }}
            type="button"
            role="radio"
            aria-checked={i === index}
            tabIndex={i === index ? 0 : -1}
            onClick={() => choose(i)}
            className={`h-9 rounded-[10px] px-2 text-[13px] transition-colors ${i === index ? "bg-surface text-fg shadow-[var(--shadow-card)] dark:bg-raised" : "text-fg-muted hover:text-fg"} ${ring}`}
          >
            {l.label}
          </button>
        ))}
      </div>
      <p aria-live="polite" className="mt-2 px-1 text-xs text-fg-muted">{levels[index]?.description}</p>
    </div>
  );
}
