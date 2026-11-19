"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Bell, BellOff, X } from "lucide-react";
import { useControlled } from "./dialog";

/* Notification center: a bell button with an unread badge that opens a popover feed with All and Unread tabs, mark-as-read per item or all at once, dismissal and relative timestamps; Escape and outside clicks close it. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface NotificationItem {
  id: string;
  title: string;
  body?: string;
  /** Epoch milliseconds. */
  time: number;
  read?: boolean;
  icon?: ReactNode;
}

/** How many notifications are still unread. */
export function unreadCount(items: NotificationItem[]): number {
  return items.filter((n) => !n.read).length;
}

/** A short "5m ago" style age of `time` relative to `now`. */
export function formatRelative(time: number, now = Date.now()): string {
  const seconds = Math.max(0, Math.round((now - time) / 1000));
  if (seconds < 45) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days < 7 ? `${days}d ago` : `${Math.floor(days / 7)}w ago`;
}

export interface NotificationCenterProps {
  notifications?: NotificationItem[];
  defaultNotifications?: NotificationItem[];
  onNotificationsChange?: (items: NotificationItem[]) => void;
  /** Runs when an item is clicked, after it is marked read. */
  onOpenNotification?: (item: NotificationItem) => void;
  /** Reference time for the relative timestamps; defaults to the current time. */
  now?: number;
  label?: string;
  align?: "start" | "end";
  className?: string;
}

type Tab = "all" | "unread";

export function NotificationCenter({ notifications, defaultNotifications = [], onNotificationsChange, onOpenNotification, now, label = "Notifications", align = "end", className = "" }: NotificationCenterProps) {
  const id = useId();
  const reduce = useReduce();
  const [items, setItems] = useControlled(notifications, defaultNotifications, onNotificationsChange);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("all");
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const unread = unreadCount(items);
  const shown = tab === "unread" ? items.filter((n) => !n.read) : items;
  const reference = now ?? Date.now();

  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLElement>("[role=tab][aria-selected=true]")?.focus();
    const outside = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const escape = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  const markRead = (target: string) => setItems(items.map((n) => (n.id === target ? { ...n, read: true } : n)));
  const hidden = reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -4 };

  return (
    <div ref={root} className={`relative inline-block ${className}`}>
      <button
        ref={button}
        type="button"
        aria-label={unread ? `${label}, ${unread} unread` : label}
        aria-expanded={open}
        aria-controls={open ? `${id}-panel` : undefined}
        onClick={() => setOpen((o) => !o)}
        className={`relative grid size-9 place-items-center rounded-full text-fg-muted transition-colors hover:bg-subtle hover:text-fg ${open ? "bg-subtle text-fg" : ""} ${ring}`}
      >
        <Bell size={18} strokeWidth={2} aria-hidden />
        {unread > 0 && <span aria-hidden className="absolute right-0.5 top-0.5 min-w-4 rounded-full bg-danger-solid px-1 text-center text-[10px] font-semibold leading-4 text-white">{unread > 9 ? "9+" : unread}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panel}
            id={`${id}-panel`}
            role="dialog"
            aria-label={label}
            initial={hidden}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={hidden}
            transition={{ type: "spring", stiffness: 520, damping: 34 }}
            style={{ transformOrigin: `top ${align === "end" ? "right" : "left"}` }}
            className={`absolute top-full z-50 mt-2 flex max-h-[28rem] w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[20px] bg-surface shadow-[var(--shadow-overlay)] dark:bg-raised ${align === "end" ? "right-0" : "left-0"}`}
          >
            <div className="flex items-center gap-2 px-4 pb-2 pt-3">
              <h2 className="flex-1 text-sm font-semibold text-fg">{label}</h2>
              <button type="button" disabled={unread === 0} onClick={() => setItems(items.map((n) => ({ ...n, read: true })))} className={`rounded-full px-2.5 py-1 text-xs font-medium text-select-text transition-colors hover:bg-select-soft disabled:text-fg-subtle disabled:hover:bg-transparent ${ring}`}>
                Mark all read
              </button>
            </div>
            <div role="tablist" aria-label="Filter notifications" className="flex gap-1 px-3 pb-2">
              {(["all", "unread"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  id={`${id}-tab-${t}`}
                  aria-selected={tab === t}
                  aria-controls={`${id}-list`}
                  onClick={() => setTab(t)}
                  className={`rounded-full px-3 py-1 text-[13px] font-medium capitalize transition-colors ${tab === t ? "bg-subtle text-fg" : "text-fg-muted hover:text-fg"} ${ring}`}
                >
                  {t}
                  {t === "unread" && unread > 0 ? ` (${unread})` : ""}
                </button>
              ))}
            </div>
            <ul id={`${id}-list`} role="tabpanel" aria-labelledby={`${id}-tab-${tab}`} className="min-h-0 flex-1 overflow-y-auto border-t border-track">
              {shown.length === 0 && (
                <li className="grid place-items-center gap-2 px-4 py-10 text-center text-sm text-fg-muted">
                  <BellOff size={20} strokeWidth={1.75} aria-hidden />
                  {tab === "unread" ? "You're all caught up" : "No notifications yet"}
                </li>
              )}
              {shown.map((n) => (
                <li key={n.id} className="group relative flex items-start border-b border-track last:border-0">
                  <button
                    type="button"
                    onClick={() => {
                      markRead(n.id);
                      onOpenNotification?.(n);
                    }}
                    className={`flex min-w-0 flex-1 items-start gap-3 px-4 py-3 pr-10 text-left transition-colors hover:bg-[color-mix(in_srgb,var(--fg)_4%,transparent)] ${ring}`}
                  >
                    <span className="relative mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-subtle text-fg-muted">
                      {n.icon ?? <Bell size={15} strokeWidth={2} aria-hidden />}
                      {!n.read && <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-select ring-2 ring-surface dark:ring-raised"><span className="sr-only">Unread</span></span>}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-sm ${n.read ? "text-fg-muted" : "font-medium text-fg"}`}>{n.title}</span>
                      {n.body && <span className="mt-0.5 block text-[13px] leading-[18px] text-fg-muted">{n.body}</span>}
                      <span className="mt-1 block text-xs text-fg-subtle">{formatRelative(n.time, reference)}</span>
                    </span>
                  </button>
                  <button type="button" aria-label={`Dismiss ${n.title}`} onClick={() => setItems(items.filter((x) => x.id !== n.id))} className={`absolute right-2 top-2.5 grid size-7 place-items-center rounded-full text-fg-subtle opacity-0 transition-opacity hover:bg-subtle hover:text-fg focus-visible:opacity-100 group-hover:opacity-100 ${ring}`}>
                    <X size={14} strokeWidth={2} aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
            <div role="status" className="sr-only">{unread === 0 ? "No unread notifications" : `${unread} unread notification${unread === 1 ? "" : "s"}`}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
