"use client";

import { useState } from "react";
import { CircleCheck, CircleDashed, CircleX } from "lucide-react";
import { Badge } from "../../registry/ui/badge";

/* Dev tools release gate: a checklist a release must clear, with Approve enabled only when every required item passes and Block always available. A card, 1/3 or 1/2 width of a 12-column grid (4 to 6 columns), responsive to its container. */

export type GateState = "pass" | "fail" | "pending";
export type GateDecision = "open" | "approved" | "blocked";

export interface GateItem {
  id: string;
  label: string;
  detail?: string;
  state: GateState;
  required?: boolean;
}

export interface DevToolsReleaseGateProps {
  release?: string;
  items?: GateItem[];
  onApprove?: (release: string) => void;
  onBlock?: (release: string) => void;
  className?: string;
}

export const DEMO_GATE: GateItem[] = [
  { id: "g1", label: "CI on release branch", detail: "412 checks passed", state: "pass", required: true },
  { id: "g2", label: "No open P0 or P1 bugs", detail: "0 open", state: "pass", required: true },
  { id: "g3", label: "Migration dry run", detail: "Finished in 4m 12s", state: "pass", required: true },
  { id: "g4", label: "Security scan", detail: "1 high finding awaiting review", state: "fail", required: true },
  { id: "g5", label: "Release notes drafted", state: "pending", required: false },
];

export function canApprove(items: GateItem[]): boolean {
  return items.filter((i) => i.required !== false).every((i) => i.state === "pass");
}

export function blockers(items: GateItem[]): GateItem[] {
  return items.filter((i) => i.required !== false && i.state !== "pass");
}

const ICON = {
  pass: { Icon: CircleCheck, color: "var(--success)", label: "Passed" },
  fail: { Icon: CircleX, color: "var(--danger)", label: "Failed" },
  pending: { Icon: CircleDashed, color: "var(--fg-subtle)", label: "Pending" },
} as const;

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export function DevToolsReleaseGate({ release = "v2.9.0", items = DEMO_GATE, onApprove, onBlock, className = "" }: DevToolsReleaseGateProps) {
  const [decision, setDecision] = useState<GateDecision>("open");
  const ready = canApprove(items);
  const open = blockers(items).length;
  return (
    <section aria-label="Release gate" className={`@container rounded-[20px] bg-surface p-4 shadow-[var(--shadow-card)] @[480px]:p-5 ${className}`}>
      <header className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-[15px] font-semibold text-fg">Release gate <span className="font-normal text-fg-muted">{release}</span></h2>
        <Badge tone={decision === "approved" ? "success" : decision === "blocked" ? "danger" : ready ? "accent" : "warning"} dot>
          {decision === "approved" ? "Approved" : decision === "blocked" ? "Blocked" : ready ? "Ready" : `${open} blocking`}
        </Badge>
      </header>
      <ul className="grid gap-2">
        {items.map((i) => {
          const ui = ICON[i.state];
          return (
            <li key={i.id} className="flex items-start gap-2.5">
              <ui.Icon size={18} aria-hidden className="mt-0.5 shrink-0" style={{ color: ui.color }} />
              <div className="min-w-0">
                <p className="text-[14px] text-fg">
                  {i.label}
                  <span className="sr-only">, {ui.label}</span>
                  {i.required === false && <span className="ml-1.5 text-[12px] text-fg-subtle">optional</span>}
                </p>
                {i.detail && <p className="text-[12px] text-fg-muted">{i.detail}</p>}
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 flex gap-2" aria-live="polite">
        <button
          type="button"
          disabled={!ready || decision !== "open"}
          onClick={() => { setDecision("approved"); onApprove?.(release); }}
          className={`h-9 flex-1 rounded-full bg-[image:var(--grad-primary)] px-4 text-[13px] font-medium text-[var(--inverse-fg)] shadow-[var(--shadow-btn-primary)] disabled:cursor-not-allowed disabled:opacity-40 ${ring}`}
        >
          Approve release
        </button>
        <button
          type="button"
          disabled={decision !== "open"}
          onClick={() => { setDecision("blocked"); onBlock?.(release); }}
          className={`h-9 rounded-full bg-subtle px-4 text-[13px] font-medium text-fg hover:bg-track disabled:cursor-not-allowed disabled:opacity-40 ${ring}`}
        >
          Block
        </button>
      </div>
      {!ready && decision === "open" && <p className="mt-2 text-[12px] text-fg-muted">Approve unlocks when every required check passes.</p>}
    </section>
  );
}
