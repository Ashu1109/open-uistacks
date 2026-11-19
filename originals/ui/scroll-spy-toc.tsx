"use client";

import { useEffect, useId, useRef, useSyncExternalStore, type MouseEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useControlled } from "./dialog";

/* Scroll-spy table of contents: a list of in-page links that highlights the section currently in view using an IntersectionObserver (skipped where unavailable), animates its marker between entries and scrolls smoothly on click. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface TocItem {
  /** The id of the heading or section element this entry points at. */
  id: string;
  label: string;
  level?: 1 | 2 | 3;
}

/** The first visible id in document order, or `current` when nothing is visible so the last section stays lit. */
export function pickActive(order: string[], visible: ReadonlySet<string>, current: string | undefined): string | undefined {
  return order.find((id) => visible.has(id)) ?? current;
}

export interface ScrollSpyTocProps {
  items: TocItem[];
  activeId?: string;
  defaultActiveId?: string;
  onActiveChange?: (id: string) => void;
  /** Scroll container to observe; defaults to the viewport. */
  root?: Element | null;
  /** IntersectionObserver margin; the default counts a section as current while its top is in the upper third. */
  rootMargin?: string;
  label?: string;
  className?: string;
}

export function ScrollSpyToc({ items, activeId: activeProp, defaultActiveId, onActiveChange, root = null, rootMargin = "0px 0px -66% 0px", label = "On this page", className = "" }: ScrollSpyTocProps) {
  const reduce = useReduce();
  const marker = useId();
  const [active, setActive] = useControlled<string | undefined>(activeProp, defaultActiveId ?? items[0]?.id, onActiveChange as ((id: string | undefined) => void) | undefined);
  const visible = useRef(new Set<string>());
  const activeRef = useRef(active);
  activeRef.current = active;
  const setActiveRef = useRef(setActive);
  setActiveRef.current = setActive;
  const key = items.map((i) => i.id).join("|");

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const order = key.split("|");
    const seen = visible.current;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) seen.add(entry.target.id);
          else seen.delete(entry.target.id);
        }
        const next = pickActive(order, seen, activeRef.current);
        if (next !== activeRef.current) setActiveRef.current(next);
      },
      { root, rootMargin },
    );
    for (const id of order) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => {
      observer.disconnect();
      seen.clear();
    };
  }, [key, root, rootMargin]);

  const onClick = (e: MouseEvent, id: string) => {
    const target = document.getElementById(id);
    setActive(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView?.({ behavior: reduce ? "auto" : "smooth", block: "start" });
    window.history?.replaceState?.(null, "", `#${id}`);
  };

  return (
    <nav aria-label={label} className={className}>
      <p className="mb-2 text-xs font-medium text-fg-subtle">{label}</p>
      <ul className="grid border-l border-track">
        {items.map((item) => {
          const current = item.id === active;
          return (
            <li key={item.id} className="relative">
              {current && (
                <motion.span
                  layoutId={`${marker}-marker`}
                  aria-hidden
                  transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 34 }}
                  className="absolute -left-px bottom-1 top-1 w-0.5 rounded-full bg-select"
                />
              )}
              <a
                href={`#${item.id}`}
                aria-current={current ? "location" : undefined}
                onClick={(e) => onClick(e, item.id)}
                style={{ paddingLeft: 12 + ((item.level ?? 1) - 1) * 12 }}
                className={`block rounded-r-[8px] py-1.5 pr-2 text-sm transition-colors ${current ? "font-medium text-select-text" : "text-fg-muted hover:text-fg"} ${ring}`}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
