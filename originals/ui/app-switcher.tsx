"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type FocusEvent, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { LayoutGrid } from "lucide-react";

/* App switcher: a grid-icon button that opens a popover of app tiles; arrow keys move across the grid, Escape closes and returns focus, and the current app is marked. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

/** The tile index reached from `index` by `key` in a grid `columns` wide holding `count` tiles; unchanged at an edge. */
export function gridMove(index: number, key: string, columns: number, count: number): number {
  const moves: Record<string, number> = {
    ArrowRight: index + 1 < count ? index + 1 : index,
    ArrowLeft: index > 0 ? index - 1 : index,
    ArrowDown: index + columns < count ? index + columns : index,
    ArrowUp: index - columns >= 0 ? index - columns : index,
    Home: 0,
    End: count - 1,
  };
  return moves[key] ?? index;
}

export interface AppItem {
  id: string;
  name: string;
  icon: ReactNode;
  /** Renders the tile as a link when set, otherwise as a button. */
  href?: string;
}

export interface AppSwitcherProps {
  apps: AppItem[];
  currentId?: string;
  onSelect?: (app: AppItem) => void;
  columns?: number;
  /** Names the trigger button and the popover. */
  label?: string;
  align?: "start" | "end";
  className?: string;
}

export function AppSwitcher({ apps, currentId, onSelect, columns = 3, label = "Switch app", align = "end", className = "" }: AppSwitcherProps) {
  const id = useId();
  const reduce = useReduce();
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const tiles = useRef<(HTMLElement | null)[]>([]);

  const close = (refocus: boolean) => {
    setOpen(false);
    if (refocus) button.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    const current = Math.max(0, apps.findIndex((a) => a.id === currentId));
    setFocused(current);
    tiles.current[current]?.focus();
  }, [open, apps, currentId]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      return close(true);
    }
    const at = tiles.current.indexOf(document.activeElement as HTMLElement);
    const next = gridMove(at < 0 ? 0 : at, e.key, columns, apps.length);
    if (next === at && !["Home", "End"].includes(e.key)) return;
    if (!e.key.startsWith("Arrow") && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    setFocused(next);
    tiles.current[next]?.focus();
  };

  const onBlur = (e: FocusEvent) => {
    if (!root.current?.contains(e.relatedTarget as Node | null) && e.relatedTarget) setOpen(false);
  };

  const hidden = reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -4 };
  return (
    <div ref={root} onBlur={onBlur} className={`relative inline-block ${className}`}>
      <button
        ref={button}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={open ? `${id}-panel` : undefined}
        onClick={() => setOpen((o) => !o)}
        className={`grid size-9 place-items-center rounded-full text-fg-muted transition-colors hover:bg-subtle hover:text-fg ${open ? "bg-subtle text-fg" : ""} ${ring}`}
      >
        <LayoutGrid size={18} strokeWidth={2} aria-hidden />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            id={`${id}-panel`}
            role="group"
            aria-label={label}
            onKeyDown={onKeyDown}
            initial={hidden}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={hidden}
            transition={{ type: "spring", stiffness: 520, damping: 34 }}
            style={{ transformOrigin: `top ${align === "end" ? "right" : "left"}`, gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
            className={`absolute top-full z-50 mt-2 grid w-max gap-1 rounded-[20px] bg-surface p-2 shadow-[var(--shadow-overlay)] dark:bg-raised ${align === "end" ? "right-0" : "left-0"}`}
          >
            {apps.map((app, i) => {
              const props = {
                ref: (el: HTMLElement | null) => {
                  tiles.current[i] = el;
                },
                tabIndex: i === focused ? 0 : -1,
                "aria-current": app.id === currentId ? ("true" as const) : undefined,
                onClick: () => {
                  onSelect?.(app);
                  if (!app.href) close(true);
                },
                className: `flex w-24 flex-col items-center gap-2 rounded-[14px] px-2 py-3 text-center text-[13px] font-medium text-fg transition-colors hover:bg-subtle ${app.id === currentId ? "bg-select-soft text-select-text" : ""} ${ring}`,
              };
              const body = (
                <>
                  <span aria-hidden className="grid size-10 place-items-center rounded-[12px] bg-subtle text-fg dark:bg-bg">{app.icon}</span>
                  <span className="w-full truncate">{app.name}</span>
                </>
              );
              return app.href ? (
                <a key={app.id} href={app.href} {...props}>{body}</a>
              ) : (
                <button key={app.id} type="button" {...props}>{body}</button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
