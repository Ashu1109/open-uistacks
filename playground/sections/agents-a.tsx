import type { ReactNode } from "react";
import { useDemoView } from "../demo";
import { useState } from "react";
import { ToolCall } from "../../originals/ui/tool-call";
import { RunCard } from "../../originals/ui/run-card";
import { DiffBlock } from "../../originals/ui/diff-block";
import { PlanCard, type PlanStep } from "../../originals/ui/plan-card";
import { AgentControlFrame, type ControlState } from "../../originals/ui/agent-control-frame";
import { PreflightChecks } from "../../originals/ui/preflight-checks";
import { ExtractedFields, type ExtractedField } from "../../originals/ui/extracted-fields";
import { ModelCard } from "../../originals/ui/model-card";
import { EvalScorecard } from "../../originals/ui/eval-scorecard";
import { AutomationCard } from "../../originals/ui/automation-card";
import { TraceWaterfall } from "../../originals/ui/trace-waterfall";
import { BrowserFrame } from "../../originals/ui/browser-frame";
import { ChangePreview } from "../../originals/ui/change-preview";
import { ChecksList } from "../../originals/ui/checks-list";
import { AgentRoster } from "../../originals/ui/agent-roster";
import { RelayTimeline } from "../../originals/ui/relay-timeline";
import { TrustLevel } from "../../originals/ui/trust-level";
import { RestorePoints } from "../../originals/ui/restore-points";
import { AttentionQueue } from "../../originals/ui/attention-queue";
import { MemoryList, type MemoryItem } from "../../originals/ui/memory-list";
import { SpendBreakdown } from "../../originals/ui/spend-breakdown";
import { RunSchedule } from "../../originals/ui/run-schedule";

function Demo({ title, slug, children }: { title: string; slug: string; children: ReactNode }) {
  const view = useDemoView(slug);
  if (view === "hidden") return null;
  if (view === "bare") return <div data-demo className="col-span-full w-full min-w-0">{children}</div>;
  return (
    <section id={slug} className="grid gap-3">
      <h3 className="text-sm font-medium text-fg-muted">{title}</h3>
      <div className="rounded-[20px] bg-subtle/50 p-6">{children}</div>
    </section>
  );
}

const PLAN: PlanStep[] = [
  { id: "1", title: "Read the failing test output", status: "done" },
  { id: "2", title: "Patch the date parser", detail: "src/date.ts", status: "active" },
  { id: "3", title: "Re-run the suite", status: "pending" },
];

