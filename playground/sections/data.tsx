import { useState, type ReactNode } from "react";
import { useDemoView } from "../demo";
import { Blocks, Gauge, GitBranch, Layers, Mail, MessageSquare, ShieldCheck, Zap } from "lucide-react";
import { DataTable, type DataColumn } from "../../originals/ui/data-table";
import { SettingsRow } from "../../originals/ui/settings-row";
import { ApiKeyRow } from "../../originals/ui/api-key-row";
import { WeekCalendar, type CalendarEvent } from "../../originals/ui/week-calendar";
import { ResizablePanels } from "../../originals/ui/resizable-panels";
import { SparklineTable } from "../../originals/ui/sparkline-table";
import { Carousel } from "../../originals/ui/carousel";
import { MonthCalendar } from "../../originals/ui/month-calendar";
import { FileManager, type FileNode } from "../../originals/ui/file-manager";
import { CohortTable } from "../../originals/ui/cohort-table";
import { OrgChart, type OrgNode } from "../../originals/ui/org-chart";
import { GanttChart, type GanttTask } from "../../originals/ui/gantt-chart";
import { CycleCard } from "../../originals/ui/cycle-card";
import { GanttRow } from "../../originals/ui/gantt-row";
import { IntegrationCard } from "../../originals/ui/integration-card";
import { SwipeRow } from "../../originals/ui/swipe-row";
import { TestimonialCard } from "../../originals/ui/testimonial-card";
import { FaqList } from "../../originals/ui/faq-list";
import { FeatureGrid } from "../../originals/ui/feature-grid";
import { StepsCard } from "../../originals/ui/steps-card";

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

interface Run { id: string; name: string; status: string; tokens: number; cost: number }
const RUNS: Run[] = [
  { id: "r-101", name: "Summarize inbox", status: "Done", tokens: 12400, cost: 0.31 },
  { id: "r-102", name: "Classify tickets", status: "Running", tokens: 48200, cost: 1.2 },
  { id: "r-103", name: "Draft release notes", status: "Done", tokens: 8900, cost: 0.22 },
  { id: "r-104", name: "Extract invoices", status: "Failed", tokens: 3100, cost: 0.08 },
  { id: "r-105", name: "Translate docs", status: "Done", tokens: 64300, cost: 1.61 },
  { id: "r-106", name: "Tag support threads", status: "Queued", tokens: 0, cost: 0 },
  { id: "r-107", name: "Audit prompts", status: "Done", tokens: 21700, cost: 0.54 },
];
const RUN_COLUMNS: DataColumn<Run>[] = [
  { key: "name", header: "Run", sortable: true },
  { key: "status", header: "Status", sortable: true },
  { key: "tokens", header: "Tokens", sortable: true, align: "right", cell: (r) => r.tokens.toLocaleString("en-US") },
  { key: "cost", header: "Cost", sortable: true, align: "right", cell: (r) => `$${r.cost.toFixed(2)}` },
];

const day = (offset: number, h: number, m = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() + offset);
  d.setHours(h, m, 0, 0);
  return d;
};
const EVENTS: CalendarEvent[] = [
  { id: "Standup", title: "Standup", start: day(1, 9), end: day(1, 9, 30) },
  { id: "Design review", title: "Design review", start: day(1, 10), end: day(1, 11, 30), tone: "warning" },
  { id: "1:1", title: "1:1 sync", start: day(1, 10, 30), end: day(1, 11), tone: "success" },
  { id: "Planning", title: "Planning", start: day(3, 13), end: day(3, 15) },
  { id: "Demo", title: "Demo day", start: day(4, 14), end: day(4, 16), tone: "danger" },
  { id: "Retro", title: "Retro", start: day(4, 15), end: day(4, 16, 30), tone: "success" },
];

const FILES: FileNode[] = [
  { id: "docs", name: "Documents", children: [
    { id: "spec", name: "product-spec.pdf", size: 1_820_000, modified: new Date(2026, 9, 28) },
    { id: "notes", name: "meeting-notes.md", size: 4_200, modified: new Date(2026, 10, 2) },
    { id: "arch", name: "Archive", children: [{ id: "old", name: "roadmap-2025.csv", size: 88_000, modified: new Date(2025, 11, 12) }] },
  ] },
  { id: "media", name: "Media", children: [
    { id: "hero", name: "hero-shot.png", size: 3_400_000, modified: new Date(2026, 10, 9) },
    { id: "clip", name: "walkthrough.mp4", size: 48_000_000, modified: new Date(2026, 10, 11) },
  ] },
  { id: "script", name: "build.ts", size: 2_100, modified: new Date(2026, 10, 14) },
  { id: "bundle", name: "export.zip", size: 12_800_000, modified: new Date(2026, 10, 15) },
];

