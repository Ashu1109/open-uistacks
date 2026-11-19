import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DevToolsBuildHealth, passRate, formatDuration } from "./dev-tools-build-health";
import { DevToolsCiMinutes, projectMonthEnd } from "./dev-tools-ci-minutes";
import { DevToolsDeploysToday, filterDeploys, DEMO_DEPLOYS } from "./dev-tools-deploys-today";
import { DevToolsDora, isImprovement, sparkPath } from "./dev-tools-dora";
import { DevToolsFlakyTests, failureRate, rankByFailureRate, DEMO_FLAKY } from "./dev-tools-flaky-tests";
import { DevToolsReleaseGate, canApprove, DEMO_GATE } from "./dev-tools-release-gate";
import { DevToolsReviewQueue, formatAge, sortPulls, DEMO_PULLS } from "./dev-tools-review-queue";
import { DevToolsTopErrors, shareOf } from "./dev-tools-top-errors";
import { DevTools } from "../templates/dev-tools";

afterEach(cleanup);

describe("helpers", () => {
  it("computes pass rate, duration, projection, rates and ages", () => {
    expect(passRate([true, true, false, false])).toBe(50);
    expect(passRate([])).toBe(0);
    expect(formatDuration(412)).toBe("6m 52s");
    expect(projectMonthEnd(9900, 15, 30)).toBe(19800);
    expect(failureRate({ failures: 1, runs: 4 })).toBe(25);
    expect(rankByFailureRate(DEMO_FLAKY)[0].id).toBe("t1");
    expect(formatAge(0.2)).toBe("under 1h");
    expect(formatAge(30)).toBe("30h");
    expect(formatAge(76)).toBe("3d");
    expect(sortPulls(DEMO_PULLS, "size")[0].id).toBe("p2");
    expect(shareOf(1, 4)).toBe(25);
    expect(isImprovement(-5, true)).toBe(true);
    expect(isImprovement(-5, false)).toBe(false);
    expect(sparkPath([1, 2, 3], 10, 10).startsWith("M0.0")).toBe(true);
    expect(canApprove(DEMO_GATE)).toBe(false);
    expect(filterDeploys(DEMO_DEPLOYS, "staging")).toHaveLength(2);
  });
});

describe("blocks render", () => {
  it("build health lists branches and opens one", async () => {
    const onOpen = vi.fn();
    render(<DevToolsBuildHealth onOpenBranch={onOpen} />);
    expect(screen.getByRole("region", { name: "Build health" })).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: /fix\/queue-deadlock, Failing/ }));
    expect(onOpen).toHaveBeenCalledWith("fix/queue-deadlock");
  });

  it("ci minutes shows usage and an over-quota projection", () => {
    render(<DevToolsCiMinutes />);
    expect(screen.getByText(/On pace for 17,471/)).toBeTruthy();
    expect(screen.getByRole("list", { name: "Minutes by workflow" })).toBeTruthy();
  });

  it("deploys filters by environment", async () => {
    render(<DevToolsDeploysToday />);
    expect(screen.getAllByRole("listitem")).toHaveLength(6);
    await userEvent.click(screen.getByRole("button", { name: "Staging" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("dora shows the four metrics", () => {
    render(<DevToolsDora />);
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    expect(screen.getByText("Time to restore")).toBeTruthy();
  });

  it("flaky tests quarantine toggles and reports", async () => {
    const onChange = vi.fn();
    render(<DevToolsFlakyTests onQuarantineChange={onChange} />);
    expect(screen.getByText("4 active")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: /Quarantine checkout applies coupon/ }));
    expect(onChange).toHaveBeenCalledWith("t1", true);
    expect(screen.getByText("3 active")).toBeTruthy();
  });

  it("release gate blocks approval until required items pass", async () => {
    const onBlock = vi.fn();
    render(<DevToolsReleaseGate onBlock={onBlock} />);
    expect((screen.getByRole("button", { name: "Approve release" }) as HTMLButtonElement).disabled).toBe(true);
    await userEvent.click(screen.getByRole("button", { name: "Block" }));
    expect(onBlock).toHaveBeenCalledWith("v2.9.0");
    expect(screen.getByText("Blocked")).toBeTruthy();
  });

  it("release gate approves when every required check passes", async () => {
    const onApprove = vi.fn();
    render(<DevToolsReleaseGate items={[{ id: "a", label: "CI", state: "pass" }]} onApprove={onApprove} />);
    await userEvent.click(screen.getByRole("button", { name: "Approve release" }));
    expect(onApprove).toHaveBeenCalledWith("v2.9.0");
    expect(screen.getByText("Approved")).toBeTruthy();
  });

  it("review queue sorts by age then size", async () => {
    render(<DevToolsReviewQueue />);
    const first = () => within(screen.getAllByRole("listitem")[0]).getByText(/#\d+/).textContent;
    expect(first()).toContain("#1482");
    await userEvent.click(screen.getByRole("button", { name: "size" }));
    expect(first()).toContain("#1497");
  });

  it("top errors ranks by count", () => {
    render(<DevToolsTopErrors />);
    expect(screen.getAllByRole("listitem")[0].textContent).toContain("TimeoutError");
  });
});

describe("DevTools template", () => {
  it("renders Overview and switches to Quality", async () => {
    render(<DevTools />);
    expect(screen.getByRole("heading", { name: "Overview" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "DORA metrics" })).toBeTruthy();
    await userEvent.click(screen.getAllByText("Quality")[0]);
    expect(screen.getByRole("heading", { name: "Quality" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Flaky tests" })).toBeTruthy();
  });
});
