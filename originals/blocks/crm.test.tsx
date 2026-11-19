import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { moveCard } from "../ui/kanban-board";
import { ContactRecord } from "./contact-record";
import { CustomersSummary, summarize, DEMO_CUSTOMERS } from "./customers-summary";
import { DEMO_DEALS, DEMO_STAGES, DealPipelineBoard, dealsToColumns, formatMoney, stageTotals } from "./deal-pipeline-board";
import { DealsClosingSoon, closingSoon, dueLabel } from "./deals-closing-soon";
import { SalesKpiRow } from "./sales-kpi-row";
import { SalesToday, completion, toggleItem, DEMO_TODAY } from "./sales-today";
import { StacksCrm } from "../templates/stacks-crm";

class StubObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("IntersectionObserver", StubObserver);
vi.stubGlobal("ResizeObserver", StubObserver);

afterEach(cleanup);

describe("pipeline helpers", () => {
  it("formats minor units as currency", () => {
    expect(formatMoney(4_800_000)).toBe("$48,000");
  });

  it("re-totals both stages when a deal moves", () => {
    const before = dealsToColumns(DEMO_STAGES, DEMO_DEALS);
    const after = moveCard(before, "d1", "qualified", 0);
    const a = stageTotals(before, DEMO_DEALS);
    const b = stageTotals(after, DEMO_DEALS);
    const get = (t: typeof a, id: string) => t.find((x) => x.stageId === id)!;
    expect(get(b, "negotiation").totalMinor).toBe(get(a, "negotiation").totalMinor - 4_800_000);
    expect(get(b, "qualified").totalMinor).toBe(get(a, "qualified").totalMinor + 4_800_000);
    expect(get(b, "qualified").count).toBe(get(a, "qualified").count + 1);
  });
});

describe("DealPipelineBoard", () => {
  it("shows stage totals and every deal", () => {
    render(<DealPipelineBoard />);
    const totals = within(screen.getByRole("list", { name: "Stage totals" }));
    expect(totals.getByText("$81,000", { exact: false })).toBeTruthy();
    expect(screen.getByText(/Platform rollout/)).toBeTruthy();
  });

  it("reports a keyboard move and updates totals", async () => {
    const user = userEvent.setup();
    const onDealMove = vi.fn();
    render(<DealPipelineBoard onDealMove={onDealMove} />);
    const card = screen.getByText(/Starter plan/);
    const handle = card.closest("[tabindex]") as HTMLElement | null;
    if (!handle) throw new Error("no focusable card");
    handle.focus();
    await user.keyboard(" ");
    await user.keyboard("{ArrowRight}");
    await user.keyboard(" ");
    expect(onDealMove).toHaveBeenCalledWith("d7", "qualified");
    const totals = within(screen.getByRole("list", { name: "Stage totals" }));
    expect(totals.getByText("$38,400")).toBeTruthy();
  });
});

describe("DealsClosingSoon", () => {
  it("sorts soonest first inside the window", () => {
    const list = closingSoon(DEMO_DEALS, "2026-11-18", 7);
    expect(list.map((d) => d.id)).toEqual(["d4", "d1", "d2"]);
    expect(dueLabel(0)).toBe("Today");
    expect(dueLabel(1)).toBe("Tomorrow");
    expect(dueLabel(-2)).toBe("2d overdue");
  });

  it("renders the list and opens a deal", async () => {
    const onOpenDeal = vi.fn();
    render(<DealsClosingSoon onOpenDeal={onOpenDeal} />);
    await userEvent.click(screen.getByRole("button", { name: /Platform rollout/ }));
    expect(onOpenDeal).toHaveBeenCalledWith("d1");
  });

  it("shows an empty state", () => {
    render(<DealsClosingSoon deals={[]} />);
    expect(screen.getByText(/Nothing closes/)).toBeTruthy();
  });
});

describe("SalesKpiRow", () => {
  it("renders the four KPIs", () => {
    render(<SalesKpiRow />);
    const row = screen.getByRole("region", { name: "Sales KPIs" });
    for (const label of ["Revenue", "Win rate", "Open pipeline", "Sales cycle"]) expect(within(row).getByText(label)).toBeTruthy();
  });
});

describe("SalesToday", () => {
  it("computes completion", () => {
    expect(completion(DEMO_TODAY)).toEqual({ done: 1, total: 5, percent: 20 });
    expect(completion(toggleItem(DEMO_TODAY, "t2")).done).toBe(2);
  });

  it("ticks an item and updates the status", async () => {
    const onToggle = vi.fn();
    render(<SalesToday onToggle={onToggle} />);
    expect(screen.getByRole("status").textContent).toBe("1 of 5 done");
    await userEvent.click(screen.getByRole("checkbox", { name: /Contract review/ }));
    expect(screen.getByRole("status").textContent).toBe("2 of 5 done");
    expect(onToggle).toHaveBeenCalledWith("t2", true);
  });
});

describe("CustomersSummary", () => {
  it("summarizes accounts, excluding churned value", () => {
    expect(summarize(DEMO_CUSTOMERS)).toEqual({ total: 7, active: 4, atRisk: 2, arrMinor: 15_230_000 });
  });

  it("renders the table and opens a customer", async () => {
    const onOpenCustomer = vi.fn();
    render(<CustomersSummary onOpenCustomer={onOpenCustomer} />);
    expect(screen.getByRole("table", { name: "Customers" })).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Brightwell Foods" }));
    expect(onOpenCustomer).toHaveBeenCalledWith("c1");
  });
});

describe("ContactRecord", () => {
  it("renders the profile, properties, deals and timeline", () => {
    render(<ContactRecord />);
    expect(screen.getByRole("heading", { name: "Priya Raman" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Related deals" })).toBeTruthy();
    expect(screen.getByRole("list", { name: "Activity" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Properties" })).toBeTruthy();
  });

  it("adds a note to the top of the timeline", async () => {
    const user = userEvent.setup();
    const onAddNote = vi.fn();
    render(<ContactRecord onAddNote={onAddNote} />);
    const save = screen.getByRole("button", { name: "Save note" }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);
    await user.type(screen.getByLabelText("Add a note"), "Sent the deck");
    await user.click(save);
    expect(onAddNote).toHaveBeenCalledWith("Sent the deck");
    expect(screen.getByText("Sent the deck")).toBeTruthy();
  });
});

describe("StacksCrm", () => {
  it("renders the overview and switches views", async () => {
    render(<StacksCrm />);
    expect(screen.getByRole("heading", { level: 1, name: "Overview" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Sales KPIs" })).toBeTruthy();
    await userEvent.click(screen.getAllByText("Contacts")[0]);
    expect(screen.getByRole("heading", { level: 1, name: "Contacts" })).toBeTruthy();
    expect(screen.getByRole("table", { name: "Customers" })).toBeTruthy();
  });
});
