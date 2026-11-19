import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AttemptCompare, stepAttempt } from "./ui/attempt-compare";
import { ModelFallback, moveItem, type FallbackModel } from "./ui/model-fallback";
import { LiveRuns, formatElapsed } from "./ui/live-runs";
import { AgentMap, edgePath } from "./ui/agent-map";
import { CostEstimate, estimateCost, formatUsd } from "./ui/cost-estimate";
import { AgentPermissions, summarize } from "./ui/agent-permissions";
import { McpServers, shortUrl } from "./ui/mcp-servers";
import { PromptVersions, diffWords } from "./ui/prompt-versions";
import { AiFormFill, emptyFieldIds } from "./ui/ai-form-fill";
import { SessionReplay, formatClock, visibleEvents } from "./ui/session-replay";
import { ActionItems, formatDue, isOverdue } from "./ui/action-items";
import { InterviewCard, averageScore, suggestedDecision } from "./ui/interview-card";
import { NlFilter, parseFilters, type FilterField } from "./ui/nl-filter";
import { AiColumn, type AiColumnRow } from "./ui/ai-column";
import { AgentHandoff, initials } from "./ui/agent-handoff";
import { VoiceCall, barLevel } from "./ui/voice-call";
import { EmailDraft, popHistory } from "./ui/email-draft";
import { PolicyBlock, splitMatch } from "./ui/policy-block";
import { AgentCard, agentInitials } from "./ui/agent-card";
import { DEFAULT_LABEL, LivePill } from "./ui/live-pill";
import { ConnectApps, toggleId } from "./ui/connect-apps";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const FIELDS: FilterField[] = [
  { key: "status", label: "Status", type: "enum", options: ["open", "closed"] },
  { key: "priority", label: "Priority", type: "enum", options: ["high", "low"] },
  { key: "comments", label: "Comments", type: "number", units: ["comments"] },
  { key: "created", label: "Created", type: "date" },
];

