import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ActivityFeed, formatRelativeTime } from "./ui/activity-feed";
import { CommentThread, countComments, type ThreadComment } from "./ui/comment-thread";
import { KanbanBoard, findCard, moveCard, stepPosition, type KanbanColumn } from "./ui/kanban-board";
import { IssueList, filterIssues, groupIssues } from "./ui/issue-list";
import { IssueRow, type Issue } from "./ui/issue-row";
import { DocumentCard } from "./ui/document-card";
import { PropertyPanel, displayValue } from "./ui/property-panel";
import { ReactionBar, toggleReaction } from "./ui/reaction-bar";
import { RoadmapTimeline, barLayout, timelineRange } from "./ui/roadmap-timeline";
import { BoardCard, initials } from "./ui/board-card";
import { ProjectCard, projectProgress } from "./ui/project-card";
import { LiveCursors, cursorOffset } from "./ui/live-cursors";
import { VersionHistory } from "./ui/version-history";
import { ProductCard, discountPercent } from "./ui/product-card";
import { CartSummary, computeTotals, discountAmount, formatMoney } from "./ui/cart-summary";
import { Receipt } from "./ui/receipt";
import { PaymentPicker, isExpired, maskCard } from "./ui/payment-picker";
import { PricingTable, priceFor, yearlySavings, type PricingPlan } from "./ui/pricing-table";
import { SupplierCompare, bestValues, sortSuppliers, type Supplier } from "./ui/supplier-compare";
import { OrderTracker, orderProgress, stepStatus } from "./ui/order-tracker";
import { SubscriptionManager, renewalLabel } from "./ui/subscription-manager";
import { PricingCalculator, estimatePrice, type PricingModel } from "./ui/pricing-calculator";
import { OrderSummary } from "./ui/order-summary";
import { CartItem, clampQuantity } from "./ui/cart-item";
import { BillingPlanCard } from "./ui/billing-plan-card";

afterEach(cleanup);

const NOW = Date.UTC(2026, 10, 18, 12, 0, 0);
const ago = (seconds: number) => NOW - seconds * 1000;

const COLUMNS: KanbanColumn[] = [
  { id: "todo", title: "Todo", cards: [{ id: "a", title: "Draft spec" }, { id: "b", title: "Review copy" }] },
  { id: "doing", title: "Doing", cards: [{ id: "c", title: "Build panel" }] },
  { id: "done", title: "Done", cards: [] },
];

const ISSUES: Issue[] = [
  { id: "1", key: "ENG-1", title: "Fix login redirect", status: "todo", priority: "high", assignee: "Ada Lane", labels: ["bug"], updatedAt: ago(300) },
  { id: "2", key: "ENG-2", title: "Add export", status: "in-progress", assignee: "Bo Chen" },
  { id: "3", key: "ENG-3", title: "Old cleanup", status: "done" },
];

const PLANS: PricingPlan[] = [
  { id: "free", name: "Starter", monthly: 0, features: ["1 project"] },
  { id: "pro", name: "Pro", monthly: 2000, yearly: 19_200, features: ["Unlimited projects"], highlighted: true },
];

describe("relative time", () => {
  it("formats short relative strings", () => {
    expect(formatRelativeTime(ago(3), NOW)).toBe("just now");
    expect(formatRelativeTime(ago(180), NOW)).toBe("3m ago");
    expect(formatRelativeTime(ago(7200), NOW)).toBe("2h ago");
    expect(formatRelativeTime(ago(86_400), NOW)).toBe("yesterday");
    expect(formatRelativeTime(NOW + 3 * 60_000, NOW)).toMatch(/^in 3m/);
  });
});

