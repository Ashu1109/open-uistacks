import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToolCall, formatMs, summarizeArgs } from "./ui/tool-call";
import { RunCard, formatCost, runProgress } from "./ui/run-card";
import { DiffBlock, diffLines, diffStats } from "./ui/diff-block";
import { PlanCard, planProgress } from "./ui/plan-card";
import { AgentControlFrame } from "./ui/agent-control-frame";
import { PreflightChecks, summarizeChecks } from "./ui/preflight-checks";
import { ExtractedFields, confidenceLevel } from "./ui/extracted-fields";
import { ModelCard, formatPrice } from "./ui/model-card";
import { EvalScorecard, overallScore, scoreDelta } from "./ui/eval-scorecard";
import { AutomationCard } from "./ui/automation-card";
import { TraceWaterfall, labelSide, layoutSpans } from "./ui/trace-waterfall";
import { BrowserFrame, displayUrl } from "./ui/browser-frame";
import { ChangePreview, acceptedIds } from "./ui/change-preview";
import { ChecksList, tallyChecks } from "./ui/checks-list";
import { AgentRoster, statusCounts } from "./ui/agent-roster";
import { RelayTimeline, participants } from "./ui/relay-timeline";
import { TrustLevel } from "./ui/trust-level";
import { RestorePoints } from "./ui/restore-points";
import { AttentionQueue, sortBySeverity } from "./ui/attention-queue";
import { MemoryList, filterMemories } from "./ui/memory-list";
import { SpendBreakdown, formatUsd, spendShares } from "./ui/spend-breakdown";
import { RunSchedule, describeCron, nextRuns, parseCron } from "./ui/run-schedule";

afterEach(cleanup);

interface DomMatchers {
  toBeInTheDocument(): void;
  toHaveAttribute(name: string, value?: string): void;
  toHaveTextContent(text: string): void;
  toBeDisabled(): void;
  toBeEnabled(): void;
  toBeChecked(): void;
  toHaveFocus(): void;
}
declare module "vitest" {
  interface Assertion<R extends void | Promise<void> = void, T = unknown> extends DomMatchers {
    readonly __r?: R;
    readonly __t?: T;
  }
  interface AsymmetricMatchersContaining extends DomMatchers {}
}
const asEl = (v: unknown) => v as HTMLElement;
expect.extend({
  toBeInTheDocument: (r) => ({ pass: Boolean(r) && document.body.contains(asEl(r)), message: () => "expected element in document" }),
  toHaveAttribute: (r, name: string, value?: string) => ({ pass: asEl(r).hasAttribute(name) && (value === undefined || asEl(r).getAttribute(name) === value), message: () => `expected attribute ${name}=${value} but got ${asEl(r).getAttribute(name)}` }),
  toHaveTextContent: (r, text: string) => ({ pass: (asEl(r).textContent ?? "").includes(text), message: () => `expected text "${text}" in "${asEl(r).textContent}"` }),
  toBeDisabled: (r) => ({ pass: (r as HTMLButtonElement).disabled, message: () => "expected disabled" }),
  toBeEnabled: (r) => ({ pass: !(r as HTMLButtonElement).disabled, message: () => "expected enabled" }),
  toBeChecked: (r) => ({ pass: asEl(r).getAttribute("aria-checked") === "true" || (r as HTMLInputElement).checked === true, message: () => "expected checked" }),
  toHaveFocus: (r) => ({ pass: document.activeElement === r, message: () => "expected focus" }),
});

