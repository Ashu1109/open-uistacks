"use client";

import { useState } from "react";
import { GitPullRequest } from "lucide-react";
import { Badge } from "../../registry/ui/badge";

/* Dev tools review queue: pull requests waiting for review with how long they have waited, size and author, sortable by age or size. A card, 1/2 width of a 12-column grid (6 columns), responsive to its container. */

export interface PullRequest {
  id: string;
  number: number;
  title: string;
  author: string;
  /** Hours since a review was requested. */
  waitingHours: number;
  linesChanged: number;
}

export interface DevToolsReviewQueueProps {
  pulls?: PullRequest[];
  /** Waiting longer than this many hours is flagged stale. */
  staleAfterHours?: number;
  onOpen?: (pull: PullRequest) => void;
  className?: string;
}

export const DEMO_PULLS: PullRequest[] = [
  { id: "p1", number: 1482, title: "Retry failed invoice webhooks with backoff", author: "Marcus T.", waitingHours: 76, linesChanged: 412 },
  { id: "p2", number: 1497, title: "Add org-level audit log export", author: "Priya N.", waitingHours: 30, linesChanged: 1260 },
  { id: "p3", number: 1503, title: "Fix flaky reconnect test", author: "Omar H.", waitingHours: 5, linesChanged: 38 },
  { id: "p4", number: 1505, title: "Upgrade Node to 22 LTS", author: "Ana R.", waitingHours: 21, linesChanged: 96 },
  { id: "p5", number: 1508, title: "Cache search facets per tenant", author: "Lena K.", waitingHours: 2, linesChanged: 205 },
];

export function formatAge(hours: number): string {
  if (hours < 1) return "under 1h";
  if (hours < 48) return `${Math.round(hours)}h`;
  return `${Math.floor(hours / 24)}d`;
}

export type QueueSort = "age" | "size";

export function sortPulls(pulls: PullRequest[], by: QueueSort): PullRequest[] {
  return [...pulls].sort((a, b) => (by === "age" ? b.waitingHours - a.waitingHours : b.linesChanged - a.linesChanged));
}

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export function DevToolsReviewQueue({ pulls = DEMO_PULLS, staleAfterHours = 48, onOpen, className = "" }: DevToolsReviewQueueProps) {
  const [by, setBy] = useState<QueueSort>("age");
  const rows = sortPulls(pulls, by);
  return (
    <section aria-label="Review queue" className={`@container rounded-[20px] bg-surface p-4 shadow-[var(--shadow-card)] @[480px]:p-5 ${className}`}>
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[15px] font-semibold text-fg">Review queue <span className="font-normal text-fg-muted">({pulls.length})</span></h2>
        <div role="group" aria-label="Sort by" className="flex gap-1 rounded-full bg-subtle p-0.5">
          {(["age", "size"] as const).map((s) => (
            <button key={s} type="button" aria-pressed={by === s} onClick={() => setBy(s)} className={`rounded-full px-2.5 py-1 text-[12px] font-medium capitalize ${by === s ? "bg-surface text-fg shadow-[var(--shadow-card)]" : "text-fg-muted hover:text-fg"} ${ring}`}>
              {s}
            </button>
          ))}
        </div>
      </header>
      <ul className="grid gap-1">
        {rows.map((p) => {
          const stale = p.waitingHours >= staleAfterHours;
          return (
            <li key={p.id}>
              <button type="button" onClick={() => onOpen?.(p)} className={`flex w-full items-center gap-3 rounded-[12px] px-2 py-2 text-left hover:bg-[color-mix(in_srgb,var(--fg)_4%,var(--surface))] ${ring}`}>
                <GitPullRequest size={17} aria-hidden className="shrink-0 text-fg-subtle" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium text-fg">{p.title}</span>
                  <span className="block truncate text-[12px] text-fg-muted">#{p.number} · {p.author} · {p.linesChanged.toLocaleString("en-US")} lines</span>
                </span>
                <Badge tone={stale ? "danger" : "neutral"}>{formatAge(p.waitingHours)}{stale ? " stale" : ""}</Badge>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
