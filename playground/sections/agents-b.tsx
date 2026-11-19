import { useState, type ReactNode } from "react";
import { useDemoView } from "../demo";
import { Calendar, FileText, MessagesSquare, Table2 } from "lucide-react";
import { AttemptCompare } from "../../originals/ui/attempt-compare";
import { ModelFallback } from "../../originals/ui/model-fallback";
import { LiveRuns } from "../../originals/ui/live-runs";
import { AgentMap } from "../../originals/ui/agent-map";
import { CostEstimate } from "../../originals/ui/cost-estimate";
import { AgentPermissions } from "../../originals/ui/agent-permissions";
import { McpServers, type McpServer } from "../../originals/ui/mcp-servers";
import { PromptVersions } from "../../originals/ui/prompt-versions";
import { AiFormFill } from "../../originals/ui/ai-form-fill";
import { SessionReplay } from "../../originals/ui/session-replay";
import { ActionItems } from "../../originals/ui/action-items";
import { InterviewCard } from "../../originals/ui/interview-card";
import { NlFilter, type FilterField } from "../../originals/ui/nl-filter";
import { AiColumn } from "../../originals/ui/ai-column";
import { AgentHandoff } from "../../originals/ui/agent-handoff";
import { VoiceCall } from "../../originals/ui/voice-call";
import { EmailDraft } from "../../originals/ui/email-draft";
import { PolicyBlock } from "../../originals/ui/policy-block";
import { AgentCard } from "../../originals/ui/agent-card";
import { LivePill } from "../../originals/ui/live-pill";
import { ConnectApps } from "../../originals/ui/connect-apps";

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

const NOW = Date.now();
const FILTER_FIELDS: FilterField[] = [
  { key: "status", label: "Status", type: "enum", options: ["open", "closed", "snoozed"] },
  { key: "priority", label: "Priority", type: "enum", options: ["high", "medium", "low"] },
  { key: "comments", label: "Comments", type: "number", units: ["comments", "replies"] },
  { key: "created", label: "Created", type: "date" },
];

