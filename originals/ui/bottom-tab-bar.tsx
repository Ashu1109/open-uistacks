"use client";

import { useId, useRef, useSyncExternalStore, type KeyboardEvent, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useControlled } from "./dialog";

/* Bottom tab bar: a mobile-style navigation bar of icon-and-label tabs with an animated active pill, count badges and Left/Right/Home/End focus movement; it can sit in flow or pin to the bottom of the screen. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

/** Badge text for a count: empty at zero or below, capped as "99+". */
export function formatBadge(count: number, max = 99): string {
  if (count <= 0) return "";
  return count > max ? `${max}+` : String(count);
}

export interface TabBarItem {
  id: string;
  label: string;
  icon: ReactNode;
  /** Unread or pending count shown on the icon. */
  badge?: number;
}

export interface BottomTabBarProps {
  tabs: TabBarItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (id: string) => void;
  /** Pin to the bottom of the viewport instead of sitting in flow. */
  fixed?: boolean;
  /** Names the navigation landmark. */
  label?: string;
  className?: string;
}

export function BottomTabBar({ tabs, value: valueProp, defaultValue, onValueChange, fixed = false, label = "Primary", className = "" }: BottomTabBarProps) {
  const pill = useId();
  const reduce = useReduce();
  const [value, setValue] = useControlled(valueProp, defaultValue ?? tabs[0]?.id, onValueChange as ((id: string | undefined) => void) | undefined);
  const list = useRef<HTMLUListElement>(null);

  const onKeyDown = (e: KeyboardEvent) => {
    const buttons = Array.from(list.current?.querySelectorAll<HTMLElement>("button") ?? []);
    const at = buttons.indexOf(document.activeElement as HTMLElement);
    const target: Record<string, number> = { ArrowRight: at + 1, ArrowLeft: at - 1, Home: 0, End: buttons.length - 1 };
    if (!(e.key in target)) return;
    e.preventDefault();
    buttons[(target[e.key] + buttons.length) % buttons.length]?.focus();
  };

  return (
    <nav
      aria-label={label}
      className={`${fixed ? "fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)]" : ""} rounded-[24px] bg-surface p-1.5 shadow-[var(--shadow-card)] dark:bg-raised ${className}`}
    >
      <ul ref={list} onKeyDown={onKeyDown} className="flex items-stretch">
        {tabs.map((tab) => {
          const current = tab.id === value;
          const badge = formatBadge(tab.badge ?? 0);
          return (
            <li key={tab.id} className="flex-1">
              <button
                type="button"
                aria-current={current ? "page" : undefined}
                onClick={() => setValue(tab.id)}
                className={`relative flex h-14 w-full flex-col items-center justify-center gap-0.5 rounded-[18px] text-[11px] font-medium transition-colors ${current ? "text-select-text" : "text-fg-muted hover:text-fg"} ${ring}`}
              >
                {current && (
                  <motion.span
                    layoutId={`${pill}-pill`}
                    aria-hidden
                    transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 34 }}
                    className="absolute inset-0 rounded-[18px] bg-select-soft"
                  />
                )}
                <span className="relative grid size-6 place-items-center">
                  {tab.icon}
                  {badge && (
                    <span className="absolute -right-2 -top-1 min-w-4 rounded-full bg-danger-solid px-1 text-center text-[10px] font-semibold leading-4 text-white">
                      {badge}
                      <span className="sr-only"> unread</span>
                    </span>
                  )}
                </span>
                <span className="relative">{tab.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
