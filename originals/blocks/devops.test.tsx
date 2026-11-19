import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DevopsActiveIncidents, formatAge, sortIncidents, type Incident } from "./devops-active-incidents";
import { DevopsErrorBudget, budgetMinutes, budgetState } from "./devops-error-budget";
import { DevopsHotHosts, loadColor, rankHosts } from "./devops-hot-hosts";
import { DevopsLatency, formatMs } from "./devops-latency";
import { DevopsOnCall, formatShiftEnd } from "./devops-on-call";
import { DevopsRegions, regionCounts } from "./devops-regions";
import { DevopsServiceStatus } from "./devops-service-status";
import { DevopsUptimeHistory, buildDays, worstUptime } from "./devops-uptime-history";
import { Devops } from "../templates/devops";

afterEach(cleanup);

describe("devops-active-incidents", () => {
  it("renders incidents with the most severe first", () => {
    render(<DevopsActiveIncidents />);
    expect(screen.getByRole("heading", { name: "Active incidents" })).toBeTruthy();
    const items = screen.getAllByRole("listitem");
    expect(items[0].textContent).toContain("SEV1");
    expect(screen.getAllByText("3 unacknowledged").length).toBeGreaterThan(0);
  });

  it("acknowledges an incident and reports it", async () => {
    const onAcknowledge = vi.fn();
    render(<DevopsActiveIncidents onAcknowledge={onAcknowledge} />);
    await userEvent.click(screen.getByRole("button", { name: "Acknowledge inc-2041" }));
    expect(onAcknowledge).toHaveBeenCalledWith("inc-2041");
    expect(screen.queryByRole("button", { name: "Acknowledge inc-2041" })).toBeNull();
    expect(screen.getAllByText("2 unacknowledged").length).toBeGreaterThan(0);
  });

  it("shows an empty state", () => {
    render(<DevopsActiveIncidents incidents={[]} />);
    expect(screen.getByText("No active incidents.")).toBeTruthy();
  });

  it("sorts by severity then age and formats ages", () => {
    const mk = (id: string, severity: Incident["severity"], minutesAgo: number): Incident => ({ id, title: id, service: "s", severity, minutesAgo });
    expect(sortIncidents([mk("a", "sev3", 5), mk("b", "sev1", 1), mk("c", "sev1", 9)]).map((i) => i.id)).toEqual(["c", "b", "a"]);
    expect(formatAge(45)).toBe("45m");
    expect(formatAge(120)).toBe("2h");
    expect(formatAge(125)).toBe("2h 5m");
  });
});

describe("devops-error-budget", () => {
  it("renders one meter per SLO with its state", () => {
    render(<DevopsErrorBudget />);
    expect(screen.getByRole("progressbar", { name: "Checkout success error budget used" }).getAttribute("aria-valuenow")).toBe("81");
    expect(screen.getByText(/Exhausted/)).toBeTruthy();
  });

  it("computes budget minutes and state", () => {
    expect(budgetMinutes(99.9, 30)).toBe(43);
    expect(budgetState({ consumed: 0.2, burnRate: 0.5 })).toBe("healthy");
    expect(budgetState({ consumed: 0.2, burnRate: 3 })).toBe("at-risk");
    expect(budgetState({ consumed: 1.1, burnRate: 0.5 })).toBe("exhausted");
  });
});

describe("devops-hot-hosts", () => {
  it("renders ranked hosts and re-ranks by memory", async () => {
    render(<DevopsHotHosts />);
    const first = () => within(screen.getByRole("list", { name: /Hosts ranked by/ })).getAllByRole("listitem")[0].textContent;
    expect(first()).toContain("web-use1-014");
    await userEvent.click(screen.getByRole("button", { name: "Memory" }));
    expect(first()).toContain("db-use1-002");
  });

  it("ranks and colours by threshold", () => {
    const hosts = [{ name: "a", cpu: 10, memory: 90 }, { name: "b", cpu: 50, memory: 20 }];
    expect(rankHosts(hosts, "cpu").map((h) => h.name)).toEqual(["b", "a"]);
    expect(rankHosts(hosts, "memory", 1).map((h) => h.name)).toEqual(["a"]);
    expect(loadColor(50)).toBe("var(--success)");
    expect(loadColor(80)).toBe("var(--warning)");
    expect(loadColor(95)).toBe("var(--danger)");
  });
});

