"use client";

import { useEffect, useRef, useSyncExternalStore, type KeyboardEvent, type ReactElement, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check } from "lucide-react";
import { cloneTrigger, useControlled } from "./dialog";
import { pickSide } from "./model-picker";

/* Dropdown menu: a button-triggered menu following the WAI-ARIA menu pattern (arrow keys, Home/End, typeahead, Escape) that flips to stay inside the viewport; MenuItems is the shared list the context menu and filter bar reuse. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const hoverTint = "focus:bg-[color-mix(in_srgb,var(--fg)_6%,transparent)]";

export interface MenuItemEntry {
  id: string;
  label: string;
  icon?: ReactNode;
  /** Display-only hint such as "⌘K". */
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
  /** Turns the item into a checkbox item. */
  checked?: boolean;
  /** Leave the menu open after selecting, for checkbox lists. */
  keepOpen?: boolean;
  onSelect?: () => void;
}

export type MenuEntry = ({ type?: "item" } & MenuItemEntry) | { type: "separator"; id: string } | { type: "label"; id: string; label: string };

/** The index of the next label starting with `query`, searching after `from` for one letter and from `from` for longer prefixes; -1 when none match. */
export function typeaheadIndex(labels: string[], from: number, query: string): number {
  const q = query.toLowerCase();
  const start = q.length > 1 ? Math.max(from, 0) : from + 1;
  for (let i = 0; i < labels.length; i++) {
    const at = (((start + i) % labels.length) + labels.length) % labels.length;
    if (labels[at].toLowerCase().startsWith(q)) return at;
  }
  return -1;
}

/** Flips a menu anchored at (x, y) to the other side of that point when it would overflow the viewport. */
export function placeMenu(x: number, y: number, width: number, height: number, viewportW: number, viewportH: number, margin = 8) {
  return {
    left: x + width + margin > viewportW ? Math.max(margin, x - width) : x,
    top: y + height + margin > viewportH ? Math.max(margin, y - height) : y,
  };
}

/** The preferred horizontal alignment unless it lacks room and the other has more. */
export function pickAlign(preferred: "start" | "end", roomLeft: number, roomRight: number, needed = 224): "start" | "end" {
  const room = preferred === "start" ? roomRight : roomLeft;
  const other = preferred === "start" ? roomLeft : roomRight;
  if (room >= needed || room >= other) return preferred;
  return preferred === "start" ? "end" : "start";
}

export interface MenuItemsProps {
  entries: MenuEntry[];
  label: string;
  /** Called after a selection (refocus true), on Escape (true) and on Tab (false). */
  onClose: (refocus: boolean) => void;
  className?: string;
}

