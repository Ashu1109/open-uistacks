"use client";

import { useState } from "react";
import { Check } from "lucide-react";

/* Attempt compare: side-by-side cards for several agent attempts at the same task, with metrics per attempt and a radio-style "keep this one" choice. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface AttemptMetric {
  label: string;
  value: string;
}

export interface Attempt {
  id: string;
  label: string;
  model?: string;
  output: string;
  metrics?: AttemptMetric[];
}

export interface AttemptCompareProps {
  attempts: Attempt[];
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (id: string) => void;
  className?: string;
}

/** Index to move to from `from` on an arrow key, wrapping at both ends. */
export function stepAttempt(count: number, from: number, delta: 1 | -1): number {
  return count === 0 ? -1 : (from + delta + count) % count;
}

export function AttemptCompare({ attempts, value, defaultValue = null, onValueChange, className = "" }: AttemptCompareProps) {
  const [inner, setInner] = useState<string | null>(defaultValue);
  const current = value === undefined ? inner : value;
  const choose = (id: string) => {
    if (value === undefined) setInner(id);
    onValueChange?.(id);
  };
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const delta = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const radios = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]'));
    const next = radios[stepAttempt(radios.length, radios.indexOf(document.activeElement as HTMLButtonElement), delta)];
    next?.focus();
    next?.click();
  };

  return (
    <div role="radiogroup" aria-label="Attempts" onKeyDown={onKeyDown} className={`grid gap-3 ${className}`} style={{ gridTemplateColumns: `repeat(${Math.max(attempts.length, 1)}, minmax(0, 1fr))` }}>
      {attempts.map((a, i) => {
        const selected = a.id === current;
        return (
          <div key={a.id} className={`flex flex-col rounded-[16px] bg-surface p-4 transition-shadow dark:bg-raised ${selected ? "shadow-[0_0_0_2px_var(--select)]" : "shadow-[var(--shadow-card)]"}`}>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[13px] font-medium text-fg">{a.label}</p>
                {a.model && <p className="text-xs text-fg-subtle">{a.model}</p>}
              </div>
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={`Keep ${a.label}`}
                tabIndex={selected || (current === null && i === 0) ? 0 : -1}
                onClick={() => choose(a.id)}
                className={`grid size-6 place-items-center rounded-full transition-colors ${selected ? "bg-select text-[var(--inverse-fg)]" : "bg-track text-transparent hover:bg-track-strong"} ${ring}`}
              >
                <Check size={14} aria-hidden />
              </button>
            </div>
            <p className="mt-3 flex-1 whitespace-pre-wrap text-sm leading-relaxed text-fg-muted">{a.output}</p>
            {a.metrics && (
              <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-track pt-3">
                {a.metrics.map((m) => (
                  <div key={m.label}>
                    <dt className="text-[11px] text-fg-subtle">{m.label}</dt>
                    <dd className="text-[13px] tabular-nums text-fg">{m.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        );
      })}
    </div>
  );
}