describe("pure helpers", () => {
  it("formats durations and args", () => {
    expect(formatMs(420)).toBe("420 ms");
    expect(formatMs(3200)).toBe("3.2 s");
    expect(formatMs(65_000)).toBe("1m 05s");
    expect(summarizeArgs({ q: "cats", n: 5 })).toBe('q: "cats", n: 5');
    expect(summarizeArgs({ q: "x".repeat(100) }, 20)).toHaveLength(20);
  });

  it("computes progress and cost", () => {
    expect(runProgress(3, 4)).toBe(0.75);
    expect(runProgress(1, 0)).toBe(0);
    expect(formatCost(0.004)).toBe("<$0.01");
    expect(formatCost(1.5)).toBe("$1.50");
    expect(planProgress([{ id: "a", title: "", status: "done" }, { id: "b", title: "", status: "pending" }])).toEqual({ done: 1, total: 2 });
  });

  it("diffs lines with an LCS", () => {
    expect(diffLines("a\nb\nc", "a\nc\nd").map((l) => `${l.kind}:${l.text}`)).toEqual(["same:a", "del:b", "same:c", "add:d"]);
    expect(diffLines("", "x").map((l) => l.kind)).toEqual(["add"]);
    expect(diffLines("same", "same").every((l) => l.kind === "same")).toBe(true);
    const lines = diffLines("a\nb", "a\nc");
    expect(lines[1]).toMatchObject({ kind: "del", oldNo: 2 });
    expect(lines[2]).toMatchObject({ kind: "add", newNo: 2 });
    expect(diffStats(lines)).toEqual({ added: 1, removed: 1 });
  });

  it("summarizes checks, confidence, prices and scores", () => {
    expect(summarizeChecks([{ id: "a", label: "", status: "pass" }, { id: "b", label: "", status: "fail" }])).toEqual({ passed: 1, total: 2, canStart: false });
    expect(confidenceLevel(0.95)).toBe("high");
    expect(confidenceLevel(0.75)).toBe("medium");
    expect(confidenceLevel(0.4)).toBe("low");
    expect(formatPrice(3)).toBe("$3");
    expect(formatPrice(0.25)).toBe("$0.25");
    expect(formatPrice(0)).toBe("Free");
    expect(overallScore([{ label: "a", score: 0.8 }, { label: "b", score: 0.6 }])).toBeCloseTo(0.7);
    expect(scoreDelta(0.82, 0.75)).toBe(7);
  });

  it("lays out spans on a shared axis", () => {
    const { total, layouts } = layoutSpans([{ id: "a", name: "a", start: 0, duration: 500 }, { id: "b", name: "b", start: 500, duration: 500 }]);
    expect(total).toBe(1000);
    expect(layouts[1]).toEqual({ left: 50, width: 50 });
  });

  it("places duration labels away from the right edge", () => {
    expect(labelSide(10, 40)).toBe("right");
    expect(labelSide(60, 75)).toBe("right");
    expect(labelSide(40, 100)).toBe("inside");
    expect(labelSide(87, 100)).toBe("left");
    expect(labelSide(99, 99.6)).toBe("left");
  });

  it("covers the remaining helpers", () => {
    expect(displayUrl("https://example.com/")).toEqual({ secure: true, text: "example.com" });
    const changes = [{ id: "a", label: "", before: "", after: "" }, { id: "b", label: "", before: "", after: "" }];
    expect(acceptedIds({ b: "rejected" }, changes)).toEqual(["a"]);
    expect(tallyChecks([{ id: "a", name: "", state: "pass" }, { id: "b", name: "", state: "skipped" }])).toMatchObject({ pass: 1, skipped: 1 });
    expect(statusCounts([{ id: "a", name: "", role: "", status: "idle" }]).idle).toBe(1);
    expect(participants([{ id: "1", from: "A", to: "B", message: "", at: "" }, { id: "2", from: "B", to: "C", message: "", at: "" }])).toEqual(["A", "B", "C"]);
    const sorted = sortBySeverity([{ id: "l", title: "", reason: "", agent: "", severity: "low" }, { id: "h", title: "", reason: "", agent: "", severity: "high" }]);
    expect(sorted[0].id).toBe("h");
    const mem = [{ id: "a", text: "Likes tea", source: "chat", at: "" }, { id: "b", text: "Lives in Oslo", source: "chat", at: "", pinned: true }];
    expect(filterMemories(mem, "").map((m) => m.id)).toEqual(["b", "a"]);
    expect(filterMemories(mem, "TEA").map((m) => m.id)).toEqual(["a"]);
    expect(formatUsd(1.234)).toBe("$1.23");
    expect(spendShares([{ label: "a", usd: 1 }, { label: "b", usd: 1 }], 4)).toEqual([25, 25]);
  });

  it("parses and describes cron", () => {
    expect(parseCron("0 9 * * 1-5")).not.toBeNull();
    expect(parseCron("61 * * * *")).toBeNull();
    expect(parseCron("nope")).toBeNull();
    expect(describeCron("*/15 * * * *")).toBe("Every 15 minutes");
    expect(describeCron("5 * * * *")).toBe("Every hour at :05");
    expect(describeCron("30 9 * * *")).toBe("Every day at 09:30");
    expect(describeCron("0 9 * * 1-5")).toBe("Weekdays at 09:00");
    expect(describeCron("0 8 * * 1")).toBe("Every Monday at 08:00");
    expect(describeCron("0 8 1 * *")).toBe("Custom schedule");
  });

  it("computes next runs", () => {
    const from = new Date(2026, 0, 5, 10, 0); // Monday
    const runs = nextRuns("0 9 * * 1-5", from, 2);
    expect(runs.map((r) => [r.getDate(), r.getHours()])).toEqual([[6, 9], [7, 9]]);
    expect(nextRuns("*/30 * * * *", from, 2).map((r) => r.getMinutes())).toEqual([30, 0]);
    expect(nextRuns("bad", from)).toEqual([]);
  });
});

