"use client";

import { useState } from "react";
import { Inbox, TriangleAlert } from "lucide-react";
import { ApprovalRequest, type ApprovalStatus } from "../../registry/ui/approval-request";
import { Tabs } from "../../registry/ui/tabs";

/* Approvals inbox: a full-width list-and-detail section; pending requests from agents on the left, the selected one as an approval card on the right, a Resolved tab for decided items, and a bulk action that approves every low-risk request. */

export interface InboxApproval {
  id: string;
  agent: string;
  title: string;
  description?: string;
  tool: string;
  risk: "low" | "high";
  requestedAt: string;
}

export interface ApprovalsInboxProps {
  items?: InboxApproval[];
  onDecide?: (id: string, status: Exclude<ApprovalStatus, "pending">) => void;
  className?: string;
}

export const DEMO_APPROVALS: InboxApproval[] = [
  { id: "p1", agent: "Refunds", title: "Refund $84.50 for order #20418", description: "Inside the 30-day return window.", tool: "payments.refund", risk: "high", requestedAt: "2 min ago" },
  { id: "p2", agent: "Triage", title: "Close 12 duplicate tickets", description: "Same sender and subject within an hour.", tool: "tickets.close", risk: "low", requestedAt: "9 min ago" },
  { id: "p3", agent: "Researcher", title: "Send brief to the account owner", description: "Contains pricing notes for Northwind.", tool: "email.send", risk: "high", requestedAt: "24 min ago" },
  { id: "p4", agent: "Scheduler", title: "Book a call with Lena Ortiz", description: "Tuesday 14:00, 30 minutes.", tool: "calendar.create", risk: "low", requestedAt: "1 h ago" },
];

export type Decisions = Record<string, ApprovalStatus>;

export function pendingItems(items: InboxApproval[], decisions: Decisions): InboxApproval[] {
  return items.filter((i) => (decisions[i.id] ?? "pending") === "pending");
}

export function approveLowRisk(items: InboxApproval[], decisions: Decisions): Decisions {
  const next: Decisions = { ...decisions };
  for (const i of pendingItems(items, decisions)) if (i.risk === "low") next[i.id] = "approved";
  return next;
}

export function ApprovalsInbox({ items = DEMO_APPROVALS, onDecide, className = "" }: ApprovalsInboxProps) {
  const [decisions, setDecisions] = useState<Decisions>({});
  const [tab, setTab] = useState<"pending" | "resolved">("pending");
  const [selected, setSelected] = useState<string | undefined>(items[0]?.id);

  const pending = pendingItems(items, decisions);
  const resolved = items.filter((i) => !pending.includes(i));
  const list = tab === "pending" ? pending : resolved;
  const current = items.find((i) => i.id === selected) ?? list[0];
  const lowCount = pending.filter((i) => i.risk === "low").length;

  const decide = (id: string, status: Exclude<ApprovalStatus, "pending">) => {
    setDecisions((d) => ({ ...d, [id]: status }));
    onDecide?.(id, status);
  };

  const bulk = () => {
    const next = approveLowRisk(items, decisions);
    for (const i of pending) if (i.risk === "low") onDecide?.(i.id, "approved");
    setDecisions(next);
  };

  return (
    <section aria-label="Approvals inbox" className={`@container w-full ${className}`}>
      <div className="grid gap-4 @[760px]:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="min-w-0 rounded-[20px] bg-surface p-4 shadow-[var(--shadow-card)] dark:bg-raised">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Tabs
              variant="pill"
              size="sm"
              label="Approval state"
              value={tab}
              onValueChange={(v) => setTab(v as "pending" | "resolved")}
              items={[{ value: "pending", label: "Pending", count: pending.length }, { value: "resolved", label: "Resolved", count: resolved.length }]}
            />
            {tab === "pending" && lowCount > 0 && (
              <button type="button" onClick={bulk} className="h-8 rounded-[10px] bg-subtle px-3 text-[13px] text-fg outline-none hover:bg-track focus-visible:ring-2 focus-visible:ring-[var(--select)]">
                Approve {lowCount} low risk
              </button>
            )}
          </div>
          {list.length === 0 ? (
            <div className="mt-4 grid place-items-center gap-1 rounded-[14px] bg-subtle p-8 text-center">
              <Inbox size={20} aria-hidden className="text-fg-subtle" />
              <p className="text-sm text-fg-muted">{tab === "pending" ? "Nothing waiting on you." : "No resolved requests yet."}</p>
            </div>
          ) : (
            <ul aria-label={tab === "pending" ? "Pending approvals" : "Resolved approvals"} className="mt-3 grid gap-1">
              {list.map((i) => (
                <li key={i.id}>
                  <button
                    type="button"
                    aria-pressed={current?.id === i.id}
                    onClick={() => setSelected(i.id)}
                    className={`flex w-full items-start gap-2 rounded-[12px] px-3 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] ${current?.id === i.id ? "bg-select-soft" : "hover:bg-[color-mix(in_srgb,var(--fg)_4%,var(--surface))]"}`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-fg">{i.title}</span>
                      <span className="block text-xs text-fg-subtle">{i.agent} · {i.requestedAt}</span>
                    </span>
                    {i.risk === "high" && <TriangleAlert size={15} aria-label="High risk" className="mt-0.5 shrink-0 text-danger-text" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="min-w-0">
          {current ? (
            <ApprovalRequest
              key={current.id}
              className="max-w-none!"
              overline={current.agent}
              title={current.title}
              description={current.description}
              risk={current.risk}
              details={[{ label: "Tool", value: current.tool, mono: true }, { label: "Requested", value: current.requestedAt }]}
              status={decisions[current.id] ?? "pending"}
              onApprove={(scope) => decide(current.id, scope === "once" ? "approved" : "always")}
              onDeny={() => decide(current.id, "denied")}
            />
          ) : (
            <p className="rounded-[20px] bg-subtle p-8 text-center text-sm text-fg-muted">Select a request to review it.</p>
          )}
        </div>
      </div>
    </section>
  );
}
