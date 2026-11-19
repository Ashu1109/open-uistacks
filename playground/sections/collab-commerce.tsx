import { useState, type ReactNode } from "react";
import { useDemoView } from "../demo";
import { ActivityFeed } from "../../originals/ui/activity-feed";
import { CommentThread, type ThreadComment } from "../../originals/ui/comment-thread";
import { KanbanBoard, type KanbanColumn } from "../../originals/ui/kanban-board";
import { IssueList } from "../../originals/ui/issue-list";
import { IssueRow, type Issue } from "../../originals/ui/issue-row";
import { DocumentCard } from "../../originals/ui/document-card";
import { PropertyPanel, type Property } from "../../originals/ui/property-panel";
import { ReactionBar, toggleReaction, type Reaction } from "../../originals/ui/reaction-bar";
import { RoadmapTimeline } from "../../originals/ui/roadmap-timeline";
import { BoardCard } from "../../originals/ui/board-card";
import { ProjectCard } from "../../originals/ui/project-card";
import { LiveCursors, type RemoteCursor } from "../../originals/ui/live-cursors";
import { VersionHistory } from "../../originals/ui/version-history";
import { ProductCard } from "../../originals/ui/product-card";
import { CartSummary } from "../../originals/ui/cart-summary";
import { CartItem } from "../../originals/ui/cart-item";
import { Receipt } from "../../originals/ui/receipt";
import { PaymentPicker } from "../../originals/ui/payment-picker";
import { PricingTable } from "../../originals/ui/pricing-table";
import { SupplierCompare } from "../../originals/ui/supplier-compare";
import { OrderTracker } from "../../originals/ui/order-tracker";
import { SubscriptionManager, type SubscriptionStatus } from "../../originals/ui/subscription-manager";
import { PricingCalculator } from "../../originals/ui/pricing-calculator";
import { OrderSummary } from "../../originals/ui/order-summary";
import { BillingPlanCard } from "../../originals/ui/billing-plan-card";

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
const ago = (minutes: number) => NOW - minutes * 60_000;

const COLUMNS: KanbanColumn[] = [
  { id: "todo", title: "Todo", cards: [
    { id: "t1", title: "Draft onboarding copy", labels: [{ text: "Content", tone: "info" }], assignee: "Mira Okafor", due: "Nov 24", comments: 2 },
    { id: "t2", title: "Audit empty states", labels: [{ text: "Design" }], due: "Nov 20", overdue: true },
  ] },
  { id: "doing", title: "In progress", cards: [{ id: "d1", title: "Build billing settings", labels: [{ text: "Frontend", tone: "success" }], assignee: "Jun Tanaka", comments: 5 }] },
  { id: "done", title: "Done", cards: [{ id: "x1", title: "Ship invite flow", assignee: "Sam Reyes" }] },
];

const ISSUES: Issue[] = [
  { id: "1", key: "APP-142", title: "Login redirect loops on expired sessions", status: "in-progress", priority: "urgent", assignee: "Mira Okafor", labels: ["bug"], updatedAt: ago(12) },
  { id: "2", key: "APP-141", title: "Add CSV export to reports", status: "todo", priority: "medium", assignee: "Jun Tanaka", labels: ["feature"], updatedAt: ago(180) },
  { id: "3", key: "APP-139", title: "Tidy up settings navigation", status: "backlog", priority: "low", updatedAt: ago(2880) },
  { id: "4", key: "APP-130", title: "Upgrade build tooling", status: "done", priority: "high", assignee: "Sam Reyes", updatedAt: ago(10_000) },
];

const COMMENTS: ThreadComment[] = [
  { id: "c1", author: "Mira Okafor", body: "Can we shorten the headline on the pricing page?", at: ago(42), replies: [
    { id: "c2", author: "Jun Tanaka", body: "Yes, trying a two-line version now.", at: ago(30) },
  ] },
  { id: "c3", author: "Sam Reyes", body: "Approved from my side.", at: ago(5) },
];

const PROPERTIES: Property[] = [
  { id: "title", label: "Title", value: "Q4 launch brief" },
  { id: "owner", label: "Owner", value: "Mira Okafor" },
  { id: "status", label: "Status", value: "review", options: [{ value: "draft", label: "Draft" }, { value: "review", label: "In review" }, { value: "final", label: "Final" }] },
  { id: "due", label: "Due date", value: "Dec 1, 2026", readOnly: true },
];

const CURSORS: RemoteCursor[] = [
  { id: "1", name: "Mira", x: 0.2, y: 0.3 },
  { id: "2", name: "Jun", x: 0.7, y: 0.6 },
];

const SUPPLIERS = [
  { id: "a", name: "Northwind Parts", unitPrice: 124, moq: 200, leadTimeDays: 12, rating: 4.4 },
  { id: "b", name: "Lakeside Supply", unitPrice: 109, moq: 500, leadTimeDays: 21, rating: 4.1 },
  { id: "c", name: "Harbor Works", unitPrice: 131, moq: 100, leadTimeDays: 7, rating: 4.8 },
];