describe("collaboration helpers", () => {
  it("moves cards between and within columns without mutating", () => {
    const moved = moveCard(COLUMNS, "a", "doing", 0);
    expect(moved[0].cards.map((c) => c.id)).toEqual(["b"]);
    expect(moved[1].cards.map((c) => c.id)).toEqual(["a", "c"]);
    expect(COLUMNS[0].cards).toHaveLength(2);
    expect(moveCard(COLUMNS, "a", "todo", 5)[0].cards.map((c) => c.id)).toEqual(["b", "a"]);
    expect(moveCard(COLUMNS, "nope", "doing", 0)).toBe(COLUMNS);
    expect(findCard(COLUMNS, "c")).toEqual({ columnId: "doing", index: 0 });
  });

  it("steps positions and stops at edges", () => {
    expect(stepPosition(COLUMNS, { columnId: "todo", index: 1 }, "right")).toEqual({ columnId: "doing", index: 1 });
    expect(stepPosition(COLUMNS, { columnId: "todo", index: 0 }, "left")).toBeNull();
    expect(stepPosition(COLUMNS, { columnId: "todo", index: 0 }, "up")).toBeNull();
    expect(stepPosition(COLUMNS, { columnId: "todo", index: 0 }, "down")).toEqual({ columnId: "todo", index: 1 });
  });

  it("counts comments, toggles reactions, filters and groups issues", () => {
    const tree: ThreadComment[] = [{ id: "1", author: "A", body: "x", at: NOW, replies: [{ id: "2", author: "B", body: "y", at: NOW }] }];
    expect(countComments(tree)).toBe(2);
    expect(toggleReaction([{ emoji: "👍", count: 1, reacted: true }], "👍")).toEqual([]);
    expect(toggleReaction([], "🎉")).toEqual([{ emoji: "🎉", count: 1, reacted: true }]);
    expect(toggleReaction([{ emoji: "👍", count: 2, reacted: false }], "👍")[0]).toMatchObject({ count: 3, reacted: true });
    expect(filterIssues(ISSUES, "login").map((i) => i.key)).toEqual(["ENG-1"]);
    expect(filterIssues(ISSUES, "bug")).toHaveLength(1);
    expect(groupIssues(ISSUES).map((g) => g.status)).toEqual(["in-progress", "todo", "done"]);
    expect(initials("Ada Lane Smith")).toBe("AL");
    expect(projectProgress(3, 4)).toBe(75);
    expect(projectProgress(1, 0)).toBe(0);
    expect(displayValue({ id: "s", label: "S", value: "b", options: [{ value: "b", label: "Beta" }] })).toBe("Beta");
    expect(displayValue({ id: "s", label: "S", value: "" })).toBe("—");
    expect(cursorOffset({ x: 1.4, y: -1 })).toEqual({ left: "100%", top: "0%" });
  });

  it("lays out roadmap bars on a month scale", () => {
    const items = [{ id: "a", title: "A", start: "2026-01-01", end: "2026-01-31" }, { id: "b", title: "B", start: "2026-03-01", end: "2026-03-31" }];
    const range = timelineRange(items);
    expect(range.months).toHaveLength(3);
    const first = barLayout("2026-01-01", "2026-01-31", range.start, range.end);
    expect(first.left).toBe(0);
    expect(first.width).toBeCloseTo((31 / 90) * 100, 3);
    expect(barLayout("2025-01-01", "2025-02-01", range.start, range.end).width).toBe(0);
  });
});