describe("components", () => {
  it("expands a tool call", async () => {
    render(<ToolCall name="search_web" args={{ query: "cats" }} result={{ hits: 3 }} status="success" durationMs={1200} />);
    const toggle = screen.getByRole("button", { name: /search_web/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("status")).toHaveTextContent("Done");
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/"hits": 3/)).toBeInTheDocument();
  });

  it("renders a run card and stops it", async () => {
    const onStop = vi.fn();
    render(<RunCard title="Triage inbox" agent="Mailer" status="running" stepsDone={2} stepsTotal={4} elapsedMs={12_000} costUsd={0.12} onStop={onStop} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "50");
    await userEvent.click(screen.getByRole("button", { name: "Stop" }));
    expect(onStop).toHaveBeenCalled();
  });

  it("renders diff lines with markers", () => {
    render(<DiffBlock before={"a\nb"} after={"a\nc"} filename="x.ts" />);
    expect(screen.getByRole("figure", { name: "Diff of x.ts" })).toBeInTheDocument();
    expect(screen.getByText("+1")).toBeInTheDocument();
    expect(screen.getByText("removed")).toBeInTheDocument();
  });

  it("approves a plan", async () => {
    const onApprove = vi.fn();
    render(<PlanCard title="Plan" steps={[{ id: "1", title: "Read file", status: "done" }, { id: "2", title: "Write patch", status: "active" }]} onApprove={onApprove} />);
    expect(screen.getByText("1/2")).toBeInTheDocument();
    expect(screen.getByText("Write patch").closest("li")).toHaveAttribute("aria-current", "step");
    await userEvent.click(screen.getByRole("button", { name: "Approve plan" }));
    expect(onApprove).toHaveBeenCalled();
  });

  it("switches control frame buttons by state", async () => {
    const onPause = vi.fn();
    const { rerender } = render(<AgentControlFrame state="running" onPause={onPause}>body</AgentControlFrame>);
    await userEvent.click(screen.getByRole("button", { name: /Pause/ }));
    expect(onPause).toHaveBeenCalled();
    rerender(<AgentControlFrame state="paused">body</AgentControlFrame>);
    expect(screen.getByRole("button", { name: /Resume/ })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Paused");
  });

  it("disables Start until checks pass", () => {
    const { rerender } = render(<PreflightChecks onStart={() => {}} checks={[{ id: "a", label: "Auth", status: "pass" }, { id: "b", label: "Quota", status: "fail" }]} />);
    expect(screen.getByRole("button", { name: "Start run" })).toBeDisabled();
    rerender(<PreflightChecks onStart={() => {}} checks={[{ id: "a", label: "Auth", status: "pass" }]} />);
    expect(screen.getByRole("button", { name: "Start run" })).toBeEnabled();
  });

  it("edits an extracted field", async () => {
    const onEdit = vi.fn();
    render(<ExtractedFields onEdit={onEdit} fields={[{ key: "total", label: "Total", value: "$10", confidence: 0.5 }]} />);
    expect(screen.getByRole("meter", { name: "Total confidence" })).toHaveAttribute("aria-valuenow", "50");
    await userEvent.click(screen.getByRole("button", { name: "Edit Total" }));
    const input = screen.getByRole("textbox", { name: "Edit Total" });
    await userEvent.clear(input);
    await userEvent.type(input, "$12{Enter}");
    expect(onEdit).toHaveBeenCalledWith("total", "$12");
  });

  it("selects a model card", async () => {
    const onSelect = vi.fn();
    render(<ModelCard name="Swift" provider="Acme" contextWindow={128_000} inputPrice={3} outputPrice={15} capabilities={["Vision"]} onSelect={onSelect} />);
    expect(screen.getByText("128k")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Swift/ }));
    expect(onSelect).toHaveBeenCalled();
  });

  it("renders eval scorecard", () => {
    render(<EvalScorecard metrics={[{ label: "Accuracy", score: 0.9, baseline: 0.8 }, { label: "Safety", score: 0.5 }]} />);
    expect(screen.getByText("Below threshold")).toBeInTheDocument();
    expect(screen.getByRole("meter", { name: "Accuracy" })).toHaveAttribute("aria-valuenow", "90");
    expect(screen.getByText(/points up from baseline/)).toBeInTheDocument();
  });

  it("toggles an automation", async () => {
    const onChange = vi.fn();
    render(<AutomationCard name="Digest" trigger="Every morning" action="Send summary" onEnabledChange={onChange} />);
    const sw = screen.getByRole("switch", { name: "Digest enabled" });
    expect(sw).toBeChecked();
    await userEvent.click(sw);
    expect(sw).not.toBeChecked();
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("renders trace spans", () => {
    render(<TraceWaterfall spans={[{ id: "a", name: "plan", start: 0, duration: 400 }, { id: "b", name: "tool", start: 400, duration: 600, depth: 1, status: "error" }]} />);
    expect(screen.getByRole("table", { name: "Trace waterfall" })).toBeInTheDocument();
    expect(document.querySelector('[data-side="right"]')).toBeTruthy();
    expect(screen.getByRole("img", { name: /tool starts at 400 ms.*failed/ })).toBeInTheDocument();
  });

  it("renders browser frame with agent action", () => {
    render(<BrowserFrame url="https://example.com/pricing" agentAction="Clicking Buy" loading><p>page</p></BrowserFrame>);
    expect(screen.getByText("example.com/pricing")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Clicking Buy");
    expect(screen.getByRole("progressbar", { name: "Loading page" })).toBeInTheDocument();
  });

  it("applies only accepted changes", async () => {
    const onApply = vi.fn();
    render(<ChangePreview onApply={onApply} changes={[{ id: "a", label: "Title", before: "Old", after: "New" }, { id: "b", label: "Footer", before: "x", after: "y" }]} />);
    await userEvent.click(screen.getByRole("button", { name: "Reject Footer" }));
    expect(screen.getByRole("button", { name: "Apply 1 change" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Apply 1 change" }));
    expect(onApply).toHaveBeenCalledWith(["a"]);
  });

  it("shows failing check detail", () => {
    render(<ChecksList items={[{ id: "a", name: "Lint", state: "pass", durationMs: 800 }, { id: "b", name: "Tests", state: "fail", detail: "2 failed" }]} />);
    expect(screen.getByText("1 failing")).toBeInTheDocument();
    expect(screen.getByText("2 failed")).toBeInTheDocument();
  });

  it("navigates the roster by keyboard", async () => {
    const onValueChange = vi.fn();
    render(<AgentRoster defaultValue="a" onValueChange={onValueChange} agents={[{ id: "a", name: "Ada", role: "Planner", status: "working", task: "Drafting" }, { id: "b", name: "Bo", role: "Coder", status: "idle" }]} />);
    const options = screen.getAllByRole("option");
    expect(options[0]).toHaveAttribute("aria-selected", "true");
    options[0].focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(options[1]).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(onValueChange).toHaveBeenCalledWith("b");
    expect(options[1]).toHaveAttribute("aria-selected", "true");
  });

  it("renders relay events", () => {
    render(<RelayTimeline events={[{ id: "1", from: "Planner", to: "Coder", message: "Spec ready", at: "10:02" }]} />);
    expect(screen.getByText("1 handoffs across 2 agents")).toBeInTheDocument();
    expect(screen.getByText("Spec ready")).toBeInTheDocument();
  });

  it("changes trust level with arrow keys", async () => {
    const onValueChange = vi.fn();
    render(<TrustLevel defaultValue="ask" onValueChange={onValueChange} />);
    const first = screen.getByRole("radio", { name: "Ask" });
    first.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onValueChange).toHaveBeenCalledWith("risky");
    expect(screen.getByRole("radio", { name: "Ask when risky" })).toBeChecked();
    await userEvent.keyboard("{End}");
    expect(onValueChange).toHaveBeenLastCalledWith("auto");
  });

  it("confirms before restoring", async () => {
    const onRestore = vi.fn();
    render(<RestorePoints onRestore={onRestore} points={[{ id: "2", label: "After edit", at: "now" }, { id: "1", label: "Start", at: "1h ago" }]} />);
    await userEvent.click(screen.getByRole("button", { name: "Restore Start" }));
    expect(onRestore).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Confirm restore to Start" }));
    expect(onRestore).toHaveBeenCalledWith("1");
  });

  it("resolves attention items", async () => {
    const onResolve = vi.fn();
    render(<AttentionQueue onResolve={onResolve} items={[{ id: "a", title: "Send refund", reason: "needs sign-off", agent: "Billing", severity: "high" }]} />);
    await userEvent.click(screen.getByRole("button", { name: "Approve Send refund" }));
    expect(onResolve).toHaveBeenCalledWith("a", "approved");
    expect(await screen.findByText("Nothing is waiting on you.")).toBeInTheDocument();
  });

  it("searches and forgets memories", async () => {
    const onForget = vi.fn();
    render(<MemoryList onForget={onForget} memories={[{ id: "a", text: "Likes tea", source: "chat", at: "Mon" }, { id: "b", text: "Lives in Oslo", source: "chat", at: "Tue" }]} />);
    await userEvent.type(screen.getByRole("searchbox", { name: "Search memories" }), "oslo");
    const list = screen.getByRole("list");
    expect(within(list).getAllByRole("listitem")).toHaveLength(1);
    await userEvent.click(screen.getByRole("button", { name: /Forget memory: Lives in Oslo/ }));
    expect(onForget).toHaveBeenCalledWith("b");
  });

  it("renders spend over budget", () => {
    render(<SpendBreakdown budget={5} items={[{ label: "Tokens", usd: 4 }, { label: "Tools", usd: 2 }]} />);
    expect(screen.getByText("$6.00")).toBeInTheDocument();
    expect(screen.getByText(/\$1\.00 over of \$5\.00/)).toBeInTheDocument();
  });

  it("renders a schedule summary", () => {
    render(<RunSchedule cron="0 9 * * 1-5" from={new Date(2026, 0, 5, 10, 0)} />);
    expect(screen.getByText("Weekdays at 09:00")).toBeInTheDocument();
    expect(screen.getByText("Next runs")).toBeInTheDocument();
  });
});