const PLANS = [
  { id: "free", name: "Starter", description: "For trying things out", monthly: 0, features: ["1 project", "Community support"] },
  { id: "pro", name: "Pro", description: "For growing teams", monthly: 2400, yearly: 23_040, features: ["Unlimited projects", "Priority support", "Audit log"], highlighted: true, badge: "Popular" },
  { id: "team", name: "Team", description: "For larger orgs", monthly: 6900, yearly: 66_240, features: ["Everything in Pro", "SSO", "Custom roles"] },
];

const LINES = [
  { id: "l1", name: "Ceramic desk lamp", variant: "Matte white", unitPrice: 4500, quantity: 2 },
  { id: "l2", name: "Wool throw blanket", variant: "Oat", unitPrice: 8900, quantity: 1 },
];

function ReactionsDemo() {
  const [reactions, setReactions] = useState<Reaction[]>([{ emoji: "👍", count: 4, reacted: true }, { emoji: "🎉", count: 2, reacted: false }]);
  return <ReactionBar reactions={reactions} onToggle={(e) => setReactions((r) => toggleReaction(r, e))} />;
}

function CartDemo() {
  const [quantity, setQuantity] = useState(2);
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-[20px] bg-surface p-4 shadow-[var(--shadow-card)] dark:bg-raised">
        <CartItem name="Ceramic desk lamp" variant="Matte white" unitPrice={4500} quantity={quantity} onQuantityChange={setQuantity} onRemove={() => setQuantity(1)} />
      </div>
      <CartSummary lines={[{ unitPrice: 4500, quantity }, { unitPrice: 8900, quantity: 1 }]} discount={{ type: "percent", value: 10, label: "Welcome 10%" }} taxRate={0.08} shipping={500} onApplyCode={(c) => (c.toUpperCase() === "SAVE10" ? undefined : "That code is not valid")} onCheckout={() => {}} />
    </div>
  );
}

function PaymentDemo() {
  const [id, setId] = useState("m1");
  return (
    <div className="mx-auto max-w-sm">
      <PaymentPicker value={id} onValueChange={setId} onAddNew={() => {}} methods={[{ id: "m1", brand: "Visa", last4: "4242", expiry: "12/30" }, { id: "m2", brand: "Mastercard", last4: "0000", expiry: "08/29" }, { id: "m3", brand: "Visa", last4: "1111", expiry: "01/22" }]} />
    </div>
  );
}

function SubscriptionDemo() {
  const [planId, setPlanId] = useState("pro");
  const [status, setStatus] = useState<SubscriptionStatus>("active");
  return (
    <div className="mx-auto max-w-md">
      <SubscriptionManager planId={planId} status={status} renewsOn="2026-12-14T00:00:00Z" paymentMethod="Visa •••• 4242" plans={PLANS.map((p) => ({ id: p.id, name: p.name, price: p.monthly }))} onChangePlan={setPlanId} onCancel={() => setStatus("canceling")} onResume={() => setStatus("active")} />
    </div>
  );
}