describe("collaboration components", () => {
  it("renders the activity feed with timestamps", () => {
    render(<ActivityFeed now={NOW} items={[{ id: "1", actor: "Ada", action: "merged", target: "PR 12", at: ago(180) }]} />);
    expect(screen.getByRole("list", { name: "Activity" }).textContent).toContain("Ada merged PR 12");
    expect(screen.getByText("3m ago")).toBeTruthy();
  });

  it("submits replies and top-level comments", async () => {
    const onSubmit = vi.fn();
    render(<CommentThread now={NOW} onSubmit={onSubmit} comments={[{ id: "c1", author: "Ada", body: "Looks good", at: ago(60), replies: [{ id: "c2", author: "Bo", body: "Thanks", at: ago(30) }] }]} />);
    expect(screen.getByRole("region", { name: "Comments (2)" })).toBeTruthy();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Reply to Ada" }));
    await user.type(screen.getByRole("textbox", { name: "Reply to Ada" }), "Agreed");
    await user.click(screen.getAllByRole("button", { name: "Send" })[0]);
    expect(onSubmit).toHaveBeenCalledWith("Agreed", "c1");
    await user.type(screen.getByRole("textbox", { name: "Add a comment" }), "New thread");
    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(onSubmit).toHaveBeenLastCalledWith("New thread", null);
  });

  it("moves a card with the keyboard and announces it", async () => {
    const onColumnsChange = vi.fn();
    render(<KanbanBoard defaultColumns={COLUMNS} onColumnsChange={onColumnsChange} />);
    const user = userEvent.setup();
    screen.getByRole("button", { name: "Draft spec" }).focus();
    await user.keyboard(" ");
    expect(screen.getByRole("status").textContent).toContain("Picked up Draft spec");
    await user.keyboard("{ArrowRight}");
    expect(within(screen.getByRole("region", { name: /^Doing/ })).getByRole("button", { name: "Draft spec" })).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain("Draft spec moved to Doing");
    await user.keyboard(" ");
    expect(screen.getByRole("status").textContent).toContain("Dropped Draft spec");
    expect(onColumnsChange).toHaveBeenCalledTimes(1);
  });

  it("cancels a keyboard move with Escape", async () => {
    render(<KanbanBoard defaultColumns={COLUMNS} />);
    const user = userEvent.setup();
    screen.getByRole("button", { name: "Draft spec" }).focus();
    await user.keyboard(" {ArrowRight}{Escape}");
    expect(within(screen.getByRole("region", { name: /^Todo/ })).getByRole("button", { name: "Draft spec" })).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain("Move cancelled");
  });

  it("filters the issue list and renders a row", async () => {
    render(<IssueList issues={ISSUES} now={NOW} />);
    expect(screen.getByRole("region", { name: "Todo, 1 issues" })).toBeTruthy();
    await userEvent.setup().type(screen.getByRole("searchbox", { name: "Filter issues" }), "export");
    await waitFor(() => expect(screen.queryByText("Fix login redirect")).toBeNull());
    expect(screen.getByText("Add export")).toBeTruthy();
  });

  it("opens an issue from its row", async () => {
    const onOpen = vi.fn();
    render(<IssueRow issue={ISSUES[0]} onOpen={onOpen} now={NOW} />);
    expect(screen.getByText("Priority: High")).toBeTruthy();
    expect(screen.getByText("5m ago")).toBeTruthy();
    await userEvent.setup().click(screen.getByRole("button"));
    expect(onOpen).toHaveBeenCalledWith(ISSUES[0]);
  });

  it("renders a document card as a link", () => {
    render(<DocumentCard title="Launch plan" href="#doc" owner="Ada" editedAt={ago(3600)} now={NOW} collaborators={["Ada Lane", "Bo Chen"]} />);
    expect(screen.getByRole("link", { name: "Launch plan" }).getAttribute("href")).toBe("#doc");
    expect(screen.getByText(/Edited/).textContent).toContain("1h ago");
    expect(screen.getByRole("list", { name: "2 collaborators" })).toBeTruthy();
  });

  it("edits a property in place and changes a select", async () => {
    const onChange = vi.fn();
    render(<PropertyPanel onChange={onChange} properties={[{ id: "owner", label: "Owner", value: "Ada" }, { id: "stage", label: "Stage", value: "draft", options: [{ value: "draft", label: "Draft" }, { value: "live", label: "Live" }] }]} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Edit Owner" }));
    const input = screen.getByRole("textbox", { name: "Owner" });
    await user.clear(input);
    await user.type(input, "Bo{Enter}");
    expect(onChange).toHaveBeenCalledWith("owner", "Bo");
    await user.selectOptions(screen.getByRole("combobox", { name: "Stage" }), "live");
    expect(onChange).toHaveBeenLastCalledWith("stage", "live");
  });

  it("cancels a property edit with Escape", async () => {
    const onChange = vi.fn();
    render(<PropertyPanel onChange={onChange} properties={[{ id: "owner", label: "Owner", value: "Ada" }]} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Edit Owner" }));
    await user.type(screen.getByRole("textbox", { name: "Owner" }), "zzz{Escape}");
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Edit Owner" }).textContent).toContain("Ada");
  });

  it("toggles a reaction and opens the picker", async () => {
    const onToggle = vi.fn();
    render(<ReactionBar onToggle={onToggle} reactions={[{ emoji: "👍", count: 2, reacted: true }]} />);
    const user = userEvent.setup();
    expect(screen.getByRole("button", { name: "👍 2" }).getAttribute("aria-pressed")).toBe("true");
    await user.click(screen.getByRole("button", { name: "👍 2" }));
    expect(onToggle).toHaveBeenCalledWith("👍");
    await user.click(screen.getByRole("button", { name: "Add reaction" }));
    await user.click(screen.getByRole("button", { name: "React with 🎉" }));
    expect(onToggle).toHaveBeenLastCalledWith("🎉");
  });

  it("renders the roadmap with text equivalents and a today marker", () => {
    render(<RoadmapTimeline today="2026-02-10" items={[{ id: "a", title: "Ship beta", start: "2026-01-05", end: "2026-02-20", progress: 0.5 }]} />);
    expect(screen.getByText("Ship beta, Jan 5 to Feb 20, 50% complete")).toBeTruthy();
    expect(screen.getByTestId("today-marker")).toBeTruthy();
  });

  it("renders a board card", () => {
    render(<BoardCard title="Write docs" labels={[{ text: "Docs" }]} assignee="Ada Lane" due="Nov 24" overdue comments={3} />);
    expect(screen.getByText("Write docs")).toBeTruthy();
    expect(screen.getByText("Assigned to Ada Lane")).toBeTruthy();
    expect(screen.getByText("Overdue, due")).toBeTruthy();
  });

  it("renders a project card with progress", () => {
    render(<ProjectCard name="Atlas" tasksDone={6} tasksTotal={8} status="at-risk" members={["Ada Lane"]} />);
    expect(screen.getByRole("progressbar", { name: "Atlas progress" }).getAttribute("aria-valuenow")).toBe("75");
    expect(screen.getByText("At risk")).toBeTruthy();
  });

  it("announces who is present and draws cursors", () => {
    const { container } = render(<LiveCursors cursors={[{ id: "1", name: "Ada", x: 0.2, y: 0.4 }, { id: "2", name: "Bo", x: 0.8, y: 0.1 }]}><p>Canvas</p></LiveCursors>);
    expect(screen.getByRole("status").textContent).toContain("Ada, Bo are here");
    expect(container.querySelectorAll("[data-cursor]")).toHaveLength(2);
  });

  it("selects and restores versions", async () => {
    const onSelect = vi.fn();
    const onRestore = vi.fn();
    render(<VersionHistory now={NOW} onSelect={onSelect} onRestore={onRestore} versions={[{ id: "v2", label: "Version 2", author: "Ada", at: ago(600) }, { id: "v1", label: "Version 1", author: "Bo", at: ago(86_400 * 2) }]} />);
    const user = userEvent.setup();
    expect(screen.getByText("Current")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /^Version 1/ }));
    expect(onSelect).toHaveBeenCalledWith("v1");
    await user.click(screen.getByRole("button", { name: "Restore Version 1" }));
    expect(onRestore).toHaveBeenCalledWith("v1");
    expect(screen.queryByRole("button", { name: "Restore Version 2" })).toBeNull();
  });
});