export function MenuItems({ entries, label, onClose, className = "" }: MenuItemsProps) {
  const root = useRef<HTMLDivElement>(null);
  const buffer = useRef({ text: "", timer: 0 });
  const enabled = () => Array.from(root.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]:not([aria-disabled="true"])') ?? []);

  useEffect(() => {
    enabled()[0]?.focus();
    const pending = buffer.current;
    return () => window.clearTimeout(pending.timer);
  }, []);

  const onKeyDown = (e: KeyboardEvent) => {
    const items = enabled();
    const at = items.indexOf(document.activeElement as HTMLElement);
    const focusAt = (i: number) => items[(i + items.length) % items.length]?.focus();
    if (e.key === "Tab") return onClose(false);
    if (e.key === "Escape") {
      e.preventDefault();
      return onClose(true);
    }
    if (e.key === "ArrowDown") focusAt(at + 1);
    else if (e.key === "ArrowUp") focusAt(at < 0 ? -1 : at - 1);
    else if (e.key === "Home") focusAt(0);
    else if (e.key === "End") focusAt(-1);
    else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && e.key !== " ") {
      buffer.current.text += e.key;
      window.clearTimeout(buffer.current.timer);
      buffer.current.timer = window.setTimeout(() => (buffer.current.text = ""), 500);
      const hit = typeaheadIndex(items.map((el) => el.dataset.label ?? ""), at, buffer.current.text);
      if (hit >= 0) items[hit].focus();
      return;
    } else return;
    e.preventDefault();
  };

  return (
    <div ref={root} role="menu" aria-label={label} onKeyDown={onKeyDown} className={`rounded-[16px] bg-surface p-1.5 shadow-[var(--shadow-overlay)] dark:bg-raised ${className}`}>
      {entries.map((entry) => {
        if (entry.type === "separator") return <div key={entry.id} role="separator" className="mx-1 my-1.5 h-px bg-track" />;
        if (entry.type === "label") return <div key={entry.id} role="presentation" className="px-2.5 pb-1 pt-2 text-xs font-medium text-fg-subtle">{entry.label}</div>;
        const checkable = entry.checked !== undefined;
        return (
          <button
            key={entry.id}
            type="button"
            role={checkable ? "menuitemcheckbox" : "menuitem"}
            aria-checked={checkable ? entry.checked : undefined}
            aria-disabled={entry.disabled || undefined}
            data-label={entry.label}
            tabIndex={-1}
            onPointerEnter={(e) => !entry.disabled && e.currentTarget.focus()}
            onClick={() => {
              if (entry.disabled) return;
              entry.onSelect?.();
              if (!entry.keepOpen) onClose(true);
            }}
            className={`flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-1.5 text-left text-sm outline-none ${hoverTint} ${entry.danger ? "text-danger-text" : "text-fg"} ${entry.disabled ? "opacity-45" : ""}`}
          >
            {checkable && <Check size={14} strokeWidth={2.25} aria-hidden className={entry.checked ? "" : "invisible"} />}
            {entry.icon && <span className="shrink-0 text-fg-muted">{entry.icon}</span>}
            <span className="min-w-0 flex-1 truncate">{entry.label}</span>
            {entry.shortcut && <span className="shrink-0 text-xs text-fg-subtle">{entry.shortcut}</span>}
          </button>
        );
      })}
    </div>
  );
}

export interface DropdownMenuProps {
  /** The button that opens the menu; it receives aria-haspopup, aria-expanded and key handlers. */
  trigger: ReactElement;
  items: MenuEntry[];
  /** Names the menu for screen readers. */
  label?: string;
  /** Preferred side; it flips when the viewport lacks room. */
  placement?: "top" | "bottom";
  align?: "start" | "end";
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

export function DropdownMenu({ trigger, items, label = "Menu", placement = "bottom", align = "start", open, defaultOpen, onOpenChange, className = "" }: DropdownMenuProps) {
  const reduce = useReduce();
  const [isOpen, setOpen] = useControlled(open, defaultOpen ?? false, onOpenChange);
  const side = useRef(placement);
  const alignment = useRef(align);
  const root = useRef<HTMLDivElement>(null);

  const show = () => {
    const rect = root.current?.getBoundingClientRect();
    if (rect) {
      side.current = pickSide(placement, rect.top, window.innerHeight - rect.bottom, 280);
      alignment.current = pickAlign(align, rect.right, window.innerWidth - rect.left);
    }
    setOpen(true);
  };
  const hide = (refocus: boolean) => {
    setOpen(false);
    if (refocus) root.current?.querySelector<HTMLElement>("[aria-haspopup]")?.focus();
  };

  useEffect(() => {
    if (!isOpen) return;
    const outside = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  });

  const top = side.current === "top";
  const hidden = reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: top ? 4 : -4 };
  return (
    <div ref={root} className={`relative inline-block ${className}`}>
      {cloneTrigger(trigger, {
        "aria-haspopup": "menu",
        "aria-expanded": isOpen,
        onClick: () => (isOpen ? hide(false) : show()),
        onKeyDown: (e: KeyboardEvent) => {
          if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
          e.preventDefault();
          show();
        },
      })}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={hidden}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={hidden}
            transition={{ type: "spring", stiffness: 520, damping: 34 }}
            style={{ transformOrigin: `${top ? "bottom" : "top"} ${alignment.current === "end" ? "right" : "left"}` }}
            className={`absolute z-50 min-w-52 ${top ? "bottom-full mb-2" : "top-full mt-2"} ${alignment.current === "end" ? "right-0" : "left-0"}`}
          >
            <MenuItems entries={items} label={label} onClose={hide} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