describe("pure helpers", () => {
  it("moves items immutably", () => {
    const src = ["a", "b", "c"];
    expect(moveItem(src, 0, 2)).toEqual(["b", "c", "a"]);
    expect(src).toEqual(["a", "b", "c"]);
    expect(moveItem(src, 0, 9)).toEqual(src);
    expect(stepAttempt(3, 2, 1)).toBe(0);
  });

  it("formats elapsed time, clocks and money", () => {
    expect(formatElapsed(4000)).toBe("4s");
    expect(formatElapsed(65_000)).toBe("1m 05s");
    expect(formatElapsed(3_720_000)).toBe("1h 02m");
    expect(formatClock(7)).toBe("0:07");
    expect(formatClock(3729)).toBe("1:02:09");
    expect(formatUsd(0.0042)).toBe("$0.0042");
    expect(formatUsd(12.4)).toBe("$12.40");
    expect(estimateCost(1_000_000, 500_000, { input: 2, output: 10 }, 2).total).toBe(14);
  });

  it("builds edge paths facing the right way", () => {
    const a = { id: "a", label: "A", x: 100, y: 50 };
    const b = { id: "b", label: "B", x: 300, y: 150 };
    expect(edgePath(a, b).d.startsWith("M166 50")).toBe(true);
    expect(edgePath(b, a).d.startsWith("M234 150")).toBe(true);
  });

  it("summarises permissions with Ask as the default", () => {
    const tools = [{ id: "a", name: "A" }, { id: "b", name: "B" }, { id: "c", name: "C" }];
    expect(summarize(tools, { a: "allow", b: "deny" })).toBe("1 allowed · 1 ask · 1 denied");
  });

  it("diffs words and keeps the text round-trippable", () => {
    const parts = diffWords("be brief and kind", "be very brief");
    expect(parts.filter((p) => p.type !== "del").map((p) => p.text).join("")).toBe("be very brief");
    expect(parts.filter((p) => p.type !== "add").map((p) => p.text).join("")).toBe("be brief and kind");
    expect(parts.some((p) => p.type === "add" && p.text.includes("very"))).toBe(true);
  });

  it("filters replay events and finds empty fields", () => {
    const events = [{ at: 5, kind: "agent" as const, text: "b" }, { at: 1, kind: "user" as const, text: "a" }];
    expect(visibleEvents(events, 3).map((e) => e.text)).toEqual(["a"]);
    expect(emptyFieldIds([{ id: "x", label: "X", suggestion: "s" }, { id: "y", label: "Y", suggestion: "s" }], { x: "hi" })).toEqual(["y"]);
  });

  it("handles dates, scores, initials and match splitting", () => {
    expect(isOverdue({ id: "1", text: "t", due: "2026-01-01" }, "2026-02-01")).toBe(true);
    expect(isOverdue({ id: "1", text: "t", due: "2026-01-01", done: true }, "2026-02-01")).toBe(false);
    expect(formatDue("2026-03-04")).toBe("Mar 4");
    expect(averageScore([{ label: "a", score: 4 }, { label: "b", score: 3 }])).toBe(3.5);
    expect(suggestedDecision(4.2)).toBe("advance");
    expect(suggestedDecision(2)).toBe("pass");
    expect(initials("Mira Okoye Jr")).toBe("MO");
    expect(agentInitials("scout")).toBe("S");
    expect(splitMatch("Send card 4111 now", "4111")).toEqual([{ text: "Send card ", hit: false }, { text: "4111", hit: true }, { text: " now", hit: false }]);
    expect(splitMatch("plain")).toEqual([{ text: "plain", hit: false }]);
    expect(shortUrl("https://tools.example.com/mcp")).toBe("tools.example.com");
    expect(shortUrl("stdio:local")).toBe("stdio:local");
    expect(toggleId(["a"], "b", true)).toEqual(["a", "b"]);
    expect(toggleId(["a", "b"], "a", false)).toEqual(["b"]);
    expect(popHistory(["x", "y"])).toEqual({ rest: ["x"], last: "y" });
    expect(barLevel(3, 5)).toBeGreaterThanOrEqual(0.15);
    expect(barLevel(3, 5)).toBeLessThanOrEqual(1);
    expect(DEFAULT_LABEL.live).toBe("Live");
  });
});

describe("parseFilters", () => {
  it("extracts enum, number and date filters", () => {
    const { filters } = parseFilters("open tickets with high priority over 5 comments from last week", FIELDS);
    expect(filters.map((f) => f.label)).toEqual(["Status: open", "Priority: high", "Comments more than 5", "Created: last 7 days"]);
  });

  it("reads comparison words and leaves unmatched text in rest", () => {
    const r = parseFilters("fewer than 3 comments about billing", FIELDS);
    expect(r.filters).toEqual([{ field: "comments", op: "<", value: "3", label: "Comments fewer than 3" }]);
    expect(r.rest).toBe("about billing");
    expect(parseFilters("hello", FIELDS).filters).toEqual([]);
  });
});

describe("AttemptCompare", () => {
  it("selects an attempt and calls back", async () => {
    const onValueChange = vi.fn();
    render(<AttemptCompare attempts={[{ id: "a", label: "Attempt 1", output: "x" }, { id: "b", label: "Attempt 2", output: "y", metrics: [{ label: "Tokens", value: "1k" }] }]} onValueChange={onValueChange} />);
    expect(screen.getByRole("radiogroup", { name: "Attempts" })).toBeTruthy();
    await userEvent.click(screen.getByRole("radio", { name: "Keep Attempt 2" }));
    expect(onValueChange).toHaveBeenCalledWith("b");
    expect(screen.getByRole("radio", { name: "Keep Attempt 2" }).getAttribute("aria-checked")).toBe("true");
  });
});

