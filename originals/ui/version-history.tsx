"use client";

import { useId, useState, useSyncExternalStore } from "react";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { RotateCcw } from "lucide-react";
import { formatRelativeTime } from "./activity-feed";

/* Version history: a list of saved versions with author and relative time; selecting one marks it, and older versions offer a restore action. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const SPRING = { type: "spring", stiffness: 480, damping: 36 } as const;

/** Entrance props: rise and fade in, staggered by index; reduced motion only fades. */
const enter = (i: number, reduce: boolean) =>
  reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.15 } }
    : { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, transition: { ...SPRING, delay: Math.min(i, 10) * 0.04 } };

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface DocVersion {
  id: string;
  label: string;
  author: string;
  at: Date | number;
  summary?: string;
}

export interface VersionHistoryProps {
  /** Newest first; the first entry is treated as the current version. */
  versions: DocVersion[];
  selectedId?: string;
  defaultSelectedId?: string;
  onSelect?: (id: string) => void;
  onRestore?: (id: string) => void;
  now?: Date | number;
  className?: string;
}

export function VersionHistory({ versions, selectedId, defaultSelectedId, onSelect, onRestore, now, className = "" }: VersionHistoryProps) {
  const reduce = useReduce();
  const groupId = useId();
  const [inner, setInner] = useState(defaultSelectedId ?? versions[0]?.id);
  const selected = selectedId ?? inner;
  const choose = (id: string) => {
    setInner(id);
    onSelect?.(id);
  };
  return (
    <LayoutGroup id={groupId}>
    <ol aria-label="Version history" className={`grid gap-1 ${className}`}>
      {versions.map((v, i) => {
        const current = i === 0;
        const active = v.id === selected;
        return (
          <motion.li key={v.id} {...enter(i, reduce)} className="relative isolate flex items-center gap-2 rounded-[14px] p-1">
            {active && (
              <motion.span
                aria-hidden
                layoutId={reduce ? undefined : "version-selected"}
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
                className="absolute inset-0 -z-10 rounded-[14px] bg-select-soft"
              />
            )}
            <motion.button type="button" whileTap={reduce ? undefined : { scale: 0.99 }} aria-current={active ? "true" : undefined} onClick={() => choose(v.id)} className={`flex min-w-0 flex-1 items-start gap-3 rounded-[12px] px-2.5 py-2 text-left transition-colors hover:bg-[color-mix(in_srgb,var(--fg)_4%,transparent)] ${ring}`}>
              <span aria-hidden className={`mt-1.5 size-2 shrink-0 rounded-full ${current ? "bg-success" : "bg-track-strong"}`} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-sm font-medium text-fg">
                  {v.label}
                  {current && <span className="rounded-full bg-success-soft px-1.5 text-[11px] font-medium text-success-text">Current</span>}
                </span>
                <span className="block text-xs text-fg-muted">{v.author} · <time dateTime={new Date(v.at).toISOString()}>{formatRelativeTime(v.at, now)}</time></span>
                {v.summary && <span className="mt-0.5 block truncate text-xs text-fg-subtle">{v.summary}</span>}
              </span>
            </motion.button>
            {!current && onRestore && (
              <motion.button type="button" aria-label={`Restore ${v.label}`} whileHover={reduce ? undefined : { rotate: -90 }} whileTap={reduce ? undefined : { scale: 0.92 }} transition={{ type: "spring", stiffness: 420, damping: 26 }} onClick={() => onRestore(v.id)} className={`grid size-8 shrink-0 place-items-center rounded-[10px] text-fg-muted transition-colors hover:text-fg ${ring}`}>
                <RotateCcw size={15} aria-hidden />
              </motion.button>
            )}
          </motion.li>
        );
      })}
    </ol>
    </LayoutGroup>
  );
}
