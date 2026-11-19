"use client";

import { useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, LayoutGroup, motion, useIsPresent, useReducedMotion } from "motion/react";
import { ChevronDown, Search } from "lucide-react";
import { IssueRow, STATUS_META, type Issue, type IssueStatus } from "./issue-row";
import { Leaving, gone } from "./chart-utils";

/* Issue list: issues grouped by status with counts, a filter box and arrow-key navigation between rows. */

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
const STATUS_ORDER: IssueStatus[] = ["in-progress", "todo", "backlog", "done", "canceled"];

export interface IssueListProps {
  issues: Issue[];
  onOpen?: (issue: Issue) => void;
  selectedId?: string;
  now?: Date | number;
  className?: string;
}

/** Case-insensitive match on key, title, assignee and labels. */
export function filterIssues(issues: Issue[], query: string): Issue[] {
  const q = query.trim().toLowerCase();
  if (!q) return issues;
  return issues.filter((i) => [i.key, i.title, i.assignee ?? "", ...(i.labels ?? [])].some((s) => s.toLowerCase().includes(q)));
}

/** Non-empty groups in status order. */
export function groupIssues(issues: Issue[]): Array<{ status: IssueStatus; issues: Issue[] }> {
  return STATUS_ORDER.map((status) => ({ status, issues: issues.filter((i) => i.status === status) })).filter((g) => g.issues.length > 0);
}

function Group({ status, issues, selectedId, onOpen, now, reduce }: { status: IssueStatus; issues: Issue[]; selectedId?: string; onOpen?: (issue: Issue) => void; now?: Date | number; reduce: boolean }) {
  const [open, setOpen] = useState(true);
  const panelId = useId();
  const leaving = !useIsPresent();
  return (
    <motion.section
      {...gone(leaving)}
      layout={reduce ? false : "position"}
      exit={reduce ? { opacity: 0, transition: { duration: 0.1 } } : { opacity: 0, height: 0, marginTop: 0, transition: { duration: 0.2, ease: "easeOut" } }}
      aria-label={`${STATUS_META[status].label}, ${issues.length} issues`}
      className="overflow-hidden rounded-[16px] bg-surface shadow-[var(--shadow-card)]"
    >
      <h4 className="bg-subtle text-xs font-medium text-fg-muted">
        <button type="button" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((o) => !o)} className={`flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:text-fg ${ring} focus-visible:ring-inset`}>
          <motion.span aria-hidden animate={{ rotate: open ? 0 : -90 }} transition={reduce ? { duration: 0 } : { duration: 0.18 }} className="grid">
            <ChevronDown size={13} />
          </motion.span>
          {STATUS_META[status].label} <span className="tabular-nums text-fg-subtle">{issues.length}</span>
        </button>
      </h4>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            id={panelId}
            key="rows"
            initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="divide-y divide-[var(--track)] overflow-hidden"
          >
            <AnimatePresence>
              {issues.map((issue, i) => (
                <Leaving key={issue.id}>{(out) => (
                  <motion.li {...enter(i, reduce)} {...gone(out)} exit={reduce ? { opacity: 0, transition: { duration: 0.1 } } : { opacity: 0, height: 0, transition: { duration: 0.2, ease: "easeOut" } }} className="overflow-hidden">
                    <IssueRow issue={issue} selected={issue.id === selectedId} onOpen={onOpen} now={now} />
                  </motion.li>
                )}</Leaving>
              ))}
            </AnimatePresence>
          </motion.ul>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

export function IssueList({ issues, onOpen, selectedId, now, className = "" }: IssueListProps) {
  const reduce = useReduce();
  const groupId = useId();
  const [query, setQuery] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const groups = useMemo(() => groupIssues(filterIssues(issues, query)), [issues, query]);

  const navigate = (e: React.KeyboardEvent) => {
    const step = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    const rows = [...(root.current?.querySelectorAll<HTMLElement>("[data-issue-row]") ?? [])].filter((r) => !r.closest("[inert]"));
    const at = rows.indexOf(document.activeElement as HTMLElement);
    if (at < 0) return;
    e.preventDefault();
    rows[Math.min(Math.max(at + step, 0), rows.length - 1)]?.focus();
  };

  return (
    <LayoutGroup id={groupId}>
    <div ref={root} onKeyDown={navigate} className={`grid gap-3 ${className}`}>
      <label className="flex h-9 items-center gap-2 rounded-[12px] bg-surface px-3 shadow-[var(--shadow-card)]">
        <Search size={15} className="text-fg-subtle" aria-hidden />
        <input type="search" aria-label="Filter issues" placeholder="Filter issues" value={query} onChange={(e) => setQuery(e.target.value)} className={`min-w-0 flex-1 bg-transparent text-sm text-fg placeholder:text-fg-subtle ${ring} focus-visible:ring-0`} />
      </label>
      <div role="status" className="sr-only">{groups.reduce((n, g) => n + g.issues.length, 0)} issues</div>
      {groups.length === 0 && <p className="px-1 py-6 text-center text-sm text-fg-muted">No issues match “{query}”.</p>}
      <AnimatePresence initial={false}>
        {groups.map((g) => <Group key={g.status} status={g.status} issues={g.issues} selectedId={selectedId} onOpen={onOpen} now={now} reduce={reduce} />)}
      </AnimatePresence>
    </div>
    </LayoutGroup>
  );
}