describe("ModelFallback", () => {
  const models: FallbackModel[] = [{ id: "a", name: "Alpha", enabled: true }, { id: "b", name: "Beta", enabled: true }];
  it("reorders and toggles", async () => {
    const onValueChange = vi.fn();
    render(<ModelFallback defaultValue={models} onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Move Beta up" }));
    expect(onValueChange).toHaveBeenLastCalledWith([models[1], models[0]]);
    expect(screen.getAllByRole("listitem")[0].textContent).toContain("Beta");
    await userEvent.click(screen.getByRole("switch", { name: "Use Alpha" }));
    expect(screen.getByText(/Skipped/)).toBeTruthy();
  });
});

describe("LiveRuns", () => {
  it("shows statuses and cancels", async () => {
    const onCancel = vi.fn();
    render(<LiveRuns now={() => 10_000} onCancel={onCancel} runs={[{ id: "1", name: "Index docs", status: "running", startedAt: 4_000, progress: 0.4 }, { id: "2", name: "Send digest", status: "done", startedAt: 0, durationMs: 65_000 }]} />);
    expect(screen.getByText(/6s/)).toBeTruthy();
    expect(screen.getByText(/1m 05s/)).toBeTruthy();
    expect(screen.getByRole("progressbar", { name: "Index docs progress" }).getAttribute("aria-valuenow")).toBe("40");
    await userEvent.click(screen.getByRole("button", { name: "Cancel Index docs" }));
    expect(onCancel).toHaveBeenCalledWith("1");
    expect(screen.queryByRole("button", { name: "Cancel Send digest" })).toBeNull();
  });

  it("ticks the elapsed time while running", () => {
    vi.useFakeTimers();
    let t = 1000;
    render(<LiveRuns now={() => t} runs={[{ id: "1", name: "Job", status: "running", startedAt: 0 }]} />);
    t = 3000;
    act(() => void vi.advanceTimersByTime(1000));
    expect(screen.getByText(/3s/)).toBeTruthy();
  });
});

describe("AgentMap", () => {
  it("renders nodes and selects with the keyboard", async () => {
    const onSelect = vi.fn();
    render(<AgentMap nodes={[{ id: "a", label: "Planner", caption: "plans", x: 100, y: 80 }, { id: "b", label: "Coder", x: 300, y: 80 }]} edges={[{ from: "a", to: "b", label: "tasks", active: true }]} onSelect={onSelect} />);
    const node = screen.getByRole("button", { name: "Planner, plans" });
    node.focus();
    await userEvent.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith("a");
    expect(node.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText("tasks")).toBeTruthy();
  });
});

describe("CostEstimate", () => {
  it("shows the total and budget state", () => {
    render(<CostEstimate model="Deep" inputTokens={500_000} outputTokens={100_000} prices={{ input: 3, output: 15 }} runs={2} budget={5} />);
    expect(screen.getByText("$6.00")).toBeTruthy();
    expect(screen.getByText(/Over the \$5.00 budget/)).toBeTruthy();
    expect(screen.getByRole("meter", { name: "Budget used" })).toBeTruthy();
  });
});

describe("AgentPermissions", () => {
  it("changes a level and updates the summary", async () => {
    const onValueChange = vi.fn();
    render(<AgentPermissions tools={[{ id: "web", name: "Web search", description: "Browse" }, { id: "fs", name: "Files" }]} onValueChange={onValueChange} />);
    expect(screen.getByText("0 allowed · 2 ask · 0 denied")).toBeTruthy();
    await userEvent.click(screen.getByRole("radio", { name: "Allow Web search" }));
    expect(onValueChange).toHaveBeenCalledWith({ web: "allow" });
    expect(screen.getByText("1 allowed · 1 ask · 0 denied")).toBeTruthy();
  });
});

describe("McpServers", () => {
  it("lists status, retries errors and toggles", async () => {
    const onToggle = vi.fn();
    const onRetry = vi.fn();
    render(<McpServers onToggle={onToggle} onRetry={onRetry} servers={[{ id: "1", name: "Docs", url: "https://docs.example.com/mcp", status: "connected", tools: 6 }, { id: "2", name: "Maps", url: "https://maps.example.com", status: "error", error: "Timed out" }]} />);
    expect(screen.getByText(/6 tools/)).toBeTruthy();
    expect(screen.getByText("Timed out")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Retry Maps" }));
    expect(onRetry).toHaveBeenCalledWith("2");
    await userEvent.click(screen.getByRole("switch", { name: "Enable Docs" }));
    expect(onToggle).toHaveBeenCalledWith("1", false);
  });
});

describe("PromptVersions", () => {
  const versions = [{ id: "1", label: "v1", date: "Mar 1", text: "Be brief." }, { id: "2", label: "v2", date: "Mar 2", text: "Be brief and kind." }];
  it("shows the diff for the newest version and switches", async () => {
    const onRestore = vi.fn();
    render(<PromptVersions versions={versions} onRestore={onRestore} />);
    expect(screen.getByText("Changes from v1")).toBeTruthy();
    expect(screen.getByLabelText("Diff").querySelector("ins")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: /v1/ }));
    expect(screen.getByText("First version")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Restore v1" }));
    expect(onRestore).toHaveBeenCalledWith("1");
  });
});

describe("AiFormFill", () => {
  it("types suggestions into empty fields", async () => {
    const onChange = vi.fn();
    render(<AiFormFill charsPerTick={100} onChange={onChange} fields={[{ id: "name", label: "Name", suggestion: "Ada" }, { id: "bio", label: "Bio", suggestion: "Builds engines.", multiline: true }]} />);
    await userEvent.type(screen.getByLabelText("Name"), "Z");
    await userEvent.click(screen.getByRole("button", { name: /Fill with AI/ }));
    await waitFor(() => expect((screen.getByLabelText("Bio") as HTMLTextAreaElement).value).toBe("Builds engines."));
    expect((screen.getByLabelText("Name") as HTMLInputElement).value).toBe("Z");
    expect(onChange).toHaveBeenLastCalledWith({ name: "Z", bio: "Builds engines." });
  });
});

describe("SessionReplay", () => {
  const events = [{ at: 1, kind: "user" as const, text: "Hello" }, { at: 6, kind: "agent" as const, text: "Working on it" }];
  it("reveals events as the playhead moves", () => {
    render(<SessionReplay events={events} />);
    expect(screen.getByText(/Nothing yet/)).toBeTruthy();
    fireEvent.change(screen.getByRole("slider", { name: "Playhead" }), { target: { value: "2" } });
    expect(screen.getByText("Hello")).toBeTruthy();
    expect(screen.queryByText("Working on it")).toBeNull();
    expect(screen.getByRole("slider", { name: "Playhead" }).getAttribute("aria-valuetext")).toBe("0:02 of 0:06");
  });

  it("plays forward with timers", () => {
    vi.useFakeTimers();
    render(<SessionReplay events={events} />);
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    for (let i = 0; i < 28; i++) act(() => void vi.advanceTimersByTime(250));
    expect(screen.getByText("Working on it")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Replay" })).toBeTruthy();
  });
});

describe("ActionItems", () => {
  it("toggles items and counts done", async () => {
    render(<ActionItems today="2026-02-01" defaultItems={[{ id: "1", text: "Send recap", owner: "Sam", due: "2026-01-15", quote: "I'll send it" }, { id: "2", text: "Book room" }]} />);
    expect(screen.getByText("0 of 2 done")).toBeTruthy();
    expect(screen.getByText(/Overdue/)).toBeTruthy();
    await userEvent.click(screen.getByRole("checkbox", { name: "Send recap" }));
    expect(screen.getByText("1 of 2 done")).toBeTruthy();
    expect(screen.queryByText(/Overdue/)).toBeNull();
  });
});

describe("InterviewCard", () => {
  it("shows the score and records a decision", async () => {
    const onDecision = vi.fn();
    render(<InterviewCard name="Jo Park" role="Designer" date="Mar 3" summary="Strong portfolio." criteria={[{ label: "Craft", score: 5 }, { label: "Comms", score: 4 }]} highlights={["Led a redesign"]} onDecision={onDecision} />);
    expect(screen.getByLabelText("Overall score 4.5 out of 5")).toBeTruthy();
    await userEvent.click(screen.getByRole("radio", { name: "Advance" }));
    expect(onDecision).toHaveBeenCalledWith("advance");
    expect(screen.getByRole("radio", { name: "Advance" }).getAttribute("aria-checked")).toBe("true");
  });
});

describe("NlFilter", () => {
  it("turns a sentence into chips and removes them", async () => {
    const onValueChange = vi.fn();
    render(<NlFilter fields={FIELDS} onValueChange={onValueChange} />);
    await userEvent.type(screen.getByLabelText("Filter in plain English"), "open with high priority{Enter}");
    expect(onValueChange).toHaveBeenCalled();
    expect(screen.getByText("Status: open")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Remove Status: open" }));
    await waitFor(() => expect(screen.queryByText("Status: open")).toBeNull());
    expect(screen.getByText("Priority: high")).toBeTruthy();
  });
});

describe("AiColumn", () => {
  it("generates cells for every row", async () => {
    const generate = vi.fn(async (row: AiColumnRow) => `Hi ${row.name}`);
    render(<AiColumn label="Greeting" prompt="Say hi" columns={[{ key: "name", label: "Name" }]} rows={[{ id: "r1", name: "Ada" }, { id: "r2", name: "Bo" }]} generate={generate} />);
    await userEvent.click(screen.getByRole("button", { name: "Run column" }));
    await waitFor(() => expect(screen.getByText("Hi Bo")).toBeTruthy());
    expect(screen.getByText("Hi Ada")).toBeTruthy();
    expect(generate).toHaveBeenCalledTimes(2);
  });

  it("offers a retry when a cell fails", async () => {
    const generate = vi.fn().mockRejectedValueOnce(new Error("no")).mockResolvedValue("ok");
    render(<AiColumn label="G" prompt="p" columns={[]} rows={[{ id: "r1" }]} generate={generate} />);
    await userEvent.click(screen.getByRole("button", { name: "Generate for r1" }));
    await userEvent.click(await screen.findByRole("button", { name: "Failed, retry" }));
    expect(await screen.findByText("ok")).toBeTruthy();
  });
});

describe("AgentHandoff", () => {
  it("approves a pending handoff", async () => {
    const onApprove = vi.fn();
    render(<AgentHandoff from={{ name: "Triage", role: "Intake" }} to={{ name: "Billing Bot" }} reason="Needs a refund." context={["Order #12"]} status="pending" onApprove={onApprove} onCancel={() => {}} />);
    expect(screen.getByRole("article", { name: "Handoff from Triage to Billing Bot" })).toBeTruthy();
    expect(screen.getByText("Order #12")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Approve" }));
    expect(onApprove).toHaveBeenCalled();
  });

  it("hides actions once accepted", () => {
    render(<AgentHandoff from={{ name: "A" }} to={{ name: "B" }} reason="r" status="accepted" onApprove={() => {}} />);
    expect(screen.queryByRole("button", { name: "Approve" })).toBeNull();
    expect(screen.getByText("Handed off")).toBeTruthy();
  });
});

describe("VoiceCall", () => {
  it("counts up while live and mutes", async () => {
    vi.useFakeTimers();
    const onMutedChange = vi.fn();
    render(<VoiceCall name="Front desk" status="live" caption="One moment" onMutedChange={onMutedChange} />);
    act(() => void vi.advanceTimersByTime(3000));
    expect(screen.getByLabelText("Call duration").textContent).toBe("0:03");
    expect(screen.getByText("“One moment”")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Mute" }));
    expect(onMutedChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole("button", { name: "Unmute" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("disables controls once ended", () => {
    render(<VoiceCall name="Desk" status="ended" />);
    expect((screen.getByRole("button", { name: "End call" }) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("EmailDraft", () => {
  it("applies a rewrite and undoes it", async () => {
    const onSend = vi.fn();
    render(<EmailDraft to="sam@example.com" subject="Hello" defaultBody="Long message here." onSend={onSend} suggestions={[{ id: "short", label: "Shorter", rewrite: async () => "Short." }]} />);
    const body = screen.getByLabelText("Message body") as HTMLTextAreaElement;
    await userEvent.click(screen.getByRole("button", { name: "Shorter" }));
    await waitFor(() => expect(body.value).toBe("Short."));
    await userEvent.click(screen.getByRole("button", { name: /Undo/ }));
    expect(body.value).toBe("Long message here.");
    await userEvent.click(screen.getByRole("button", { name: /Send/ }));
    expect(onSend).toHaveBeenCalledWith({ to: "sam@example.com", subject: "Hello", body: "Long message here." });
  });

  it("keeps the draft when a rewrite fails", async () => {
    render(<EmailDraft to="a@b.c" subject="s" defaultBody="Keep me" suggestions={[{ id: "x", label: "Fancy", rewrite: async () => { throw new Error("fail"); } }]} />);
    await userEvent.click(screen.getByRole("button", { name: "Fancy" }));
    expect(await screen.findByText(/rewrite failed/)).toBeTruthy();
    expect((screen.getByLabelText("Message body") as HTMLTextAreaElement).value).toBe("Keep me");
  });
});

describe("PolicyBlock", () => {
  it("highlights the match and offers an override", async () => {
    const onOverride = vi.fn();
    render(<PolicyBlock policy="PII filter" rule="No card numbers" outcome="blocked" excerpt="Card 4111 1111 was sent" match="4111 1111" onOverride={onOverride} />);
    expect(screen.getByRole("article", { name: "PII filter: Blocked" })).toBeTruthy();
    expect(document.querySelector("mark")?.textContent).toBe("4111 1111");
    await userEvent.click(screen.getByRole("button", { name: "Override once" }));
    expect(onOverride).toHaveBeenCalled();
  });
});

describe("AgentCard", () => {
  it("renders details and is a button when selectable", async () => {
    const onSelect = vi.fn();
    render(<AgentCard name="Scout Research" role="Researcher" model="Deep" status="busy" stats={[{ label: "Runs", value: "128" }]} tags={["web"]} onSelect={onSelect} />);
    expect(screen.getByText("Working")).toBeTruthy();
    expect(screen.getByText("128")).toBeTruthy();
    await userEvent.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalled();
  });

  it("is a plain article without onSelect", () => {
    render(<AgentCard name="Scout" role="Researcher" />);
    expect(screen.getByRole("article", { name: "Scout" })).toBeTruthy();
  });
});

describe("LivePill", () => {
  it("shows label and detail as a status", () => {
    render(<LivePill detail="1.2k watching" />);
    expect(screen.getByRole("status").textContent).toContain("Live");
    expect(screen.getByRole("status").textContent).toContain("1.2k watching");
  });

  it("accepts a custom label", () => {
    render(<LivePill state="offline" label="Paused" />);
    expect(screen.getByText("Paused")).toBeTruthy();
  });
});

describe("ConnectApps", () => {
  it("connects and shows the connected state", async () => {
    const onToggle = vi.fn(async () => {});
    render(<ConnectApps apps={[{ id: "cal", name: "Calendar", description: "Read events" }]} onToggle={onToggle} />);
    await userEvent.click(screen.getByRole("button", { name: "Connect Calendar" }));
    expect(onToggle).toHaveBeenCalledWith("cal", true);
    expect(await screen.findByRole("button", { name: "Disconnect Calendar" })).toBeTruthy();
    expect(screen.getByText("Connected")).toBeTruthy();
  });

  it("reports a failure and stays disconnected", async () => {
    render(<ConnectApps apps={[{ id: "cal", name: "Calendar", description: "Read events" }]} onToggle={async () => { throw new Error("x"); }} />);
    await userEvent.click(screen.getByRole("button", { name: "Connect Calendar" }));
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Connect Calendar" })).toBeTruthy();
  });
});
