import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AgentsOverview, DEMO_AGENTS, filterAgents, summarizeFleet } from "./agents-overview";
import { DEMO_SPANS, DEMO_STEPS, RunTrace, filterSteps, traceDuration } from "./run-trace";
import { ApprovalWithHistory, DEMO_HISTORY, approvalRate, decisionLabel } from "./approval-with-history";
import { ApprovalsInbox, DEMO_APPROVALS, approveLowRisk, pendingItems } from "./approvals-inbox";
import { StacksAgents } from "../templates/stacks-agents";

class StubResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
beforeAll(() => {
  vi.stubGlobal("ResizeObserver", StubResizeObserver);
});

afterEach(cleanup);

describe("helpers", () => {
  it("summarizes the fleet", () => {
    expect(summarizeFleet(DEMO_AGENTS)).toMatchObject({ total: 5, active: 4, runsToday: 265 });
    expect(summarizeFleet([]).avgSuccess).toBe(0);
  });
  it("filters agents and steps", () => {
    expect(filterAgents(DEMO_AGENTS, "offline")).toHaveLength(1);
    expect(filterAgents(DEMO_AGENTS, "all")).toHaveLength(5);
    expect(filterSteps(DEMO_STEPS, "tool")).toHaveLength(4);
    expect(filterSteps(DEMO_STEPS, "errors")).toHaveLength(1);
    expect(traceDuration(DEMO_SPANS)).toBe(5200);
  });
  it("labels and rates decisions", () => {
    expect(decisionLabel("always")).toBe("Always allowed");
    expect(approvalRate(DEMO_HISTORY)).toBe(67);
    expect(approvalRate([])).toBe(0);
  });
  it("approves only pending low-risk items", () => {
    const next = approveLowRisk(DEMO_APPROVALS, { p2: "denied" });
    expect(next).toEqual({ p2: "denied", p4: "approved" });
    expect(pendingItems(DEMO_APPROVALS, next)).toHaveLength(2);
  });
});

describe("AgentsOverview", () => {
  it("renders agents and runs, and filters by status", async () => {
    const user = userEvent.setup();
    render(<AgentsOverview />);
    expect(screen.getByRole("region", { name: "Agents overview" })).toBeTruthy();
    expect(screen.getByText(/Compiles account briefs/)).toBeTruthy();
    expect(screen.getByRole("article", { name: "Run: Sort 40 new tickets" })).toBeTruthy();
    await user.click(screen.getByRole("tab", { name: /Offline/ }));
    expect(screen.queryByText(/Compiles account briefs/)).toBeNull();
    expect(screen.getByText(/Books customer calls/)).toBeTruthy();
  });
  it("calls onOpenRun", async () => {
    const user = userEvent.setup();
    const onOpenRun = vi.fn();
    render(<AgentsOverview onOpenRun={onOpenRun} />);
    await user.click(screen.getAllByRole("button", { name: "Open details" })[0]);
    expect(onOpenRun).toHaveBeenCalledWith("r1");
  });
});

describe("RunTrace", () => {
  it("renders the steps and filters to errors", async () => {
    const user = userEvent.setup();
    render(<RunTrace />);
    expect(screen.getByRole("region", { name: /Run trace/ })).toBeTruthy();
    expect(screen.getByText("Plan")).toBeTruthy();
    expect(screen.getByText(/1 error recovered/)).toBeTruthy();
    await user.click(screen.getByRole("tab", { name: "Errors" }));
    expect(screen.queryByText("Plan")).toBeNull();
    expect(screen.getAllByText("payments.refund").length).toBeGreaterThan(0);
  });
  it("shows an empty state when nothing matches", async () => {
    const user = userEvent.setup();
    render(<RunTrace steps={DEMO_STEPS.slice(0, 1)} />);
    await user.click(screen.getByRole("tab", { name: "Errors" }));
    expect(screen.getByText("No steps match this filter.")).toBeTruthy();
  });
});

describe("ApprovalWithHistory", () => {
  it("lists earlier decisions and prepends a new one", async () => {
    const user = userEvent.setup();
    const onDecide = vi.fn();
    render(<ApprovalWithHistory onDecide={onDecide} />);
    expect(screen.getByText("Earlier decisions")).toBeTruthy();
    expect(screen.getAllByText(/by Mara Quinn/)).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: /Deny/ }));
    expect(onDecide).toHaveBeenCalledWith("denied");
    expect(screen.getByText("Just now")).toBeTruthy();
  });
});

describe("ApprovalsInbox", () => {
  it("shows pending requests and resolves one", async () => {
    const user = userEvent.setup();
    const onDecide = vi.fn();
    render(<ApprovalsInbox onDecide={onDecide} />);
    const list = screen.getByRole("list", { name: "Pending approvals" });
    expect(within(list).getAllByRole("button")).toHaveLength(4);
    await user.click(within(list).getByRole("button", { name: /Close 12 duplicate/ }));
    await user.click(screen.getByRole("button", { name: /Deny/ }));
    expect(onDecide).toHaveBeenCalledWith("p2", "denied");
    expect(within(screen.getByRole("list", { name: "Pending approvals" })).getAllByRole("button")).toHaveLength(3);
  });
  it("approves all low risk in bulk and shows them under Resolved", async () => {
    const user = userEvent.setup();
    render(<ApprovalsInbox />);
    await user.click(screen.getByRole("button", { name: "Approve 2 low risk" }));
    expect(screen.queryByRole("button", { name: /low risk/ })).toBeNull();
    await user.click(screen.getByRole("tab", { name: /Resolved/ }));
    expect(within(screen.getByRole("list", { name: "Resolved approvals" })).getAllByRole("button")).toHaveLength(2);
  });
});

describe("StacksAgents", () => {
  it("renders the overview and switches views", async () => {
    const user = userEvent.setup();
    render(<StacksAgents />);
    expect(screen.getByRole("heading", { name: "Fleet overview" })).toBeTruthy();
    await user.click(screen.getAllByText("Run trace")[0]);
    expect(screen.getByRole("heading", { name: "Run trace" })).toBeTruthy();
    await user.click(screen.getAllByText("Approvals")[0]);
    expect(screen.getByRole("region", { name: "Approvals inbox" })).toBeTruthy();
  });
});
