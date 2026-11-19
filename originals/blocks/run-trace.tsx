"use client";

import { useState } from "react";
import { Brain, CircleCheck, TriangleAlert } from "lucide-react";
import { Tabs } from "../../registry/ui/tabs";
import { ToolCall, formatMs, type ToolCallStatus } from "../ui/tool-call";
import { TraceWaterfall, type TraceSpan } from "../ui/trace-waterfall";
import type { RunStatus } from "../ui/run-card";

/* Run trace: a full-width section for one agent run: a header with status, duration and cost, the ordered steps (reasoning, tool calls, final output) with a kind filter, and a waterfall of where the time went. */

export type TraceStepKind = "thought" | "tool" | "output";

export interface TraceStep {
  id: string;
  kind: TraceStepKind;
  title: string;
  text?: string;
  tool?: { name: string; args: Record<string, unknown>; result?: unknown; status: ToolCallStatus; durationMs?: number };
}

export interface RunTraceProps {
  title?: string;
  agent?: string;
  status?: RunStatus;
  costUsd?: number;
  steps?: TraceStep[];
  spans?: TraceSpan[];
  className?: string;
}

export const DEMO_STEPS: TraceStep[] = [
  { id: "s1", kind: "thought", title: "Plan", text: "The customer asks for a refund on order 20418. Check the order, confirm the policy window, then issue the refund." },
  { id: "s2", kind: "tool", title: "Look up order", tool: { name: "orders.get", args: { id: "20418" }, result: { total: 84.5, placedDaysAgo: 9, status: "delivered" }, status: "success", durationMs: 420 } },
  { id: "s3", kind: "tool", title: "Check policy", tool: { name: "kb.search", args: { query: "refund window physical goods" }, result: { match: "30 days from delivery" }, status: "success", durationMs: 610 } },
  { id: "s4", kind: "tool", title: "Issue refund", tool: { name: "payments.refund", args: { order: "20418", amount: 84.5 }, result: { error: "Idempotency key already used" }, status: "error", durationMs: 1300 } },
  { id: "s5", kind: "tool", title: "Retry refund", tool: { name: "payments.refund", args: { order: "20418", amount: 84.5, retry: true }, result: { refund: "rf_9921", state: "pending" }, status: "success", durationMs: 980 } },
  { id: "s6", kind: "output", title: "Reply sent", text: "Refund of $84.50 is on its way and should reach the original card within 5 business days." },
];

export const DEMO_SPANS: TraceSpan[] = [
  { id: "p1", name: "run", start: 0, duration: 5200, depth: 0 },
  { id: "p2", name: "plan", start: 0, duration: 900, depth: 1 },
  { id: "p3", name: "orders.get", start: 900, duration: 420, depth: 1 },
  { id: "p4", name: "kb.search", start: 1320, duration: 610, depth: 1 },
  { id: "p5", name: "payments.refund", start: 1930, duration: 1300, depth: 1, status: "error" },
  { id: "p6", name: "payments.refund", start: 3230, duration: 980, depth: 1 },
  { id: "p7", name: "reply", start: 4210, duration: 990, depth: 1 },
];

export type StepFilter = "all" | "tool" | "errors";

export function filterSteps(steps: TraceStep[], filter: StepFilter): TraceStep[] {
  if (filter === "tool") return steps.filter((s) => s.kind === "tool");
  if (filter === "errors") return steps.filter((s) => s.tool?.status === "error");
  return steps;
}

export function traceDuration(spans: TraceSpan[]): number {
  return spans.reduce((end, s) => Math.max(end, s.start + s.duration), 0);
}

const STATUS_TONE: Record<RunStatus, string> = {
  running: "bg-select-soft text-select-text",
  succeeded: "bg-success-soft text-success-text",
  failed: "bg-danger-soft text-danger-text",
  stopped: "bg-subtle text-fg-muted",
};

function StepBody({ step }: { step: TraceStep }) {
  if (step.tool) return <ToolCall {...step.tool} />;
  const Icon = step.kind === "output" ? CircleCheck : Brain;
  return (
    <div className="rounded-[12px] bg-subtle p-3">
      <p className="flex items-center gap-1.5 text-[13px] font-medium text-fg"><Icon size={14} aria-hidden />{step.title}</p>
      <p className="mt-1 text-sm leading-6 text-fg-muted">{step.text}</p>
    </div>
  );
}

export function RunTrace({ title = "Refund order #20418", agent = "Refunds", status = "succeeded", costUsd = 0.07, steps = DEMO_STEPS, spans = DEMO_SPANS, className = "" }: RunTraceProps) {
  const [filter, setFilter] = useState<StepFilter>("all");
  const shown = filterSteps(steps, filter);
  const errors = steps.filter((s) => s.tool?.status === "error").length;

  return (
    <section aria-label={`Run trace: ${title}`} className={`@container w-full rounded-[20px] bg-surface p-5 shadow-[var(--shadow-card)] dark:bg-raised ${className}`}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[17px] font-medium text-fg">{title}</h3>
          <p className="mt-0.5 text-[13px] text-fg-muted">{agent} · {formatMs(traceDuration(spans))} · ${costUsd.toFixed(2)}</p>
        </div>
        <div className="flex items-center gap-2">
          {errors > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-warning-soft px-2.5 py-0.5 text-xs font-medium text-warning-text">
              <TriangleAlert size={12} aria-hidden />{errors} {errors === 1 ? "error" : "errors"} recovered
            </span>
          )}
          <span role="status" className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_TONE[status]}`}>{status}</span>
        </div>
      </header>

      <div className="mt-5 grid gap-6 @[800px]:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h4 className="text-sm font-medium text-fg">Steps</h4>
            <Tabs
              variant="pill"
              size="sm"
              label="Filter steps"
              value={filter}
              onValueChange={(v) => setFilter(v as StepFilter)}
              items={[{ value: "all", label: "All" }, { value: "tool", label: "Tool calls" }, { value: "errors", label: "Errors" }]}
            />
          </div>
          {shown.length === 0 ? (
            <p className="rounded-[12px] bg-subtle p-4 text-center text-sm text-fg-muted">No steps match this filter.</p>
          ) : (
            <ol className="grid gap-2">
              {shown.map((s) => <li key={s.id}><StepBody step={s} /></li>)}
            </ol>
          )}
        </div>
        <div className="min-w-0">
          <h4 className="mb-3 text-sm font-medium text-fg">Timing</h4>
          <TraceWaterfall spans={spans} />
        </div>
      </div>
    </section>
  );
}
