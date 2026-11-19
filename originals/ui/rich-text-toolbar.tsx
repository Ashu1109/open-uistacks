"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { Bold, Code, Italic, Link2, List, ListOrdered, Strikethrough, Underline, type LucideIcon } from "lucide-react";

/* Rich text toolbar: a formatting toolbar of toggle buttons grouped by purpose; it reports commands and shows which formats are active, and arrows rove focus between buttons. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export type FormatCommand = "bold" | "italic" | "underline" | "strike" | "code" | "link" | "bulletList" | "orderedList";

interface Tool {
  command: FormatCommand;
  label: string;
  icon: LucideIcon;
  shortcut: string;
}

export const TOOL_GROUPS: Tool[][] = [
  [
    { command: "bold", label: "Bold", icon: Bold, shortcut: "Mod+B" },
    { command: "italic", label: "Italic", icon: Italic, shortcut: "Mod+I" },
    { command: "underline", label: "Underline", icon: Underline, shortcut: "Mod+U" },
    { command: "strike", label: "Strikethrough", icon: Strikethrough, shortcut: "Mod+Shift+X" },
  ],
  [
    { command: "bulletList", label: "Bulleted list", icon: List, shortcut: "Mod+Shift+8" },
    { command: "orderedList", label: "Numbered list", icon: ListOrdered, shortcut: "Mod+Shift+7" },
  ],
  [
    { command: "code", label: "Code", icon: Code, shortcut: "Mod+E" },
    { command: "link", label: "Link", icon: Link2, shortcut: "Mod+K" },
  ],
];

const FLAT = TOOL_GROUPS.flat();

export function toggleFormat(active: readonly FormatCommand[], command: FormatCommand): FormatCommand[] {
  return active.includes(command) ? active.filter((c) => c !== command) : [...active, command];
}

export interface RichTextToolbarProps {
  /** Formats currently applied at the cursor. */
  active?: readonly FormatCommand[];
  onCommand: (command: FormatCommand) => void;
  disabled?: boolean;
  className?: string;
}

export function RichTextToolbar({ active = [], onCommand, disabled = false, className = "" }: RichTextToolbarProps) {
  const [focus, setFocus] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: KeyboardEvent) => {
    const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    const edge = e.key === "Home" ? 0 : e.key === "End" ? FLAT.length - 1 : -1;
    if (!delta && edge < 0) return;
    e.preventDefault();
    const next = edge >= 0 ? edge : (focus + delta + FLAT.length) % FLAT.length;
    setFocus(next);
    refs.current[next]?.focus();
  };

  return (
    <div role="toolbar" aria-label="Text formatting" aria-orientation="horizontal" onKeyDown={onKeyDown} className={`inline-flex items-center gap-1 rounded-[14px] bg-surface p-1 shadow-[var(--shadow-card)] ${className}`}>
      {TOOL_GROUPS.map((group, g) => (
        <div key={g} role="group" className={`flex items-center gap-0.5 ${g > 0 ? "border-l border-track pl-1" : ""}`}>
          {group.map((tool) => {
            const index = FLAT.indexOf(tool);
            const on = active.includes(tool.command);
            return (
              <button
                key={tool.command}
                ref={(n) => {
                  refs.current[index] = n;
                }}
                type="button"
                title={`${tool.label} (${tool.shortcut})`}
                aria-label={tool.label}
                aria-pressed={on}
                disabled={disabled}
                tabIndex={index === focus ? 0 : -1}
                onFocus={() => setFocus(index)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onCommand(tool.command)}
                className={`inline-flex size-8 items-center justify-center rounded-[10px] transition-colors disabled:opacity-40 ${on ? "bg-select-soft text-select-text" : "text-fg-muted hover:bg-subtle hover:text-fg"} ${ring}`}
              >
                <tool.icon className="size-4" aria-hidden />
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