describe("money math", () => {
  it("formats minor units in the currency's own precision", () => {
    expect(formatMoney(129_900)).toBe("$1,299.00");
    expect(formatMoney(5, "USD")).toBe("$0.05");
    expect(formatMoney(1500, "JPY", "en-US")).toBe("¥1,500");
  });

  it("computes totals with discount, tax and shipping in integers", () => {
    const lines = [{ unitPrice: 1999, quantity: 2 }, { unitPrice: 501, quantity: 1 }];
    expect(computeTotals({ lines })).toEqual({ subtotal: 4499, discount: 0, shipping: 0, tax: 0, total: 4499 });
    const t = computeTotals({ lines, discount: { type: "percent", value: 10 }, taxRate: 0.0825, shipping: 500 });
    expect(t.subtotal).toBe(4499);
    expect(t.discount).toBe(450);
    expect(t.tax).toBe(Math.round(4049 * 0.0825));
    expect(t.total).toBe(4499 - 450 + 334 + 500);
    expect(Number.isInteger(t.total)).toBe(true);
  });

  it("clamps discounts to the subtotal", () => {
    expect(discountAmount(1000, { type: "fixed", amount: 5000 })).toBe(1000);
    expect(discountAmount(1000, { type: "fixed", amount: -5 })).toBe(0);
    expect(discountAmount(1000)).toBe(0);
  });

  it("prices plans and savings", () => {
    expect(priceFor(PLANS[1], "monthly")).toBe(2000);
    expect(priceFor(PLANS[1], "yearly")).toBe(1600);
    expect(priceFor(PLANS[0], "yearly")).toBe(0);
    expect(yearlySavings(PLANS[1])).toBe(20);
    expect(yearlySavings(PLANS[0])).toBe(0);
  });

  const MODEL: PricingModel = { base: 2900, includedSeats: 3, seatPrice: 800, includedUnits: 10_000, overagePer1k: 150, yearlyDiscountPercent: 20 };
  it("estimates calculator prices", () => {
    expect(estimatePrice(MODEL, 3, 10_000, false).monthly).toBe(2900);
    const e = estimatePrice(MODEL, 5, 14_000, false);
    expect(e).toMatchObject({ seats: 1600, overage: 600, monthly: 5100 });
    const y = estimatePrice(MODEL, 5, 14_000, true);
    expect(y.effectiveMonthly).toBe(4080);
    expect(y.yearTotal).toBe(48_960);
  });

  it("clamps quantities", () => {
    expect(clampQuantity(0)).toBe(1);
    expect(clampQuantity(2.9)).toBe(2);
    expect(clampQuantity(500, 10)).toBe(10);
    expect(clampQuantity(Number.NaN)).toBe(1);
  });

  it("masks cards and detects expiry", () => {
    expect(maskCard("4242")).toBe("•••• 4242");
    expect(maskCard("1234424242")).toBe("•••• 4242");
    expect(isExpired("01/20", new Date(2026, 5, 1))).toBe(true);
    expect(isExpired("12/30", new Date(2026, 5, 1))).toBe(false);
    expect(isExpired("05/26", new Date(2026, 5, 1))).toBe(true);
  });

  it("finds and sorts best supplier values", () => {
    const s: Supplier[] = [{ id: "a", name: "A", unitPrice: 120, moq: 100, leadTimeDays: 14, rating: 4.1 }, { id: "b", name: "B", unitPrice: 100, moq: 500, leadTimeDays: 14, rating: 4.7 }];
    const best = bestValues(s);
    expect([...best.unitPrice]).toEqual(["b"]);
    expect([...best.moq]).toEqual(["a"]);
    expect([...best.leadTimeDays].sort()).toEqual(["a", "b"]);
    expect([...best.rating]).toEqual(["b"]);
    expect(sortSuppliers(s, "unitPrice", "asc").map((x) => x.id)).toEqual(["b", "a"]);
    expect(sortSuppliers(s, null, "asc")).toBe(s);
  });

  it("derives order tracker states", () => {
    expect(stepStatus(0, 1)).toBe("done");
    expect(stepStatus(1, 1)).toBe("current");
    expect(stepStatus(2, 1)).toBe("upcoming");
    expect(orderProgress(4, 1)).toBe(25);
    expect(orderProgress(0, 1)).toBe(0);
    expect(renewalLabel("canceling", "2026-12-01T12:00:00Z")).toMatch(/^Ends on/);
  });
});