const ORG: OrgNode = {
  id: "ceo", name: "Ava Stone", title: "Chief Executive",
  children: [
    { id: "eng", name: "Ben Lake", title: "VP Engineering", children: [{ id: "fe", name: "Cam Fox", title: "Frontend Lead" }, { id: "be", name: "Dee Ray", title: "Backend Lead" }, { id: "ml", name: "Kit Vale", title: "ML Lead" }] },
    { id: "design", name: "Eli Moss", title: "Head of Design", children: [{ id: "pd", name: "Fay Orr", title: "Product Designer" }] },
    { id: "ops", name: "Gus Penn", title: "Operations" },
  ],
};

const t = (m: number, d: number) => new Date(2026, m, d);
const TASKS: GanttTask[] = [
  { id: "1", label: "Research", start: t(10, 2), end: t(10, 13), progress: 1, color: "var(--success)" },
  { id: "2", label: "Design system", start: t(10, 9), end: t(10, 25), progress: 0.7 },
  { id: "3", label: "Build API", start: t(10, 16), end: t(11, 6), progress: 0.35 },
  { id: "4", label: "Beta launch", start: t(11, 1), end: t(11, 14), progress: 0, color: "var(--warning)" },
];

const SLIDES = ["Ship faster", "Stay in flow", "Own your data"];
const COHORTS = [
  { label: "Oct 6", size: 1280, values: [1, 0.62, 0.48, 0.41, 0.37] },
  { label: "Oct 13", size: 1105, values: [1, 0.66, 0.5, 0.42] },
  { label: "Oct 20", size: 1342, values: [1, 0.58, 0.45] },
  { label: "Oct 27", size: 990, values: [1, 0.64] },
];