export function Section() {
  return (
    <div className="grid gap-10">
      <Demo title="Comment thread" slug="comment-thread"><div className="mx-auto max-w-lg"><CommentThread comments={COMMENTS} onSubmit={() => {}} /></div></Demo>
      <Demo title="Activity feed" slug="activity-feed"><div className="mx-auto max-w-md"><ActivityFeed items={[
        { id: "1", actor: "Mira Okafor", action: "moved", target: "Audit empty states to Done", at: ago(4) },
        { id: "2", actor: "Jun Tanaka", action: "commented on", target: "Billing settings", at: ago(95), detail: "Needs a loading state for the plan switcher." },
        { id: "3", actor: "Sam Reyes", action: "created", target: "Q4 launch brief", at: ago(1600) },
      ]} /></div></Demo>
      <Demo title="Kanban board" slug="kanban-board"><KanbanBoard defaultColumns={COLUMNS} /></Demo>
      <Demo title="Issue list" slug="issue-list"><div className="mx-auto max-w-3xl"><IssueList issues={ISSUES} /></div></Demo>
      <Demo title="Document card" slug="document-card"><div className="mx-auto max-w-xs"><DocumentCard title="Q4 launch brief" preview="Goals for the quarter: raise activation, cut time to first project, and ship the new billing settings before the holiday freeze." owner="Mira Okafor" editedAt={ago(75)} collaborators={["Mira Okafor", "Jun Tanaka", "Sam Reyes", "Lee Park"]} onOpen={() => {}} /></div></Demo>
      <Demo title="Property panel" slug="property-panel"><div className="mx-auto max-w-sm"><PropertyPanel properties={PROPERTIES} /></div></Demo>
      <Demo title="Reaction bar" slug="reaction-bar"><ReactionsDemo /></Demo>
      <Demo title="Roadmap timeline" slug="roadmap-timeline"><RoadmapTimeline today="2026-02-12" items={[
        { id: "1", title: "Design refresh", start: "2026-01-05", end: "2026-02-13", progress: 0.8, tone: "success" },
        { id: "2", title: "Billing v2", start: "2026-01-26", end: "2026-03-20", progress: 0.35 },
        { id: "3", title: "Public API", start: "2026-03-02", end: "2026-04-24", tone: "warning" },
      ]} /></Demo>
      <Demo title="Board card" slug="board-card"><div className="mx-auto max-w-[280px]"><BoardCard title="Build billing settings" labels={[{ text: "Frontend", tone: "success" }, { text: "P1", tone: "danger" }]} assignee="Jun Tanaka" due="Nov 24" comments={5} /></div></Demo>
      <Demo title="Issue row" slug="issue-row"><div className="overflow-hidden rounded-[16px] bg-surface shadow-[var(--shadow-card)]"><IssueRow issue={ISSUES[0]} /></div></Demo>
      <Demo title="Project card" slug="project-card"><div className="mx-auto max-w-sm"><ProjectCard name="Atlas redesign" description="Refresh the dashboard shell, navigation and settings pages." status="at-risk" tasksDone={18} tasksTotal={26} due="Dec 12" members={["Mira Okafor", "Jun Tanaka", "Sam Reyes"]} onOpen={() => {}} /></div></Demo>
      <Demo title="Live cursors" slug="live-cursors"><LiveCursors cursors={CURSORS} className="grid h-48 place-items-center rounded-[16px] bg-surface text-sm text-fg-muted shadow-[var(--shadow-card)]"><span>Shared canvas</span></LiveCursors></Demo>
      <Demo title="Version history" slug="version-history"><div className="mx-auto max-w-sm"><VersionHistory onRestore={() => {}} versions={[
        { id: "v3", label: "Version 3", author: "Mira Okafor", at: ago(20), summary: "Tightened the intro" },
        { id: "v2", label: "Version 2", author: "Jun Tanaka", at: ago(400), summary: "Added pricing section" },
        { id: "v1", label: "Version 1", author: "Sam Reyes", at: ago(4000) },
      ]} /></div></Demo>
      <Demo title="Product card" slug="product-card"><div className="mx-auto max-w-[260px]"><ProductCard name="Ceramic desk lamp" price={4500} compareAtPrice={6000} rating={4.6} reviewCount={218} onAddToCart={() => {}} /></div></Demo>
      <Demo title="Cart summary" slug="cart-summary"><CartDemo /></Demo>
      <Demo title="Receipt" slug="receipt"><Receipt merchant="Lumen Goods" number="10428" paidAt="2026-11-14T10:24:00Z" lines={LINES} taxRate={0.08} shipping={500} paymentMethod="Visa •••• 4242" onPrint={() => {}} /></Demo>
      <Demo title="Payment picker" slug="payment-picker"><PaymentDemo /></Demo>
      <Demo title="Pricing table" slug="pricing-table"><PricingTable plans={PLANS} /></Demo>
      <Demo title="Supplier compare" slug="supplier-compare"><SupplierCompare suppliers={SUPPLIERS} onSelect={() => {}} /></Demo>
      <Demo title="Order tracker" slug="order-tracker"><div className="mx-auto max-w-sm"><OrderTracker current={2} steps={[
        { id: "1", label: "Order placed", at: "Nov 12, 9:41 AM" },
        { id: "2", label: "Packed", at: "Nov 12, 4:10 PM" },
        { id: "3", label: "Shipped", detail: "Arriving Nov 16" },
        { id: "4", label: "Delivered" },
      ]} /></div></Demo>
      <Demo title="Subscription manager" slug="subscription-manager"><SubscriptionDemo /></Demo>
      <Demo title="Pricing calculator" slug="pricing-calculator"><div className="mx-auto max-w-md"><PricingCalculator model={{ base: 2900, includedSeats: 3, seatPrice: 800, includedUnits: 10_000, overagePer1k: 150, yearlyDiscountPercent: 20 }} /></div></Demo>
      <Demo title="Order summary" slug="order-summary"><div className="mx-auto max-w-sm"><OrderSummary lines={LINES} taxRate={0.08} shipping={500} /></div></Demo>
      <Demo title="Cart item" slug="cart-item"><div className="mx-auto max-w-md"><CartItem name="Wool throw blanket" variant="Oat" unitPrice={8900} quantity={1} onQuantityChange={() => {}} onRemove={() => {}} /></div></Demo>
      <Demo title="Billing plan card" slug="billing-plan-card"><div className="mx-auto max-w-xs"><BillingPlanCard name="Pro" description="For growing teams" price={2400} features={["Unlimited projects", "Priority support", "Audit log"]} highlighted badge="Popular" ctaLabel="Upgrade" onSelect={() => {}} /></div></Demo>
    </div>
  );
}
