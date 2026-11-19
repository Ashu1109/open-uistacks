import { useState } from "react";
import { CheckCircle2, FileText, Rocket } from "lucide-react";
import { Demo } from "../demo";
import { Kbd, KbdCombo } from "../../registry/ui/kbd";
import { Avatar, AvatarGroup } from "../../registry/ui/avatar";
import { StatCard } from "../../registry/ui/stat-card";
import { CodeBlock } from "../../registry/ui/code-block";
import { AvatarStack } from "../../registry/ui/avatar-stack";
import { Leaderboard } from "../../registry/ui/leaderboard";
import { Timeline } from "../../registry/ui/timeline";
import { SortableList } from "../../registry/ui/sortable-list";
import { AudioPlayer } from "../../registry/ui/audio-player";
import { RollingNumber } from "../../registry/ui/rolling-number";
import { GroupedBar } from "../../registry/ui/grouped-bar";
import { CompareBars } from "../../registry/ui/compare-bars";
import { RingStats } from "../../registry/ui/ring-stats";
import { DonutChart } from "../../registry/ui/donut-chart";
import { AnnouncementPill } from "../../registry/ui/announcement-pill";
import { CopyPromptBox } from "../../registry/ui/copy-prompt-box";
import { NewsletterSignup } from "../../registry/ui/newsletter-signup";
import { ChangelogEntry } from "../../registry/ui/changelog-entry";
import { MetricStrip } from "../../registry/ui/metric-strip";
import { CtaBanner } from "../../registry/ui/cta-banner";
import { Confetti } from "../../registry/ui/confetti";
import { Button } from "../../registry/ui/button";

const usd = (v: number) => `$${Math.round(v).toLocaleString("en-US")}`;
const PEOPLE = ["Maya Chen", "Leo Ortiz", "Priya Nair", "Sam Okafor", "Ines Duarte", "Tomas Weber"].map((name) => ({ name }));

function RollingDemo() {
  const [v, setV] = useState(12480.5);
  return (
    <div className="grid justify-items-start gap-4">
      <RollingNumber value={v} label="Available balance" />
      <Button size="sm" variant="outline" onClick={() => setV((x) => x + 1284.6)}>
        Add deposit
      </Button>
    </div>
  );
}

function ConfettiDemo() {
  const [n, setN] = useState(0);
  return (
    <div className="flex justify-center">
      <Confetti fire={n} origin="element">
        <Button onClick={() => setN((x) => x + 1)}>
          <Rocket className="size-4" /> Celebrate launch
        </Button>
      </Confetti>
    </div>
  );
}

function PillDemo() {
  const lines = ["Workflows 2.0 is here", "Now with team workspaces"];
  const [i, setI] = useState(0);
  return <AnnouncementPill onClick={() => setI((x) => (x + 1) % lines.length)}>{lines[i]}</AnnouncementPill>;
}

