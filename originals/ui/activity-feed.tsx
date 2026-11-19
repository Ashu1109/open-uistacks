"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

/* Activity feed: a vertical timeline of who did what and when, with relative timestamps that carry the exact time in a tooltip. */

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

const UNITS: ReadonlyArray<[Intl.RelativeTimeFormatUnit, number]> = [
  ["year", 31_536_000],
  ["month", 2_592_000],
  ["week", 604_800],
  ["day", 86_400],
  ["hour", 3600],
  ["minute", 60],
];

/** "3m ago", "2h ago", "yesterday"; under 10 seconds reads "just now". */
export function formatRelativeTime(at: Date | number, now: Date | number = Date.now()): string {
  const seconds = Math.round((new Date(at).getTime() - new Date(now).getTime()) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 10) return "just now";
  const rtf = new Intl.RelativeTimeFormat("en", { style: "narrow", numeric: "auto" });
  for (const [unit, size] of UNITS) {
    if (abs >= size) return rtf.format(Math.trunc(seconds / size), unit);
  }
  return rtf.format(seconds, "second");
}

export interface ActivityItem {
  id: string;
  actor: string;
  action: string;
  /** What the action was done to, shown in bold. */
  target?: string;
  at: Date | number;
  icon?: ReactNode;
  detail?: ReactNode;
}

export interface ActivityFeedProps {
  items: ActivityItem[];
  /** Reference time for relative stamps; defaults to now. */
  now?: Date | number;
  className?: string;
}

export function ActivityFeed({ items, now, className = "" }: ActivityFeedProps) {
  const reduce = useReduce();
  if (items.length === 0) return <p className={`text-sm text-fg-muted ${className}`}>No activity yet.</p>;
  return (
    <ol aria-label="Activity" className={`relative grid gap-5 ${className}`}>
      {items.map((item, i) => (
        <motion.li key={item.id} {...enter(i, reduce)} className="relative flex gap-3">
          {i < items.length - 1 && (
            <motion.span
              aria-hidden
              initial={reduce ? false : { scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.3, ease: "easeOut", delay: Math.min(i, 10) * 0.04 + 0.1 }}
              className="absolute left-4 top-9 -bottom-5 w-px origin-top bg-track"
            />
          )}
          <span className="relative grid size-8 shrink-0 place-items-center rounded-full bg-subtle text-fg-muted shadow-[var(--shadow-hairline)]">
            {item.icon ?? <span className="text-xs font-medium">{item.actor.charAt(0).toUpperCase()}</span>}
          </span>
          <div className="min-w-0 flex-1 pt-1">
            <p className="text-sm leading-5 text-fg">
              <span className="font-medium">{item.actor}</span> <span className="text-fg-muted">{item.action}</span>
              {item.target && <> <span className="font-medium">{item.target}</span></>}
            </p>
            <time dateTime={new Date(item.at).toISOString()} title={new Date(item.at).toLocaleString()} className="text-xs text-fg-subtle">
              {formatRelativeTime(item.at, now)}
            </time>
            {item.detail && <div className="mt-1.5 rounded-[12px] bg-subtle px-3 py-2 text-sm text-fg-muted">{item.detail}</div>}
          </div>
        </motion.li>
      ))}
    </ol>
  );
}