export function Section() {
  const [servers, setServers] = useState<McpServer[]>([
    { id: "1", name: "Docs search", url: "https://docs.example.com/mcp", status: "connected", tools: 6 },
    { id: "2", name: "Maps", url: "https://maps.example.com/mcp", status: "error", error: "Handshake timed out" },
    { id: "3", name: "Local files", url: "stdio:files", status: "disconnected" },
  ]);
  const [runs, setRuns] = useState([
    { id: "1", name: "Index the support archive", status: "running" as const, startedAt: NOW - 42_000, progress: 0.62, detail: "Embedding batch 31 of 50" },
    { id: "2", name: "Draft weekly digest", status: "queued" as const, startedAt: NOW },
    { id: "3", name: "Reconcile invoices", status: "done" as const, startedAt: NOW - 400_000, durationMs: 183_000 },
    { id: "4", name: "Sync calendar", status: "failed" as const, startedAt: NOW - 90_000, durationMs: 12_000, detail: "Token expired" },
  ]);

  return (
    <div className="grid gap-10">
      <Demo title="Attempt compare" slug="attempt-compare">
        <AttemptCompare
          defaultValue="b"
          attempts={[
            { id: "a", label: "Attempt 1", model: "Swift", output: "Refund issued for the full amount. Customer notified by email.", metrics: [{ label: "Latency", value: "2.1s" }, { label: "Tokens", value: "1.4k" }] },
            { id: "b", label: "Attempt 2", model: "Deep", output: "Refund issued for the full amount, receipt attached, and the account flagged for a follow-up call in three days.", metrics: [{ label: "Latency", value: "6.8s" }, { label: "Tokens", value: "3.9k" }] },
            { id: "c", label: "Attempt 3", model: "Balanced", output: "Partial refund of 80% offered pending a return.", metrics: [{ label: "Latency", value: "3.4s" }, { label: "Tokens", value: "2.2k" }] },
          ]}
        />
      </Demo>
      <Demo title="Model fallback" slug="model-fallback">
        <ModelFallback className="max-w-lg" defaultValue={[{ id: "1", name: "Deep", detail: "128k context", enabled: true }, { id: "2", name: "Balanced", detail: "Faster", enabled: true }, { id: "3", name: "Swift", detail: "Cheapest", enabled: false }]} />
      </Demo>
      <Demo title="Live runs" slug="live-runs">
        <LiveRuns className="max-w-xl" runs={runs} onCancel={(id) => setRuns((r) => r.filter((x) => x.id !== id))} />
      </Demo>
      <Demo title="Agent map" slug="agent-map">
        <AgentMap
          nodes={[
            { id: "router", label: "Router", caption: "Triage", x: 90, y: 140 },
            { id: "research", label: "Researcher", caption: "Web + docs", x: 310, y: 60 },
            { id: "writer", label: "Writer", caption: "Drafts", x: 310, y: 220 },
            { id: "review", label: "Reviewer", caption: "Checks facts", x: 540, y: 140 },
          ]}
          edges={[
            { from: "router", to: "research", label: "question", active: true },
            { from: "router", to: "writer" },
            { from: "research", to: "review", label: "sources" },
            { from: "writer", to: "review" },
          ]}
          defaultSelected="router"
        />
      </Demo>
      <Demo title="Cost estimate" slug="cost-estimate">
        <CostEstimate model="Deep" inputTokens={180_000} outputTokens={24_000} prices={{ input: 3, output: 15 }} runs={4} budget={4} />
      </Demo>
      <Demo title="Agent permissions" slug="agent-permissions">
        <AgentPermissions
          className="max-w-xl"
          defaultValue={{ search: "allow", files: "ask", shell: "deny" }}
          tools={[{ id: "search", name: "Web search", description: "Read public pages" }, { id: "files", name: "Workspace files", description: "Read and edit documents" }, { id: "shell", name: "Run commands", description: "Execute scripts on your machine" }, { id: "mail", name: "Send email", description: "Send on your behalf" }]}
        />
      </Demo>
      <Demo title="MCP servers" slug="mcp-servers">
        <McpServers
          className="max-w-xl"
          servers={servers}
          onToggle={(id, on) => setServers((s) => s.map((x) => (x.id === id ? { ...x, status: on ? "connected" : "disconnected", error: undefined } : x)))}
          onRetry={(id) => setServers((s) => s.map((x) => (x.id === id ? { ...x, status: "connected", tools: 3, error: undefined } : x)))}
        />
      </Demo>
      <Demo title="Prompt versions" slug="prompt-versions">
        <PromptVersions
          versions={[
            { id: "1", label: "v1", date: "Mar 1", author: "Ines", text: "You are a support agent. Answer questions about billing. Be brief." },
            { id: "2", label: "v2", date: "Mar 8", author: "Ines", text: "You are a support agent. Answer questions about billing and plans. Be brief and friendly." },
            { id: "3", label: "v3", date: "Mar 15", author: "Kofi", text: "You are a senior support agent. Answer questions about billing and plans. Be brief and friendly, and cite the help article." },
          ]}
        />
      </Demo>
      <Demo title="AI form fill" slug="ai-form-fill">
        <AiFormFill
          fields={[
            { id: "company", label: "Company", suggestion: "Northwind Studio", placeholder: "Company name" },
            { id: "role", label: "Your role", suggestion: "Head of Operations" },
            { id: "goal", label: "What do you want to automate?", suggestion: "Weekly reporting and routing inbound requests to the right team.", multiline: true },
          ]}
        />
      </Demo>
      <Demo title="Session replay" slug="session-replay">
        <SessionReplay
          className="max-w-xl"
          defaultTime={20}
          events={[
            { at: 2, kind: "user", text: "Find last quarter's churn drivers." },
            { at: 6, kind: "agent", text: "Pulling the churn table and the exit survey." },
            { at: 11, kind: "tool", text: "sql.query(churn_by_reason) returned 214 rows" },
            { at: 19, kind: "agent", text: "Pricing and missing integrations explain 61% of churn." },
            { at: 27, kind: "error", text: "export.csv failed: quota exceeded" },
            { at: 33, kind: "agent", text: "Retrying with a smaller export." },
          ]}
        />
      </Demo>
      <Demo title="Action items" slug="action-items">
        <ActionItems
          className="max-w-xl"
          today="2026-11-18"
          defaultItems={[
            { id: "1", text: "Send the revised pricing deck", owner: "Dana", due: "2026-11-14", quote: "I'll get the deck over before Friday." },
            { id: "2", text: "Book the onsite for December", owner: "Lee", due: "2026-11-28", quote: "Can someone lock in the venue?" },
            { id: "3", text: "Share the churn analysis", owner: "Priya", done: true },
          ]}
        />
      </Demo>
      <Demo title="Interview card" slug="interview-card">
        <InterviewCard
          name="Jordan Avery"
          role="Product designer"
          date="Nov 12"
          summary="Clear thinker with a strong systems portfolio. Struggled a little with the live critique but recovered well."
          criteria={[{ label: "Craft", score: 4.5 }, { label: "Systems", score: 4 }, { label: "Communication", score: 3.5 }, { label: "Collaboration", score: 4 }]}
          highlights={["Led a design-system rebuild across three teams", "Asked sharp questions about how success is measured"]}
        />
      </Demo>
      <Demo title="NL filter" slug="nl-filter">
        <NlFilter fields={FILTER_FIELDS} defaultValue={[{ field: "status", op: "is", value: "open", label: "Status: open" }]} placeholder="Try: high priority over 5 comments from last week" />
      </Demo>
      <Demo title="AI column" slug="ai-column">
        <AiColumn
          label="Sentiment"
          prompt="Classify the tone of each review"
          columns={[{ key: "customer", label: "Customer" }, { key: "review", label: "Review" }]}
          rows={[
            { id: "r1", customer: "Acme Co", review: "Setup took five minutes. Love it." },
            { id: "r2", customer: "Globex", review: "Support never answered my ticket." },
            { id: "r3", customer: "Initech", review: "Fine, though I wish it exported PDFs." },
          ]}
          generate={async (row) => {
            await new Promise((r) => setTimeout(r, 600 + Math.random() * 800));
            return /love/.test(row.review) ? "Positive" : /never/.test(row.review) ? "Negative" : "Mixed";
          }}
        />
      </Demo>
      <Demo title="Agent handoff" slug="agent-handoff">
        <AgentHandoff from={{ name: "Triage Bot", role: "Intake" }} to={{ name: "Billing Agent", role: "Refunds" }} reason="The customer is asking about a duplicate charge, which needs access to payment records." context={["Conversation summary", "Order #4821", "Customer tier: Pro"]} status="pending" onApprove={() => {}} onCancel={() => {}} />
      </Demo>
      <Demo title="Voice call" slug="voice-call">
        <VoiceCall name="Front desk agent" detail="+1 555 0142" status="live" startSeconds={74} caption="I can move your appointment to Thursday at ten." />
      </Demo>
      <Demo title="Email draft" slug="email-draft">
        <EmailDraft
          to="sam@example.com"
          subject="Following up on the proposal"
          defaultBody={"Hi Sam,\n\nI wanted to follow up on the proposal we sent last week and see whether you had a chance to review it. We would be glad to walk through any part of it on a call, whenever suits you.\n\nBest,\nAlex"}
          suggestions={[
            { id: "shorter", label: "Shorter", rewrite: async () => "Hi Sam,\n\nDid you get a chance to review the proposal? Happy to talk it through.\n\nAlex" },
            { id: "friendlier", label: "Friendlier", rewrite: async (b) => b.replace("Hi Sam,", "Hey Sam, hope your week is going well!") },
            { id: "formal", label: "More formal", rewrite: async (b) => b.replace("Hi Sam,", "Dear Sam,").replace("Best,", "Kind regards,") },
          ]}
        />
      </Demo>
      <Demo title="Policy block" slug="policy-block">
        <div className="grid gap-3">
          <PolicyBlock policy="Data privacy" rule="Messages may not contain full payment card numbers." outcome="blocked" excerpt="Sure, the card number is 4242 4242 4242 4242 and it expires in June." match="4242 4242 4242 4242" onOverride={() => {}} onDismiss={() => {}} />
          <PolicyBlock policy="Tone" rule="Avoid promising refund timelines." outcome="flagged" excerpt="You will definitely have your money back tomorrow." match="definitely" onDismiss={() => {}} />
          <PolicyBlock policy="Link safety" rule="Only approved domains may be linked." outcome="passed" />
        </div>
      </Demo>
      <Demo title="Agent card" slug="agent-card">
        <div className="flex flex-wrap gap-4">
          <AgentCard name="Scout Research" role="Researcher" model="Deep" status="busy" stats={[{ label: "Runs", value: "1.2k" }, { label: "Success", value: "96%" }, { label: "Avg", value: "14s" }]} tags={["Web", "Docs", "Citations"]} onSelect={() => {}} />
          <AgentCard name="Ledger" role="Bookkeeper" model="Balanced" status="offline" stats={[{ label: "Runs", value: "340" }, { label: "Success", value: "99%" }, { label: "Avg", value: "5s" }]} tags={["Invoices"]} />
        </div>
      </Demo>
      <Demo title="Live pill" slug="live-pill">
        <div className="flex flex-wrap items-center gap-3">
          <LivePill detail="1.2k watching" />
          <LivePill state="working" label="Agent working" />
          <LivePill state="idle" />
          <LivePill state="offline" />
        </div>
      </Demo>
      <Demo title="Connect apps" slug="connect-apps">
        <ConnectApps
          className="max-w-2xl"
          defaultValue={["cal"]}
          onToggle={() => new Promise((r) => setTimeout(r, 700))}
          apps={[
            { id: "cal", name: "Calendar", description: "Let the agent read events and propose times.", icon: <Calendar size={18} /> },
            { id: "docs", name: "Documents", description: "Search and cite files in your workspace.", icon: <FileText size={18} /> },
            { id: "chat", name: "Team chat", description: "Post summaries to channels you pick.", icon: <MessagesSquare size={18} /> },
            { id: "sheets", name: "Spreadsheets", description: "Read tables and append rows.", icon: <Table2 size={18} /> },
          ]}
        />
      </Demo>
    </div>
  );
}
