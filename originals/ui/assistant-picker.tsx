"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";

/* Assistant picker: choose which assistant to talk to from a radio group of cards (avatar, name, one-line purpose); arrows move and select, as a radio group should. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface Assistant {
  id: string;
  name: string;
  description: string;
  icon?: ReactNode;
  disabled?: boolean;
}

/** Next enabled index from `from` in direction `dir`, wrapping; `from` itself when nothing else is enabled. */
export function nextAssistant(assistants: Assistant[], from: number, dir: 1 | -1): number {
  const n = assistants.length;
  for (let i = 1; i <= n; i++) {
    const j = (from + dir * i + n * i) % n;
    if (!assistants[j].disabled) return j;
  }
  return from;
}

export interface AssistantPickerProps {
  assistants: Assistant[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (id: string) => void;
  label?: string;
  className?: string;
}

export function AssistantPicker({ assistants, value: valueProp, defaultValue, onValueChange, label = "Assistant", className = "" }: AssistantPickerProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const [inner, setInner] = useState(defaultValue ?? assistants.find((a) => !a.disabled)?.id);
  const value = valueProp ?? inner;
  const selectedIndex = assistants.findIndex((a) => a.id === value);
  const tabStop = selectedIndex >= 0 ? selectedIndex : assistants.findIndex((a) => !a.disabled);

  const choose = (i: number) => {
    const a = assistants[i];
    if (!a || a.disabled) return;
    if (valueProp === undefined) setInner(a.id);
    onValueChange?.(a.id);
    refs.current[i]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent, i: number) => {
    const dir = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (dir) {
      e.preventDefault();
      choose(nextAssistant(assistants, i, dir));
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      choose(e.key === "Home" ? nextAssistant(assistants, -1, 1) : nextAssistant(assistants, assistants.length, -1));
    }
  };

  return (
    <div role="radiogroup" aria-label={label} className={`grid w-full max-w-lg gap-2 sm:grid-cols-2 ${className}`}>
      {assistants.map((a, i) => {
        const on = a.id === value;
        return (
          <button
            key={a.id}
            ref={(el) => { refs.current[i] = el; }}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={a.disabled}
            tabIndex={i === tabStop ? 0 : -1}
            onClick={() => choose(i)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`flex items-start gap-3 rounded-[16px] p-3 text-left transition-shadow disabled:opacity-40 ${on ? "bg-select-soft shadow-[0_0_0_2px_var(--select)]" : "bg-surface shadow-[var(--shadow-card)] hover:bg-[color-mix(in_srgb,var(--fg)_4%,var(--surface))]"} ${ring}`}
          >
            <span aria-hidden className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold ${on ? "bg-select text-[var(--on-feature)]" : "bg-subtle text-fg-muted"}`}>{a.icon ?? a.name.charAt(0)}</span>
            <span className="min-w-0">
              <span className="block text-[13px] font-medium text-fg">{a.name}</span>
              <span className="line-clamp-2 text-xs leading-4 text-fg-muted">{a.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
