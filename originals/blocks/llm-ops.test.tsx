import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LlmOpsAgentRuns, filterAgentRuns, formatRunCost, formatRunDuration, totalRunCost, DEMO_AGENT_RUNS } from "./llm-ops-agent-runs";
import { LlmOpsCostByFeature, rankFeatures } from "./llm-ops-cost-by-feature";
import { LlmOpsCostByProvider } from "./llm-ops-cost-by-provider";
import { LlmOpsEvalScorecard } from "./llm-ops-eval-scorecard";
import { LlmOpsLatency, latestAndChange, formatMs } from "./llm-ops-latency";
import { LlmOpsModelSpend, budgetStatus } from "./llm-ops-model-spend";
import { LlmOpsPromptCache, cacheSavings, hitRate } from "./llm-ops-prompt-cache";
import { LlmOpsProviderHealth, providerState, DEMO_PROVIDER_HEALTH } from "./llm-ops-provider-health";
import { LlmOps } from "../templates/llm-ops";

afterEach(cleanup);

beforeAll(() => {
  const observer = class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    };
  vi.stubGlobal("IntersectionObserver", observer);
  vi.stubGlobal("ResizeObserver", observer);
});

describe("agent runs", () => {
  it("renders runs and filters by status", async () => {
    const user = userEvent.setup();
    const onOpenRun = vi.fn();
    render(<LlmOpsAgentRuns onOpenRun={onOpenRun} />);
    expect(screen.getByRole("region", { name: "Recent agent runs" })).toBeTruthy();
    expect(screen.getAllByRole("listitem")).toHaveLength(DEMO_AGENT_RUNS.length);
    await user.click(screen.getByRole("radio", { name: "Failed" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    await user.click(screen.getAllByRole("button", { name: /Release notes/ })[0]);
    expect(onOpenRun).toHaveBeenCalledWith("run_8f27");
  });
  it("shows an empty state", async () => {
    render(<LlmOpsAgentRuns runs={[]} />);
    expect(screen.getByText("No runs match this filter.")).toBeTruthy();
  });
  it("has pure helpers", () => {
    expect(formatRunCost(0.184)).toBe("$0.184");
    expect(formatRunCost(1.5)).toBe("$1.50");
    expect(formatRunDuration(95_000)).toBe("1m 35s");
    expect(formatRunDuration(0)).toBe("-");
    expect(filterAgentRuns(DEMO_AGENT_RUNS, "running")).toHaveLength(1);
    expect(totalRunCost([{ ...DEMO_AGENT_RUNS[0], costUsd: 1 }, { ...DEMO_AGENT_RUNS[1], costUsd: 2 }])).toBe(3);
  });
});

describe("cost by feature", () => {
  it("ranks features with shares", () => {
    render(<LlmOpsCostByFeature />);
    const items = screen.getAllByRole("listitem");
    expect(within(items[0]).getByText("Smart replies")).toBeTruthy();
    expect(screen.getByRole("meter", { name: "Smart replies share of spend" })).toBeTruthy();
    const r = rankFeatures([{ feature: "a", costUsd: 1, changePct: 0 }, { feature: "b", costUsd: 3, changePct: 0 }]);
    expect(r[0].feature).toBe("b");
    expect(r[0].share).toBe(0.75);
  });
});

describe("cost by provider", () => {
  it("renders the donut with providers", () => {
    render(<LlmOpsCostByProvider />);
    expect(screen.getByRole("region", { name: "Cost by provider" })).toBeTruthy();
    expect(screen.getAllByText(/Northwind AI/).length).toBeGreaterThan(0);
  });
});

describe("eval scorecard", () => {
  it("switches the model", async () => {
    const user = userEvent.setup();
    render(<LlmOpsEvalScorecard />);
    expect(screen.getByRole("region", { name: "Halo 2 evaluation" })).toBeTruthy();
    await user.click(screen.getByRole("radio", { name: "Orbit S" }));
    expect(screen.getByRole("region", { name: "Orbit S evaluation" })).toBeTruthy();
  });
});

describe("latency", () => {
  it("toggles between first token and total", async () => {
    const user = userEvent.setup();
    render(<LlmOpsLatency />);
    expect(screen.getByRole("heading", { name: "Time to first token" })).toBeTruthy();
    await user.click(screen.getByRole("radio", { name: "Total" }));
    expect(screen.getByRole("heading", { name: "Total latency" })).toBeTruthy();
  });
  it("computes change and formats", () => {
    expect(latestAndChange({ label: "p50", current: [110], previous: [100] })).toEqual({ value: 110, changePct: 10 });
    expect(formatMs(450)).toBe("450 ms");
    expect(formatMs(2500)).toBe("2.50 s");
  });
});

describe("model spend", () => {
  it("shows budget status", () => {
    render(<LlmOpsModelSpend />);
    expect(screen.getByRole("status").textContent).toMatch(/projected/);
    expect(budgetStatus([100], [150], 200).state).toBe("on-track");
    expect(budgetStatus([100], [190], 200).state).toBe("at-risk");
    expect(budgetStatus([100], [250], 200).state).toBe("over");
  });
});

describe("prompt cache", () => {
  it("shows hit rate and savings", () => {
    render(<LlmOpsPromptCache />);
    expect(screen.getByRole("region", { name: "Prompt cache" })).toBeTruthy();
    expect(screen.getByRole("meter", { name: "support-system hit rate" }).getAttribute("aria-valuenow")).toBe("92");
    expect(hitRate(1, 4)).toBe(0.25);
    expect(hitRate(0, 0)).toBe(0);
    const s = cacheSavings([{ prompt: "a", hits: 500, requests: 1000 }], 3, 0.1, 2000);
    expect(s.rate).toBe(0.5);
    expect(s.cachedTokens).toBe(1_000_000);
    expect(s.savedUsd).toBeCloseTo(2.7);
  });
});

describe("provider health", () => {
  it("lists providers and derives state", () => {
    render(<LlmOpsProviderHealth />);
    expect(screen.getByText("Orbital Models")).toBeTruthy();
    expect(screen.getAllByText("Outage").length).toBeGreaterThan(0);
    expect(providerState(DEMO_PROVIDER_HEALTH[3])).toBe("healthy");
    expect(providerState(DEMO_PROVIDER_HEALTH[1])).toBe("degraded");
    expect(providerState(DEMO_PROVIDER_HEALTH[2])).toBe("down");
  });
});

describe("LlmOps template", () => {
  it("renders and switches views", async () => {
    const user = userEvent.setup();
    render(<LlmOps />);
    expect(screen.getByRole("heading", { name: "Overview", level: 1 })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Recent agent runs" })).toBeTruthy();
    await user.click(screen.getAllByText("Reliability")[0]);
    expect(screen.getByRole("heading", { name: "Reliability", level: 1 })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Provider health" })).toBeTruthy();
  });
});
