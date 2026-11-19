import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataPipelines } from "../templates/data-pipelines";
import { DataPipelinesConnectorHealth, connectorCounts, formatRows, DEMO_CONNECTORS } from "./data-pipelines-connector-health";
import { DataPipelinesDataTests, testSummary, DEMO_TESTS } from "./data-pipelines-data-tests";
import { DataPipelinesFailedSync, pendingAfterRetry } from "./data-pipelines-failed-sync";
import { DataPipelinesFreshness, freshnessState, formatAge } from "./data-pipelines-freshness";
import { DataPipelinesNightlyRun, layoutRun, formatMinutes, DEMO_RUN_TASKS } from "./data-pipelines-nightly-run";
import { DataPipelinesRowsLoaded, lastDays, totalRows, DEMO_ROWS_DAYS } from "./data-pipelines-rows-loaded";
import { DataPipelinesWarehouseSpend, projectCredits } from "./data-pipelines-warehouse-spend";

afterEach(cleanup);

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe("helpers", () => {
  it("counts connectors and formats rows", () => {
    expect(connectorCounts(DEMO_CONNECTORS)).toEqual({ healthy: 3, delayed: 1, failing: 1, paused: 1 });
    expect(formatRows(950)).toBe("950");
    expect(formatRows(182400)).toBe("182.4k");
    expect(formatRows(2_500_000)).toBe("2.5M");
  });
  it("summarises tests", () => {
    expect(testSummary(DEMO_TESTS)).toMatchObject({ pass: 6, warn: 1, fail: 1, total: 8, rate: 75 });
    expect(testSummary([]).rate).toBeNull();
  });
  it("classifies freshness and formats age", () => {
    expect(freshnessState(10, 60)).toBe("fresh");
    expect(freshnessState(50, 60)).toBe("at-risk");
    expect(freshnessState(61, 60)).toBe("stale");
    expect(formatAge(125)).toBe("2h 5m");
    expect(formatAge(40)).toBe("40m");
  });
  it("lays out the run and formats minutes", () => {
    const { total, bars } = layoutRun([{ id: "a", name: "A", startMinute: 0, durationMinutes: 50, status: "success" }, { id: "b", name: "B", startMinute: 50, durationMinutes: 50, status: "success" }]);
    expect(total).toBe(100);
    expect(bars[1]).toEqual({ id: "b", left: 50, width: 50 });
    expect(formatMinutes(90)).toBe("1 h 30 min");
  });
  it("slices and totals days, projects credits, dedupes pending", () => {
    expect(lastDays(DEMO_ROWS_DAYS, 7)).toHaveLength(7);
    expect(totalRows([{ date: "a", rows: 2 }, { date: "b", rows: 3 }])).toBe(5);
    expect(projectCredits(100, 10, 30)).toBe(300);
    expect(projectCredits(100, 0, 30)).toBe(0);
    expect(pendingAfterRetry(["a"], "a")).toEqual(["a"]);
    expect(pendingAfterRetry(["a"], "b")).toEqual(["a", "b"]);
  });
});

