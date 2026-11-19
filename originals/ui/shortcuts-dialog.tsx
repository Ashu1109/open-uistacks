"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { Search, X } from "lucide-react";
import { ModalFrame, useControlled } from "./dialog";

/* Shortcuts dialog: a modal cheat sheet of keyboard shortcuts in titled groups with a filter box; "?" toggles it by default, and key names render per platform (Cmd on Mac, Ctrl elsewhere). */

const noSubscribe = () => () => {};
const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

const isMacPlatform = () => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

const MAC_KEYS: Record<string, string> = { mod: "⌘", shift: "⇧", alt: "⌥", ctrl: "⌃", enter: "↵", esc: "⎋", backspace: "⌫", up: "↑", down: "↓", left: "←", right: "→" };
const PC_KEYS: Record<string, string> = { mod: "Ctrl", shift: "Shift", alt: "Alt", ctrl: "Ctrl", enter: "Enter", esc: "Esc", backspace: "Backspace", up: "↑", down: "↓", left: "←", right: "→" };

/** Display names for a key combo; "mod" becomes Cmd on Mac and Ctrl elsewhere. */
export function formatKeys(keys: string[], mac: boolean): string[] {
  const names = mac ? MAC_KEYS : PC_KEYS;
  return keys.map((key) => names[key.toLowerCase()] ?? (key.length === 1 ? key.toUpperCase() : key));
}

export interface Shortcut {
  label: string;
  /** Keys pressed together, such as ["mod", "K"]. */
  keys: string[];
}

export interface ShortcutGroup {
  title: string;
  shortcuts: Shortcut[];
}

/** Keeps the shortcuts whose label contains `query`, dropping groups left empty. */
export function filterShortcuts(groups: ShortcutGroup[], query: string): ShortcutGroup[] {
  const q = query.trim().toLowerCase();
  if (!q) return groups;
  return groups
    .map((g) => ({ ...g, shortcuts: g.shortcuts.filter((s) => s.label.toLowerCase().includes(q) || g.title.toLowerCase().includes(q)) }))
    .filter((g) => g.shortcuts.length > 0);
}

export interface ShortcutsDialogProps {
  groups: ShortcutGroup[];
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Key that toggles the dialog when no text field has focus; pass null to disable. */
  hotkey?: string | null;
  title?: string;
}

export function ShortcutsDialog({ groups, open, defaultOpen, onOpenChange, hotkey = "?", title = "Keyboard shortcuts" }: ShortcutsDialogProps) {
  const id = useId();
  const mac = useSyncExternalStore(noSubscribe, isMacPlatform, () => false);
  const [isOpen, setOpen] = useControlled(open, defaultOpen ?? false, onOpenChange);
  const [query, setQuery] = useState("");
  const toggle = useRef(() => {});
  toggle.current = () => setOpen(!isOpen);
  const shown = filterShortcuts(groups, query);

  useEffect(() => {
    if (!hotkey) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target?.matches("input, textarea, select, [contenteditable='true']");
      if (e.key === hotkey && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        toggle.current();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [hotkey]);

  useEffect(() => {
    if (!isOpen) setQuery("");
  }, [isOpen]);

  return (
    <ModalFrame open={isOpen} onClose={() => setOpen(false)} labelledBy={`${id}-title`} className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-[20px] bg-surface shadow-[var(--shadow-overlay)] dark:bg-raised">
      <div className="flex items-center gap-3 p-5 pb-3">
        <h2 id={`${id}-title`} className="flex-1 text-base font-semibold text-fg">{title}</h2>
        <button type="button" aria-label="Close" onClick={() => setOpen(false)} className={`grid size-8 place-items-center rounded-full text-fg-muted transition-colors hover:bg-subtle hover:text-fg ${ring}`}>
          <X size={16} strokeWidth={2} aria-hidden />
        </button>
      </div>
      <div className="px-5 pb-3">
        <label className="flex h-9 items-center gap-2 rounded-[10px] bg-subtle px-3 text-fg-muted focus-within:ring-2 focus-within:ring-[var(--select)]">
          <Search size={14} strokeWidth={2} aria-hidden />
          <input data-autofocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter shortcuts" aria-label="Filter shortcuts" className="min-w-0 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-fg-subtle" />
        </label>
      </div>
      <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto px-5 pb-5 sm:grid-cols-2">
        {shown.length === 0 && <p className="col-span-full py-6 text-center text-sm text-fg-muted">No shortcuts match.</p>}
        {shown.map((group) => (
          <section key={group.title} aria-label={group.title}>
            <h3 className="mb-2 text-xs font-medium text-fg-subtle">{group.title}</h3>
            <ul className="grid gap-1">
              {group.shortcuts.map((s) => (
                <li key={s.label} className="flex items-center justify-between gap-3 py-1 text-sm text-fg">
                  <span>{s.label}</span>
                  <span className="flex shrink-0 gap-1">
                    {formatKeys(s.keys, mac).map((k, i) => (
                      <kbd key={i} className="min-w-6 rounded-md bg-subtle px-1.5 text-center font-sans text-xs leading-6 text-fg-muted shadow-[var(--shadow-hairline)]">{k}</kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </ModalFrame>
  );
}
