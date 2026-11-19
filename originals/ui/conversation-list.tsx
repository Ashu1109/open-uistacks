"use client";

import { Plus, Search, Trash2 } from "lucide-react";
import { useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Leaving, gone } from "./chart-utils";


/* Conversation list: chat history grouped by Today, Yesterday, Previous 7 days and Older, with search, a new-chat button, a highlighted active row and per-row delete; Up and Down move between rows. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}
const spring = { type: "spring", stiffness: 480, damping: 34 } as const;

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface Conversation {
  id: string;
  title: string;
  /** Epoch ms of the last message. */
  updatedAt: number;
}

const DAY = 86_400_000;
export const GROUP_ORDER = ["Today", "Yesterday", "Previous 7 days", "Older"] as const;
export type ConversationGroup = (typeof GROUP_ORDER)[number];

export function groupLabel(updatedAt: number, now: number): ConversationGroup {
  const startOfToday = new Date(now).setHours(0, 0, 0, 0);
  if (updatedAt >= startOfToday) return "Today";
  if (updatedAt >= startOfToday - DAY) return "Yesterday";
  if (updatedAt >= startOfToday - 7 * DAY) return "Previous 7 days";
  return "Older";
}

/** Non-empty groups in display order, newest first, after filtering titles by `query`. */
export function groupConversations(items: Conversation[], now: number, query = ""): { label: ConversationGroup; items: Conversation[] }[] {
  const q = query.trim().toLowerCase();
  const sorted = items.filter((c) => c.title.toLowerCase().includes(q)).sort((a, b) => b.updatedAt - a.updatedAt);
  return GROUP_ORDER.map((label) => ({ label, items: sorted.filter((c) => groupLabel(c.updatedAt, now) === label) })).filter((g) => g.items.length > 0);
}

export interface ConversationListProps {
  conversations: Conversation[];
  activeId?: string;
  onSelect?: (id: string) => void;
  onDelete?: (id: string) => void;
  onNew?: () => void;
  /** Reference time for grouping; defaults to now. */
  now?: number;
  className?: string;
}

export function ConversationList({ conversations, activeId, onSelect, onDelete, onNew, now, className = "" }: ConversationListProps) {
  const reduce = useReduce();
  const [query, setQuery] = useState("");
  const groups = groupConversations(conversations, now ?? Date.now(), query);

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const rows = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>("button[data-row]")).filter((r) => !r.closest("[inert]"));
    const i = rows.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    e.preventDefault();
    rows[(i + (e.key === "ArrowDown" ? 1 : rows.length - 1)) % rows.length]?.focus();
  };

  return (
    <motion.nav aria-label="Conversations" initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={spring} onKeyDown={onKeyDown} className={`flex w-72 max-w-full flex-col gap-3 rounded-[20px] bg-surface p-3 shadow-[var(--shadow-card)] ${className}`}>
      <div className="flex items-center gap-2">
        <label className="flex flex-1 items-center gap-2 rounded-full bg-subtle px-3 py-1.5 focus-within:ring-2 focus-within:ring-[var(--select)]">
          <Search size={14} className="text-fg-subtle" aria-hidden />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search chats" aria-label="Search chats" className="min-w-0 flex-1 bg-transparent text-[13px] text-fg outline-none placeholder:text-fg-subtle" />
        </label>
        <motion.button type="button" whileTap={reduce ? undefined : { scale: 0.92 }} whileHover={reduce ? undefined : { rotate: 90 }} transition={spring} onClick={onNew} aria-label="New chat" className={`grid size-8 place-items-center rounded-full bg-[image:var(--grad-primary)] text-[var(--inverse-fg)] shadow-[var(--shadow-btn-primary)] ${ring}`}><Plus size={16} aria-hidden /></motion.button>
      </div>
      {groups.length === 0 && <p className="px-2 py-4 text-center text-[13px] text-fg-muted">No conversations found</p>}
      <AnimatePresence initial={false}>
      {groups.map((g) => (
        <Leaving key={g.label}>{(groupOut) => (
        <motion.section {...gone(groupOut)} aria-label={g.label} layout={reduce ? false : "position"} exit={reduce ? { opacity: 0, transition: { duration: 0.1 } } : { opacity: 0, height: 0, transition: { duration: 0.18, ease: "easeOut" } }} className="overflow-hidden">
          <h3 className="px-2 pb-1 text-xs font-medium text-fg-subtle">{g.label}</h3>
          <ul className="grid gap-0.5">
            <AnimatePresence>
            {g.items.map((c, i) => (
              <Leaving key={c.id}>{(out) => (
              <motion.li {...gone(out)} layout={reduce ? false : "position"} initial={reduce ? false : { opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={reduce ? { opacity: 0, transition: { duration: 0.1 } } : { opacity: 0, height: 0, x: -6, transition: { duration: 0.18, ease: "easeOut" } }} transition={{ ...spring, delay: reduce ? 0 : Math.min(i, 8) * 0.03 }} className="group relative overflow-hidden">
                {c.id === activeId && <motion.span layoutId="conversation-active" transition={reduce ? { duration: 0 } : spring} className="absolute inset-0 rounded-[10px] bg-select-soft" />}
                <button type="button" data-row aria-current={c.id === activeId ? "page" : undefined} onClick={() => onSelect?.(c.id)} className={`relative block w-full truncate rounded-[10px] px-2.5 py-2 pr-9 text-left text-[13px] transition-colors ${c.id === activeId ? "font-medium text-select-text" : "text-fg hover:bg-[color-mix(in_srgb,var(--fg)_4%,var(--surface))]"} ${ring}`}>{c.title}</button>
                {onDelete && (
                  <button type="button" aria-label={`Delete ${c.title}`} onClick={() => onDelete(c.id)} className={`absolute right-1.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full text-fg-muted opacity-0 transition-opacity hover:bg-track group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100 ${ring}`}><Trash2 size={13} aria-hidden /></button>
                )}
              </motion.li>
              )}</Leaving>
            ))}
            </AnimatePresence>
          </ul>
        </motion.section>
        )}</Leaving>
      ))}
      </AnimatePresence>
    </motion.nav>
  );
}