export function Section() {
  const [control, setControl] = useState<ControlState>("running");
  const [fields, setFields] = useState<ExtractedField[]>([
    { key: "vendor", label: "Vendor", value: "Northwind Supply", confidence: 0.97 },
    { key: "date", label: "Invoice date", value: "2026-03-14", confidence: 0.82 },
    { key: "total", label: "Total", value: "$1,240.00", confidence: 0.55 },
  ]);
  const [memories, setMemories] = useState<MemoryItem[]>([
    { id: "1", text: "Prefers concise answers with code first", source: "Chat, Mar 2", at: "2 weeks ago", pinned: true },
    { id: "2", text: "Works in the Europe/Oslo timezone", source: "Settings", at: "1 month ago" },
    { id: "3", text: "Deploys on Fridays are off limits", source: "Chat, Feb 11", at: "2 months ago" },
  ]);
  return (
    <div className="grid gap-10">
      <Demo title="Tool call" slug="tool-call">
        <div className="grid gap-3">
          <ToolCall name="search_docs" args={{ query: "rate limits", limit: 5 }} result={{ hits: 3, top: "Quotas and limits" }} status="success" durationMs={1240} defaultOpen />
          <ToolCall name="run_query" args={{ sql: "select count(*) from orders" }} status="running" />
          <ToolCall name="send_email" args={{ to: "team@example.com" }} result="SMTP 550: mailbox unavailable" status="error" durationMs={380} />
        </div>
      </Demo>
      <Demo title="Run card" slug="run-card">
        <div className="grid gap-3 sm:grid-cols-2">
          <RunCard title="Triage support inbox" agent="Mailer agent" status="running" stepsDone={3} stepsTotal={8} elapsedMs={42_000} costUsd={0.18} onStop={() => {}} onOpen={() => {}} />
          <RunCard title="Weekly metrics digest" agent="Analyst agent" status="succeeded" stepsDone={5} stepsTotal={5} elapsedMs={96_000} costUsd={0.64} onOpen={() => {}} />
        </div>
      </Demo>
      <Demo title="Diff block" slug="diff-block">
        <DiffBlock filename="src/date.ts" before={"export function parse(s) {\n  const d = new Date(s);\n  return d;\n}"} after={"export function parse(s: string) {\n  const d = new Date(s);\n  if (Number.isNaN(d.getTime())) throw new Error(\"bad date\");\n  return d;\n}"} />
      </Demo>
      <Demo title="Plan card" slug="plan-card"><PlanCard title="Fix the date bug" steps={PLAN} onApprove={() => {}} onReject={() => {}} /></Demo>
      <Demo title="Agent control frame" slug="agent-control-frame">
        <AgentControlFrame state={control} onPause={() => setControl("paused")} onResume={() => setControl("running")} onStop={() => setControl("stopped")}>
          <p className="text-sm text-fg-muted">Filling in the vendor onboarding form on the user's behalf.</p>
        </AgentControlFrame>
      </Demo>
      <Demo title="Preflight checks" slug="preflight-checks">
        <PreflightChecks onStart={() => {}} checks={[
          { id: "1", label: "Credentials are valid", status: "pass" },
          { id: "2", label: "Budget is under the monthly cap", status: "warn", note: "82% of the cap is used." },
          { id: "3", label: "Target workspace is reachable", status: "pass" },
        ]} />
      </Demo>
      <Demo title="Extracted fields" slug="extracted-fields">
        <ExtractedFields fields={fields} onEdit={(key, value) => setFields((f) => f.map((x) => (x.key === key ? { ...x, value, confidence: 1 } : x)))} />
      </Demo>
      <Demo title="Model card" slug="model-card">
        <div className="grid gap-3 sm:grid-cols-2">
          <ModelCard name="Swift 2" provider="Acme AI" description="Fast, low-cost model for routing and extraction." contextWindow={200_000} inputPrice={0.25} outputPrice={1.25} capabilities={["Tools", "Vision"]} selected />
          <ModelCard name="Deep 5" provider="Acme AI" description="Slower, most capable model for hard reasoning." contextWindow={1_000_000} inputPrice={15} outputPrice={75} capabilities={["Tools", "Long context"]} />
        </div>
      </Demo>
      <Demo title="Eval scorecard" slug="eval-scorecard">
        <EvalScorecard title="Support agent v3" metrics={[{ label: "Accuracy", score: 0.91, baseline: 0.86 }, { label: "Tone", score: 0.84, baseline: 0.84 }, { label: "Tool use", score: 0.72, baseline: 0.78 }]} />
      </Demo>
      <Demo title="Automation card" slug="automation-card">
        <AutomationCard name="Morning digest" trigger="Weekdays at 08:00" action="Email a summary" lastRun="today, 08:00" runCount={128} />
      </Demo>
      <Demo title="Trace waterfall" slug="trace-waterfall">
        <TraceWaterfall spans={[
          { id: "1", name: "agent.run", start: 0, duration: 5200 },
          { id: "2", name: "plan", start: 80, duration: 900, depth: 1 },
          { id: "3", name: "tool.search_docs", start: 1000, duration: 1500, depth: 1 },
          { id: "4", name: "tool.run_query", start: 2550, duration: 1900, depth: 1, status: "error" },
          { id: "5", name: "summarize", start: 4500, duration: 650, depth: 1 },
        ]} />
      </Demo>
      <Demo title="Browser frame" slug="browser-frame">
        <BrowserFrame url="https://example.com/signup" title="Signup page" agentAction="Typing email address">
          <div className="grid gap-2"><div className="h-8 w-2/3 rounded-[10px] bg-subtle" /><div className="h-8 w-2/3 rounded-[10px] bg-subtle" /><div className="h-8 w-24 rounded-[10px] bg-select-soft" /></div>
        </BrowserFrame>
      </Demo>
      <Demo title="Change preview" slug="change-preview">
        <ChangePreview onApply={() => {}} changes={[
          { id: "1", label: "Page title", before: "Welcome", after: "Welcome back" },
          { id: "2", label: "Primary button", before: "Submit", after: "Create account" },
        ]} />
      </Demo>
      <Demo title="Checks list" slug="checks-list">
        <ChecksList items={[
          { id: "1", name: "Type check", state: "pass", durationMs: 4200 },
          { id: "2", name: "Unit tests", state: "fail", durationMs: 9100, detail: "date.test.ts: expected 2026-03-14, received Invalid Date" },
          { id: "3", name: "Lint", state: "skipped" },
        ]} />
      </Demo>
      <Demo title="Agent roster" slug="agent-roster">
        <AgentRoster defaultValue="1" agents={[
          { id: "1", name: "Ada", role: "Planner", status: "working", task: "Breaking down the migration" },
          { id: "2", name: "Bo", role: "Coder", status: "blocked", task: "Waiting on schema approval" },
          { id: "3", name: "Cy", role: "Reviewer", status: "idle" },
          { id: "4", name: "Di", role: "Deployer", status: "offline" },
        ]} />
      </Demo>
      <Demo title="Relay timeline" slug="relay-timeline">
        <RelayTimeline events={[
          { id: "1", from: "Planner", to: "Coder", message: "Spec for the export endpoint is ready.", at: "10:02" },
          { id: "2", from: "Coder", to: "Reviewer", message: "Patch opened with tests.", at: "10:19" },
          { id: "3", from: "Reviewer", to: "Coder", message: "Handle empty exports.", at: "10:31" },
        ]} />
      </Demo>
      <Demo title="Trust level" slug="trust-level"><TrustLevel defaultValue="risky" /></Demo>
      <Demo title="Restore points" slug="restore-points">
        <RestorePoints onRestore={() => {}} points={[
          { id: "3", label: "After refactor", at: "2 min ago", summary: "6 files" },
          { id: "2", label: "Before refactor", at: "14 min ago", summary: "clean tree" },
          { id: "1", label: "Session start", at: "1 h ago" },
        ]} />
      </Demo>
      <Demo title="Attention queue" slug="attention-queue">
        <AttentionQueue items={[
          { id: "1", title: "Issue refund of $480", reason: "above the auto-approve limit", agent: "Billing agent", severity: "high" },
          { id: "2", title: "Delete 12 stale branches", reason: "destructive action", agent: "Repo agent", severity: "medium" },
          { id: "3", title: "Rename a label", reason: "low-risk change, asking anyway", agent: "Triage agent", severity: "low" },
        ]} />
      </Demo>
      <Demo title="Memory list" slug="memory-list">
        <MemoryList memories={memories} onForget={(id) => setMemories((m) => m.filter((x) => x.id !== id))} onTogglePin={(id) => setMemories((m) => m.map((x) => (x.id === id ? { ...x, pinned: !x.pinned } : x)))} />
      </Demo>
      <Demo title="Spend breakdown" slug="spend-breakdown">
        <SpendBreakdown title="This month" budget={50} items={[{ label: "Input tokens", usd: 14.2 }, { label: "Output tokens", usd: 18.9 }, { label: "Tool calls", usd: 4.35 }, { label: "Browser sessions", usd: 6.1 }]} />
      </Demo>
      <Demo title="Run schedule" slug="run-schedule"><RunSchedule cron="0 8 * * 1-5" /></Demo>
    </div>
  );
}