describe("blocks", () => {
  it("connector health filters by status and reports selection", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<DataPipelinesConnectorHealth onSelect={onSelect} />);
    expect(screen.getByRole("region", { name: "Connector health" })).toBeTruthy();
    expect(screen.getByText("3 of 6 healthy")).toBeTruthy();
    await user.click(screen.getByRole("tab", { name: /Failing/ }));
    expect(screen.getByText("Support desk")).toBeTruthy();
    expect(screen.queryByText("Orders DB")).toBeNull();
    await user.click(screen.getByRole("button", { name: /Support desk/ }));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "c4" }));
    cleanup();
    render(<DataPipelinesConnectorHealth connectors={[]} />);
    expect(screen.getByText(/No connectors/)).toBeTruthy();
  });

  it("data tests show the pass rate and filter by result", async () => {
    const user = userEvent.setup();
    render(<DataPipelinesDataTests />);
    expect(screen.getByText("75%")).toBeTruthy();
    expect(screen.getByRole("img", { name: "6 passed, 1 warnings, 1 failed" })).toBeTruthy();
    await user.click(screen.getByRole("tab", { name: /Failed/ }));
    expect(screen.getByText("not_null(customer_id)")).toBeTruthy();
    expect(screen.queryByText("unique(order_id)")).toBeNull();
  });

  it("failed sync retries one row, shows Retrying and can retry all", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<DataPipelinesFailedSync onRetry={onRetry} />);
    await user.click(screen.getByRole("button", { name: "Retry Billing" }));
    expect(onRetry).toHaveBeenCalledWith(expect.objectContaining({ id: "f2" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Retrying Billing" })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Retry all" }));
    expect(onRetry).toHaveBeenCalledTimes(3);
  });

  it("failed sync clears the retrying state when the retry rejects", async () => {
    const user = userEvent.setup();
    render(<DataPipelinesFailedSync syncs={[{ id: "x", connector: "Orders", failedAt: "now", error: "boom", attempts: 1 }]} onRetry={() => Promise.reject(new Error("no"))} />);
    await user.click(screen.getByRole("button", { name: "Retry Orders" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Retry Orders" })).toBeTruthy());
  });

  it("freshness lists the worst table first with meters", () => {
    render(<DataPipelinesFreshness />);
    const items = within(screen.getByRole("region", { name: "Table freshness" })).getAllByRole("listitem");
    expect(items[0].textContent).toContain("analytics.payments");
    expect(screen.getByText("1 past SLA")).toBeTruthy();
    expect(screen.getByRole("meter", { name: "analytics.payments age" }).getAttribute("aria-valuetext")).toBe("3h 10m old, SLA 2h");
  });

  it("nightly run lists every task with its status", () => {
    render(<DataPipelinesNightlyRun />);
    expect(screen.getByRole("region", { name: "Nightly run timeline" })).toBeTruthy();
    expect(screen.getAllByRole("listitem")).toHaveLength(DEMO_RUN_TASKS.length);
    expect(screen.getByText("1 failed")).toBeTruthy();
    expect(screen.getByText(/Failed, starts at minute 0/)).toBeTruthy();
  });

  it("rows loaded switches the range and reads out a focused day", async () => {
    const user = userEvent.setup();
    render(<DataPipelinesRowsLoaded />);
    expect(screen.getAllByRole("button", { name: /rows$/ })).toHaveLength(14);
    await user.click(screen.getByRole("tab", { name: "30d" }));
    expect(screen.getAllByRole("button", { name: /rows$/ })).toHaveLength(30);
    await user.tab();
    const first = screen.getAllByRole("button", { name: /rows$/ })[0];
    first.focus();
    expect(screen.getByText(/Oct 19/, { selector: "span.font-medium" })).toBeTruthy();
  });

  it("warehouse spend flags a projected overrun", () => {
    const { rerender } = render(<DataPipelinesWarehouseSpend />);
    expect(screen.getByRole("progressbar", { name: "Credits used against budget" }).getAttribute("aria-valuenow")).toBe("900");
    expect(screen.getByText(/On pace for 1,588 credits/)).toBeTruthy();
    expect(screen.getByText(/within budget/)).toBeTruthy();
    rerender(<DataPipelinesWarehouseSpend budget={1000} />);
    expect(screen.getByText(/588 over budget/)).toBeTruthy();
  });
});

describe("DataPipelines template", () => {
  it("renders the overview and switches views", async () => {
    const user = userEvent.setup();
    render(<DataPipelines />);
    expect(screen.getByRole("heading", { name: "Overview" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Warehouse spend" })).toBeTruthy();
    await user.click(screen.getAllByText("Quality")[0]);
    expect(screen.getByRole("heading", { name: "Quality" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Data tests" })).toBeTruthy();
    await user.click(screen.getAllByText("Connectors")[0]);
    expect(screen.getByRole("region", { name: "Connector health" })).toBeTruthy();
  });
});