export function Section() {
  return (
    <div className="grid gap-8">
      <Demo title="Kbd" slug="kbd">
        <div className="flex flex-wrap items-center gap-4">
          <KbdCombo keys={["⌘", "K"]} />
          <KbdCombo keys={["G", "I"]} separator="then" variant="soft" />
          <Kbd variant="inverse" size="md">Esc</Kbd>
        </div>
      </Demo>

      <Demo title="Avatar" slug="avatar">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name="Maya Chen" status="online" size="lg" />
          <Avatar name="Leo Ortiz" status="away" />
          <Avatar name="Design Team" shape="square" status="busy" />
          <AvatarGroup people={PEOPLE} max={4} />
        </div>
      </Demo>

      <Demo title="Stat card" slug="stat-card">
        <div className="max-w-sm">
          <StatCard
            label="Monthly revenue"
            value={48250}
            format={usd}
            delta={12.4}
            comparison="vs October"
            data={[22, 26, 24, 31, 35, 33, 41, 44, 48]}
            previous={[20, 21, 25, 24, 27, 30, 29, 33, 35]}
            labels={["Nov 1", "Nov 3", "Nov 5", "Nov 7", "Nov 9", "Nov 11", "Nov 13", "Nov 15", "Nov 17"]}
          />
        </div>
      </Demo>

      <Demo title="Code block" slug="code-block">
        <CodeBlock
          tabs={[
            { id: "ts", label: "Node.js", language: "ts", code: 'import { Client } from "acme";\n\nconst client = new Client({ key: process.env.KEY });\nawait client.projects.create({ name: "Demo" });', highlight: [4] },
            { id: "sh", label: "cURL", language: "bash", code: 'curl https://api.example.com/v1/projects \\\n  -d name="Demo"' },
          ]}
        />
      </Demo>

      <Demo title="Avatar stack" slug="avatar-stack">
        <AvatarStack people={PEOPLE.map((p, i) => ({ ...p, meta: i === 0 ? "Owner" : "Editing" }))} size={40} />
      </Demo>

      <Demo title="Leaderboard" slug="leaderboard">
        <div className="max-w-md">
          <Leaderboard
            title="Top reps"
            description="Deals closed"
            you="r4"
            scoreLabel="deals"
            defaultPeriod="week"
            periods={[
              { id: "week", label: "Week", rows: [
                { id: "r1", name: "Maya Chen", meta: "Enterprise · West", score: 18, delta: 2 },
                { id: "r2", name: "Leo Ortiz", meta: "Mid-market · East", score: 15, delta: -1 },
                { id: "r3", name: "Priya Nair", meta: "SMB · Central", score: 13, delta: 0 },
                { id: "r4", name: "Sam Okafor", meta: "Enterprise · East", score: 11, delta: 1 },
                { id: "r5", name: "Ines Duarte", meta: "SMB · West", score: 9 },
              ] },
              { id: "month", label: "Month", rows: [
                { id: "r1", name: "Maya Chen", meta: "Enterprise · West", score: 61 },
                { id: "r2", name: "Leo Ortiz", meta: "Mid-market · East", score: 66 },
                { id: "r3", name: "Priya Nair", meta: "SMB · Central", score: 48 },
                { id: "r4", name: "Sam Okafor", meta: "Enterprise · East", score: 52 },
                { id: "r5", name: "Ines Duarte", meta: "SMB · West", score: 40 },
              ] },
            ]}
          />
        </div>
      </Demo>

      <Demo title="Timeline" slug="timeline">
        <div className="max-w-md">
          <Timeline
            aria-label="Order activity"
            visible={3}
            events={[
              { id: "1", day: "Today", time: "10:42 AM", title: "Payment received", tone: "success", icon: <CheckCircle2 /> },
              { id: "2", day: "Today", time: "9:15 AM", title: "Invoice sent", body: "Sent to billing@example.com", attachments: [{ name: "invoice-204.pdf", meta: "240 KB", icon: <FileText /> }] },
              { id: "3", day: "Nov 6", time: "4:03 PM", title: "Order created" },
              { id: "4", day: "Nov 6", time: "4:01 PM", title: "Cart checked out" },
            ]}
          />
        </div>
      </Demo>

      <Demo title="Sortable list" slug="sortable-list">
        <div className="max-w-sm">
          <SortableList
            aria-label="Pipeline stages"
            numbered
            removable
            defaultItems={[
              { id: "lead", label: "Lead", description: "New inbound", trailing: "42" },
              { id: "qual", label: "Qualified", description: "Discovery done", trailing: "18" },
              { id: "prop", label: "Proposal", description: "Pricing sent", trailing: "9" },
              { id: "won", label: "Closed won", trailing: "4" },
            ]}
          />
        </div>
      </Demo>

      <Demo title="Audio player" slug="audio-player">
        <div className="grid max-w-md gap-4">
          <AudioPlayer title="Call with Dana" meta="Zoom · Oct 21 · 4:12" duration={252} />
          <AudioPlayer layout="compact" duration={38} />
        </div>
      </Demo>

      <Demo title="Rolling number" slug="rolling-number">
        <RollingDemo />
      </Demo>

      <Demo title="Grouped bar" slug="grouped-bar">
        <GroupedBar
          label="Revenue by channel, May to Oct"
          categories={["May", "Jun", "Jul", "Aug", "Sep", "Oct"]}
          series={[
            { name: "Online", values: [12000, 14000, 13500, 17000, 18000, 19500] },
            { name: "Retail", values: [9000, 9500, 11000, 10500, 12000, 12500] },
            { name: "Partners", values: [4000, 5200, 4800, 6100, 6500, 7200] },
          ]}
          format={usd}
          formatAxis={(v) => `$${v / 1000}k`}
        />
      </Demo>

      <Demo title="Compare bars" slug="compare-bars">
        <CompareBars
          title="Spending"
          labels={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}
          defaultValue="this"
          compare
          format={usd}
          periods={[
            { id: "this", label: "This week", range: "Nov 9 – 15", values: [42, 118, 64, 90, null, null, null], days: ["Mon, Nov 9", "Tue, Nov 10", "Wed, Nov 11", "Thu, Nov 12", "Fri, Nov 13", "Sat, Nov 14", "Sun, Nov 15"] },
            { id: "last", label: "Last week", range: "Nov 2 – 8", values: [55, 72, 80, 61, 140, 96, 33], days: ["Mon, Nov 2", "Tue, Nov 3", "Wed, Nov 4", "Thu, Nov 5", "Fri, Nov 6", "Sat, Nov 7", "Sun, Nov 8"] },
          ]}
        />
      </Demo>

      <Demo title="Ring stats" slug="ring-stats">
        <RingStats
          title="Weekly goals"
          description="Nov 9 – 15"
          rings={[
            { label: "Calls", value: 34, goal: 40 },
            { label: "Demos", value: 12, goal: 12 },
            { label: "Follow-ups", value: 21, goal: 50 },
          ]}
        />
      </Demo>

      <Demo title="Donut chart" slug="donut-chart">
        <DonutChart
          title="Revenue by channel"
          description="October"
          format={usd}
          slices={[
            { label: "Online store", value: 52000 },
            { label: "Retail", value: 31000 },
            { label: "Partners", value: 17000 },
            { label: "Wholesale", value: 9000 },
          ]}
        />
      </Demo>

      <Demo title="Announcement pill" slug="announcement-pill">
        <PillDemo />
      </Demo>

      <Demo title="Copy prompt box" slug="copy-prompt-box">
        <div className="max-w-md">
          <CopyPromptBox
            label="Paste this into your assistant"
            prompt="Add a pricing page with three tiers, a monthly/yearly toggle and a comparison table. Use the existing design tokens."
          />
        </div>
      </Demo>

      <Demo title="Newsletter signup" slug="newsletter-signup">
        <div className="max-w-md">
          <NewsletterSignup title="Get the monthly digest" description="Product updates and tips, one email a month." privacy="No spam. Unsubscribe anytime." />
        </div>
      </Demo>

      <Demo title="Changelog entry" slug="changelog-entry">
        <div className="max-w-xl">
          <ChangelogEntry
            version="v1.16"
            date="Nov 12"
            title="Faster dashboards"
            description="Reports now load in under a second, and filters remember your last view."
            changes={[
              { kind: "new", text: "Saved filter presets" },
              { kind: "improved", text: "Chart rendering is twice as fast" },
              { kind: "fixed", text: "Export no longer drops the last row" },
            ]}
            details={<p>We rebuilt the query layer to cache partial results, so switching date ranges reuses work already done.</p>}
            author={{ name: "Jordan Lee", role: "Design engineer" }}
          />
        </div>
      </Demo>

      <Demo title="Metric strip" slug="metric-strip">
        <MetricStrip
          aria-label="Platform in numbers"
          metrics={[
            { value: 12.4, decimals: 1, suffix: "K", label: "Active teams", delta: { text: "+12.6% vs last month", trend: "up" } },
            { value: 99.98, decimals: 2, suffix: "%", label: "Uptime", delta: { text: "no change", trend: "neutral" } },
            { value: 320, suffix: "ms", label: "Median latency", delta: { text: "-8% vs last month", trend: "down" } },
          ]}
        />
      </Demo>

      <Demo title="CTA banner" slug="cta-banner">
        <CtaBanner
          eyebrow="Ready when you are"
          title="Ship your next release faster"
          description="Start free, upgrade when your team grows."
          primary={{ label: "Get started" }}
          secondary={{ label: "Talk to sales" }}
        />
      </Demo>

      <Demo title="Confetti" slug="confetti">
        <ConfettiDemo />
      </Demo>
    </div>
  );
}