describe("devops-latency", () => {
  it("renders the percentiles and a chart, and switches range", async () => {
    render(<DevopsLatency />);
    expect(screen.getByRole("heading", { name: "Request latency" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Latency percentiles over the last 1h" })).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "24h" }));
    expect(screen.getByRole("img", { name: "Latency percentiles over the last 24h" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "24h" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("formats milliseconds", () => {
    expect(formatMs(84.4)).toBe("84 ms");
    expect(formatMs(1500)).toBe("1.50 s");
  });
});

describe("devops-on-call", () => {
  it("lists rotations and pages the current engineer", async () => {
    const onPage = vi.fn();
    render(<DevopsOnCall onPage={onPage} />);
    expect(screen.getByText("Platform primary · ends in 3h")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Page Wen Zhao" }));
    expect(onPage).toHaveBeenCalledWith(expect.objectContaining({ id: "data" }));
  });

  it("formats time until shift end", () => {
    expect(formatShiftEnd(45)).toBe("45m");
    expect(formatShiftEnd(190)).toBe("3h");
    expect(formatShiftEnd(1560)).toBe("1d 2h");
  });
});

describe("devops-regions", () => {
  it("renders the map, list and counts", () => {
    render(<DevopsRegions />);
    expect(screen.getByRole("group", { name: "Region health map" })).toBeTruthy();
    expect(screen.getByLabelText("Regions by status").textContent).toContain("5 healthy");
    expect(screen.getByText("no response")).toBeTruthy();
  });

  it("counts regions by status", () => {
    const r = { id: "x", name: "x", lat: 0, lon: 0, latencyMs: 1 };
    expect(regionCounts([{ ...r, status: "down" }, { ...r, status: "down" }, { ...r, status: "healthy" }])).toEqual({ healthy: 1, degraded: 0, down: 2 });
  });
});

describe("devops-service-status", () => {
  it("filters to services with problems", async () => {
    render(<DevopsServiceStatus />);
    expect(screen.getAllByRole("listitem")).toHaveLength(7);
    await userEvent.click(screen.getByRole("button", { name: /Problems only/ }));
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.queryByText("Auth service")).toBeNull();
  });

  it("shows an empty state when everything is operational", async () => {
    render(<DevopsServiceStatus services={[{ id: "a", name: "A", state: "operational", errorRate: 0, p95Ms: 10 }]} />);
    await userEvent.click(screen.getByRole("button", { name: /Problems only/ }));
    expect(screen.getByText("All services are operational.")).toBeTruthy();
  });
});

describe("devops-uptime-history", () => {
  it("renders 90-day bars per service", () => {
    render(<DevopsUptimeHistory />);
    expect(screen.getByRole("heading", { name: "Uptime, last 90 days" })).toBeTruthy();
    expect(screen.getAllByRole("img", { name: /last 90 days/ })).toHaveLength(4);
  });

  it("builds days and finds the worst service", () => {
    const days = buildDays(3, new Date(2026, 0, 3), { 0: "down" });
    expect(days.map((d) => d.date)).toEqual(["Jan 1", "Jan 2", "Jan 3"]);
    expect(days[2].status).toBe("down");
    expect(worstUptime([{ name: "a", days }, { name: "b", days: buildDays(3, new Date(2026, 0, 3)) }])).toBeCloseTo(66.67, 1);
    expect(worstUptime([])).toBeNull();
  });
});

describe("devops template", () => {
  it("renders the overview and switches to services", async () => {
    render(<Devops />);
    expect(screen.getByRole("heading", { level: 1, name: "Overview" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Active incidents" })).toBeTruthy();
    await userEvent.click(screen.getAllByText("Services")[0]);
    expect(screen.getByRole("heading", { level: 1, name: "Services" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Regions" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Active incidents" })).toBeNull();
  });
});