describe("commerce components", () => {
  it("adds a product to the cart", async () => {
    const onAdd = vi.fn();
    render(<ProductCard name="Desk lamp" price={4500} compareAtPrice={6000} rating={4.6} reviewCount={120} onAddToCart={onAdd} />);
    expect(screen.getByRole("article", { name: "Desk lamp" }).textContent).toContain("$45.00");
    expect(screen.getByText("−25%")).toBeTruthy();
    expect(discountPercent(4500, 6000)).toBe(25);
    await userEvent.setup().click(screen.getByRole("button", { name: "Add Desk lamp to cart" }));
    expect(onAdd).toHaveBeenCalled();
    expect(screen.getByRole("status").textContent).toContain("Desk lamp added to cart");
  });

  it("shows totals and applies promo codes", async () => {
    const onApplyCode = vi.fn(() => "Code expired");
    const onCheckout = vi.fn();
    render(<CartSummary lines={[{ unitPrice: 2500, quantity: 2 }]} taxRate={0.1} shipping={0} onApplyCode={onApplyCode} onCheckout={onCheckout} />);
    expect(screen.getByText("Total").nextSibling?.textContent).toContain("$55.00");
    const user = userEvent.setup();
    await user.type(screen.getByRole("textbox", { name: "Promo code" }), "SAVE");
    await user.click(screen.getByRole("button", { name: "Apply" }));
    expect(onApplyCode).toHaveBeenCalledWith("SAVE");
    expect(screen.getByRole("alert").textContent).toContain("Code expired");
    await user.click(screen.getByRole("button", { name: "Checkout" }));
    expect(onCheckout).toHaveBeenCalled();
  });

  it("renders a receipt with masked payment", () => {
    render(<Receipt merchant="Demo Store" number="1042" paidAt="2026-11-01T10:00:00Z" lines={[{ id: "1", name: "Lamp", unitPrice: 4500, quantity: 2 }]} paymentMethod="Visa •••• 4242" onPrint={() => {}} />);
    expect(screen.getByRole("article", { name: "Receipt 1042" }).textContent).toContain("Paid with Visa •••• 4242");
    expect(screen.getByText("Payment of $90.00 received")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Print receipt" })).toBeTruthy();
  });

  it("selects among saved payment methods and never asks for a number", async () => {
    const onValueChange = vi.fn();
    render(<PaymentPicker onValueChange={onValueChange} methods={[{ id: "m1", brand: "Visa", last4: "4242", expiry: "12/30" }, { id: "m2", brand: "Mastercard", last4: "0000", expiry: "01/20" }]} />);
    expect(screen.getByRole("radiogroup", { name: "Payment method" })).toBeTruthy();
    expect((screen.getByRole("radio", { name: /Visa •••• 4242/ }) as HTMLInputElement).checked).toBe(true);
    expect(screen.getByRole("radio", { name: /Mastercard/ }).hasAttribute("disabled")).toBe(true);
    expect(screen.queryByRole("textbox")).toBeNull();
    await userEvent.setup().keyboard("{Tab}");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("switches pricing intervals and selects a plan", async () => {
    const onSelect = vi.fn();
    render(<PricingTable plans={PLANS} onSelect={onSelect} />);
    const user = userEvent.setup();
    expect(within(screen.getByRole("article", { name: "Pro plan" })).getByText("$20.00")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /yearly/i }));
    expect(within(screen.getByRole("article", { name: "Pro plan" })).getByText("$16.00")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Choose plan: Pro" }));
    expect(onSelect).toHaveBeenCalledWith("pro", "yearly");
  });

  it("sorts suppliers and picks one", async () => {
    const onSelect = vi.fn();
    render(<SupplierCompare onSelect={onSelect} suppliers={[{ id: "a", name: "Alpha", unitPrice: 120, moq: 100, leadTimeDays: 10, rating: 4 }, { id: "b", name: "Beta", unitPrice: 100, moq: 500, leadTimeDays: 20, rating: 4.5 }]} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /Unit price/ }));
    expect(screen.getByRole("columnheader", { name: /Unit price/ }).getAttribute("aria-sort")).toBe("ascending");
    expect(screen.getAllByRole("rowheader").map((r) => r.textContent)).toEqual(["Beta", "Alpha"]);
    await user.click(screen.getByRole("button", { name: "Select Alpha" }));
    expect(onSelect).toHaveBeenCalledWith("a");
  });

  it("marks the current order step", () => {
    render(<OrderTracker current={1} steps={[{ id: "1", label: "Placed" }, { id: "2", label: "Packed" }, { id: "3", label: "Shipped" }]} />);
    expect(screen.getByRole("status").textContent).toContain("Step 2 of 3: Packed");
    expect(screen.getByRole("listitem", { current: "step" }).textContent).toContain("Packed");
  });

  it("confirms cancellation before calling back", async () => {
    const onCancel = vi.fn();
    const onChangePlan = vi.fn();
    render(<SubscriptionManager planId="pro" status="active" renewsOn="2026-12-01T12:00:00Z" paymentMethod="Visa •••• 4242" plans={[{ id: "pro", name: "Pro", price: 2000 }, { id: "team", name: "Team", price: 5000 }]} onCancel={onCancel} onChangePlan={onChangePlan} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Cancel subscription" }));
    expect(onCancel).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Yes, cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    await user.selectOptions(screen.getByRole("combobox", { name: "Change plan" }), "team");
    expect(onChangePlan).toHaveBeenCalledWith("team");
  });

  it("offers resume while a subscription is canceling", async () => {
    const onResume = vi.fn();
    render(<SubscriptionManager planId="pro" status="canceling" renewsOn="2026-12-01T12:00:00Z" plans={[{ id: "pro", name: "Pro", price: 2000 }]} onResume={onResume} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Resume subscription" }));
    expect(onResume).toHaveBeenCalled();
  });

  it("recomputes the calculator estimate as sliders move", () => {
    render(<PricingCalculator model={{ base: 2900, includedSeats: 3, seatPrice: 800, includedUnits: 10_000, overagePer1k: 150 }} />);
    expect(screen.getByRole("status", { name: "Estimated price" }).textContent).toContain("$29.00");
    fireEvent.change(screen.getByRole("slider", { name: "Seats" }), { target: { value: "5" } });
    expect(screen.getByRole("status", { name: "Estimated price" }).textContent).toContain("$45.00");
  });

  it("lists order lines with totals", () => {
    render(<OrderSummary lines={[{ id: "1", name: "Lamp", unitPrice: 4500, quantity: 2 }]} taxRate={0.1} shipping={500} />);
    expect(screen.getByRole("region", { name: "Order summary" }).textContent).toContain("$104.00");
    expect(screen.getByText("Qty 2")).toBeTruthy();
  });

  it("steps and removes a cart item", async () => {
    const onQuantityChange = vi.fn();
    const onRemove = vi.fn();
    render(<CartItem name="Lamp" unitPrice={4500} quantity={2} onQuantityChange={onQuantityChange} onRemove={onRemove} />);
    const user = userEvent.setup();
    expect(screen.getByText("$90.00")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Increase quantity of Lamp" }));
    expect(onQuantityChange).toHaveBeenCalledWith(3);
    await user.click(screen.getByRole("button", { name: "Decrease quantity of Lamp" }));
    expect(onQuantityChange).toHaveBeenLastCalledWith(1);
    await user.click(screen.getByRole("button", { name: "Remove Lamp" }));
    expect(onRemove).toHaveBeenCalled();
  });

  it("marks the current billing plan and disables its button", () => {
    render(<BillingPlanCard name="Pro" price={2000} features={["Unlimited projects"]} current />);
    expect(screen.getByRole("article", { name: "Pro plan" }).textContent).toContain("Current plan");
    expect(screen.getByRole("button", { name: /Pro/ }).hasAttribute("disabled")).toBe(true);
  });
});