export function Section() {
  const [panel, setPanel] = useState(35);
  return (
    <div className="grid gap-8">
      <Demo title="Data table" slug="data-table">
        <DataTable label="Runs" columns={RUN_COLUMNS} rows={RUNS} getRowId={(r) => r.id} selectable pageSize={5} />
      </Demo>
      <Demo title="Settings row" slug="settings-row">
        <div className="max-w-xl divide-y divide-[var(--track)] rounded-[20px] bg-surface px-5 shadow-[var(--shadow-card)]">
          <SettingsRow title="Email notifications" description="A weekly digest of activity in your workspace." defaultChecked />
          <SettingsRow title="Auto-save drafts" description="Keep unsent prompts between sessions." defaultChecked={false} />
          <SettingsRow title="Language" description="Used for the interface and exports.">
            <select aria-label="Language" className="h-9 rounded-[10px] bg-subtle px-3 text-sm text-fg"><option>English</option><option>Deutsch</option></select>
          </SettingsRow>
        </div>
      </Demo>
      <Demo title="API key row" slug="api-key-row">
        <div className="grid max-w-xl gap-3">
          <ApiKeyRow name="Production" value="sk_test_Zq81xK0aVn3mHd5R" createdLabel="Created Oct 12" />
          <ApiKeyRow name="Staging" value="sk_test_Pw27bT6cLe9yFg4J" createdLabel="Created Nov 3" />
        </div>
      </Demo>
      <Demo title="Week calendar" slug="week-calendar"><WeekCalendar events={EVENTS} /></Demo>
      <Demo title="Resizable panels" slug="resizable-panels">
        <ResizablePanels className="h-48" size={panel} onSizeChange={setPanel} start={<p className="p-4 text-sm text-fg">Sidebar · {Math.round(panel)}%</p>} end={<p className="p-4 text-sm text-fg-muted">Drag the handle, or focus it and use the arrow keys.</p>} />
      </Demo>
      <Demo title="Sparkline table" slug="sparkline-table">
        <SparklineTable caption="Weekly metrics" rows={[
          { id: "1", label: "Active users", series: [320, 340, 335, 380, 410, 450, 472] },
          { id: "2", label: "Requests", series: [12, 14, 13, 19, 22, 21, 27], format: (v) => `${v}k` },
          { id: "3", label: "Error rate", series: [4.2, 3.9, 4.4, 3.1, 2.8, 2.9, 2.2], format: (v) => `${v}%` },
        ]} />
      </Demo>
      <Demo title="Carousel" slug="carousel">
        <Carousel label="Highlights">
          {SLIDES.map((s, i) => (
            <div key={s} className="grid h-44 place-items-center rounded-[20px] text-lg font-semibold text-fg" style={{ background: `color-mix(in srgb, var(--select) ${12 + i * 10}%, var(--surface))` }}>{s}</div>
          ))}
        </Carousel>
      </Demo>
      <Demo title="Month calendar" slug="month-calendar"><MonthCalendar events={EVENTS} /></Demo>
      <Demo title="File manager" slug="file-manager"><FileManager items={FILES} /></Demo>
      <Demo title="Cohort table" slug="cohort-table"><CohortTable rows={COHORTS} /></Demo>
      <Demo title="Org chart" slug="org-chart"><OrgChart root={ORG} /></Demo>
      <Demo title="Gantt chart" slug="gantt-chart"><GanttChart tasks={TASKS} today={t(10, 18)} /></Demo>
      <Demo title="Cycle card" slug="cycle-card">
        <div className="flex flex-wrap gap-4">
          <CycleCard name="Cycle" number={12} start={t(10, 10)} end={t(10, 24)} total={32} started={9} completed={14} now={t(10, 18)} />
          <CycleCard name="Cycle" number={11} start={t(9, 27)} end={t(10, 9)} total={28} started={0} completed={26} now={t(10, 18)} />
        </div>
      </Demo>
      <Demo title="Gantt row" slug="gantt-row">
        <div className="max-w-xl rounded-[20px] bg-surface px-4 py-2 shadow-[var(--shadow-card)]">
          <GanttRow label="Design system" start={t(10, 9)} end={t(10, 25)} rangeStart={t(10, 1)} rangeEnd={t(10, 30)} progress={0.7} />
          <GanttRow label="Build API" start={t(10, 16)} end={t(11, 6)} rangeStart={t(10, 1)} rangeEnd={t(10, 30)} progress={0.35} color="var(--warning)" />
        </div>
      </Demo>
      <Demo title="Integration card" slug="integration-card">
        <div className="flex flex-wrap gap-4">
          <IntegrationCard name="Chat Sync" description="Post run summaries to a team channel." icon={<MessageSquare size={20} />} onConnect={() => new Promise((r) => setTimeout(r, 800))} />
          <IntegrationCard name="Mail Relay" description="Send alerts and digests by email." icon={<Mail size={20} />} defaultConnected />
          <IntegrationCard name="Repo Hooks" description="Trigger runs from pushes and pull requests." icon={<GitBranch size={20} />} />
        </div>
      </Demo>
      <Demo title="Swipe row" slug="swipe-row">
        <div className="grid max-w-md gap-2">
          {["Invoice 1042", "Invoice 1043"].map((n) => (
            <SwipeRow key={n} actions={[{ id: "archive", label: "Archive", onSelect: () => {} }, { id: "delete", label: "Delete", tone: "danger", onSelect: () => {} }]}>
              <p className="text-sm font-medium text-fg">{n}</p>
              <p className="text-xs text-fg-muted">Swipe left, or press the left arrow key</p>
            </SwipeRow>
          ))}
        </div>
      </Demo>
      <Demo title="Testimonial card" slug="testimonial-card">
        <TestimonialCard quote="We replaced three internal tools with one workspace and cut review time in half." author="Maya Chen" role="Head of Operations" rating={5} />
      </Demo>
      <Demo title="FAQ list" slug="faq-list">
        <FaqList defaultOpen={["a"]} items={[
          { id: "a", question: "Can I bring my own model?", answer: "Yes. Point the workspace at any compatible endpoint and keep your keys in your own vault." },
          { id: "b", question: "How is usage billed?", answer: "Per token, with a monthly spending cap you control." },
          { id: "c", question: "Is my data used for training?", answer: "No. Prompts and outputs stay in your workspace." },
        ]} />
      </Demo>
      <Demo title="Feature grid" slug="feature-grid">
        <FeatureGrid features={[
          { id: "1", icon: <Zap size={18} />, title: "Instant previews", description: "See results stream in as they are generated." },
          { id: "2", icon: <ShieldCheck size={18} />, title: "Private by default", description: "Role-based access and audit trails built in." },
          { id: "3", icon: <Layers size={18} />, title: "Composable blocks", description: "Mix prompts, tools and data into reusable flows." },
          { id: "4", icon: <Gauge size={18} />, title: "Cost controls", description: "Budgets and alerts per project." },
          { id: "5", icon: <Blocks size={18} />, title: "Open integrations", description: "Connect the tools your team already uses." },
          { id: "6", icon: <GitBranch size={18} />, title: "Versioned flows", description: "Branch, compare and roll back any change." },
        ]} />
      </Demo>
      <Demo title="Steps card" slug="steps-card">
        <StepsCard title="Get started" current={1} steps={[
          { title: "Create your workspace", description: "Name it and invite your team." },
          { title: "Connect a data source", description: "Import files or link a database." },
          { title: "Run your first flow", description: "Pick a template and press run." },
          { title: "Share the results" },
        ]} />
      </Demo>
    </div>
  );
}
