import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataTable, compareValues, filterRows, nextSort, paginate, sortRows, type DataColumn } from "./ui/data-table";
import { SettingsRow } from "./ui/settings-row";
import { ApiKeyRow, maskKey } from "./ui/api-key-row";
import { WeekCalendar, addDays, layoutEvents, startOfWeek, type CalendarEvent } from "./ui/week-calendar";
import { ResizablePanels, clampSize } from "./ui/resizable-panels";
import { SparklineTable, seriesChange, sparklinePath } from "./ui/sparkline-table";
import { Carousel, clampIndex, slideIndex } from "./ui/carousel";
import { MonthCalendar, monthGrid } from "./ui/month-calendar";
import { FileManager, resolvePath, sortNodes, type FileNode } from "./ui/file-manager";
import { CohortTable, cellTint, formatPercent } from "./ui/cohort-table";
import { OrgChart, layoutTree, type OrgNode } from "./ui/org-chart";
import { GanttChart, taskRange } from "./ui/gantt-chart";
import { GanttRow, barGeometry, daysBetween } from "./ui/gantt-row";
import { CycleCard, cycleStatus, daysLeft, scopeShares } from "./ui/cycle-card";
import { IntegrationCard } from "./ui/integration-card";
import { SwipeRow, shouldOpen } from "./ui/swipe-row";
import { TestimonialCard, initials } from "./ui/testimonial-card";
import { FaqList, toggleOpen } from "./ui/faq-list";
import { FeatureGrid } from "./ui/feature-grid";
import { StepsCard, stepState } from "./ui/steps-card";

afterEach(cleanup);

interface Person { id: string; name: string; age: number }
const PEOPLE: Person[] = [
  { id: "a", name: "Ada", age: 36 },
  { id: "b", name: "Bo", age: 9 },
  { id: "c", name: "Cy", age: 20 },
  { id: "d", name: "Di", age: 20 },
];
const COLUMNS: DataColumn<Person>[] = [
  { key: "name", header: "Name", sortable: true },
  { key: "age", header: "Age", sortable: true, align: "right" },
];

describe("data table helpers", () => {
  it("compares numerically and naturally", () => {
    expect(compareValues(9, 36)).toBeLessThan(0);
    expect(compareValues("file2", "file10")).toBeLessThan(0);
  });
  it("cycles sort none -> asc -> desc -> none", () => {
    const asc = nextSort(null, "age");
    expect(asc).toEqual({ key: "age", direction: "asc" });
    const desc = nextSort(asc, "age");
    expect(desc).toEqual({ key: "age", direction: "desc" });
    expect(nextSort(desc, "age")).toBeNull();
    expect(nextSort(desc, "name")).toEqual({ key: "name", direction: "asc" });
  });
  it("sorts stably without mutating", () => {
    const sorted = sortRows(PEOPLE, COLUMNS, { key: "age", direction: "asc" });
    expect(sorted.map((p) => p.id)).toEqual(["b", "c", "d", "a"]);
    expect(sortRows(PEOPLE, COLUMNS, { key: "age", direction: "desc" }).map((p) => p.id)).toEqual(["a", "c", "d", "b"]);
    expect(PEOPLE[0].id).toBe("a");
  });
  it("filters across columns and paginates with clamping", () => {
    expect(filterRows(PEOPLE, COLUMNS, " 20 ").map((p) => p.id)).toEqual(["c", "d"]);
    expect(filterRows(PEOPLE, COLUMNS, "").length).toBe(4);
    const p = paginate([1, 2, 3, 4, 5], 9, 2);
    expect(p).toEqual({ rows: [5], page: 2, pageCount: 3 });
    expect(paginate([], 0, 5).pageCount).toBe(1);
  });
});

describe("DataTable", () => {
  it("renders, sorts via aria-sort and filters", async () => {
    const user = userEvent.setup();
    render(<DataTable label="People" columns={COLUMNS} rows={PEOPLE} getRowId={(p) => p.id} />);
    const table = screen.getByRole("table", { name: "People" });
    const ageHeader = within(table).getByRole("columnheader", { name: /age/i });
    expect((ageHeader).getAttribute("aria-sort")).toBe("none");
    await user.click(within(ageHeader).getByRole("button"));
    expect((ageHeader).getAttribute("aria-sort")).toBe("ascending");
    expect((within(table).getAllByRole("row")[1]).textContent).toContain("Bo");
    await user.click(within(ageHeader).getByRole("button"));
    expect((ageHeader).getAttribute("aria-sort")).toBe("descending");
    await user.type(screen.getByRole("searchbox", { name: "Filter People" }), "ada");
    expect(within(table).getAllByRole("row")).toHaveLength(2);
    expect(screen.getByText("1–1 of 1")).toBeTruthy();
  });

  it("selects rows with an indeterminate header checkbox", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DataTable label="People" columns={COLUMNS} rows={PEOPLE} getRowId={(p) => p.id} selectable onSelectedChange={onChange} />);
    const header = screen.getByRole("checkbox", { name: "Select all rows on this page" }) as HTMLInputElement;
    await user.click(screen.getByRole("checkbox", { name: "Select row b" }));
    expect(onChange).toHaveBeenLastCalledWith(["b"]);
    expect(header.indeterminate).toBe(true);
    await user.click(header);
    expect(header.checked).toBe(true);
    expect(header.indeterminate).toBe(false);
    await user.click(header);
    expect(header.checked).toBe(false);
  });

  it("pages through rows", async () => {
    const user = userEvent.setup();
    render(<DataTable label="People" columns={COLUMNS} rows={PEOPLE} getRowId={(p) => p.id} pageSize={3} />);
    expect(screen.getByText("Page 1 of 2")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(screen.getByText("4–4 of 4")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Next page" })).toHaveProperty("disabled", true);
  });
});

describe("SettingsRow", () => {
  it("renders a labelled switch that toggles", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SettingsRow title="Email alerts" description="Weekly digest" defaultChecked={false} onCheckedChange={onChange} />);
    const sw = screen.getByRole("switch", { name: "Email alerts" });
    expect((sw).getAttribute("aria-checked")).toBe("false");
    await user.click(sw);
    expect((sw).getAttribute("aria-checked")).toBe("true");
    expect(onChange).toHaveBeenCalledWith(true);
  });
  it("renders custom controls", () => {
    render(<SettingsRow title="Language"><button type="button">English</button></SettingsRow>);
    expect(screen.getByText("Language")).toBeTruthy();
    expect(screen.getByRole("button", { name: "English" })).toBeTruthy();
  });
});

describe("ApiKeyRow", () => {
  it("masks keys", () => {
    expect(maskKey("sk_test_abcdefgh1234")).toBe("sk_test_••••••••1234");
    expect(maskKey("abc")).toBe("•••");
  });
  it("reveals and regenerates", async () => {
    const user = userEvent.setup();
    const onRegenerate = vi.fn();
    const onReveal = vi.fn();
    render(<ApiKeyRow name="Server key" value="sk_test_abcdefgh1234" onRegenerate={onRegenerate} onReveal={onReveal} />);
    expect((screen.getByLabelText("Server key key")).textContent).toContain("sk_test_••••••••1234");
    await user.click(screen.getByRole("button", { name: "Reveal Server key" }));
    expect((screen.getByLabelText("Server key key")).textContent).toContain("sk_test_abcdefgh1234");
    expect(onReveal).toHaveBeenCalledWith(true);
    await user.click(screen.getByRole("button", { name: "Regenerate Server key" }));
    expect(onRegenerate).toHaveBeenCalled();
  });
  it("copies and announces", async () => {
    const user = userEvent.setup();
    const onCopy = vi.fn();
    render(<ApiKeyRow name="Server key" value="sk_test_abcdefgh1234" onCopy={onCopy} />);
    await user.click(screen.getByRole("button", { name: "Copy Server key" }));
    await waitFor(() => expect(onCopy).toHaveBeenCalledWith("sk_test_abcdefgh1234"));
    expect((screen.getByRole("status")).textContent).toContain("Copied to clipboard");
  });
});

const at = (h: number, m = 0, day = 11) => new Date(2026, 10, day, h, m);
const ev = (id: string, s: Date, e: Date): CalendarEvent => ({ id, title: id, start: s, end: e });

describe("calendar helpers", () => {
  it("finds the start of the week", () => {
    expect(startOfWeek(new Date(2026, 10, 18), 0).getDate()).toBe(15);
    expect(startOfWeek(new Date(2026, 10, 18), 1).getDate()).toBe(16);
    expect(addDays(new Date(2026, 10, 30), 1).getMonth()).toBe(11);
  });
  it("lays out overlapping events in columns", () => {
    const placed = layoutEvents([ev("a", at(9), at(11)), ev("b", at(10), at(12)), ev("c", at(10, 30), at(11, 30)), ev("d", at(13), at(14))]);
    const by = Object.fromEntries(placed.map((p) => [p.event.id, p]));
    expect(by.a).toMatchObject({ column: 0, columns: 3 });
    expect(by.b).toMatchObject({ column: 1, columns: 3 });
    expect(by.c).toMatchObject({ column: 2, columns: 3 });
    expect(by.d).toMatchObject({ column: 0, columns: 1 });
  });
  it("reuses a freed column", () => {
    const placed = layoutEvents([ev("a", at(9), at(10)), ev("b", at(9, 30), at(11)), ev("c", at(10), at(10, 45))]);
    expect(placed.find((p) => p.event.id === "c")).toMatchObject({ column: 0, columns: 2 });
  });
  it("builds month grids padded to whole weeks", () => {
    const grid = monthGrid(2026, 10, 0);
    expect(grid).toHaveLength(5);
    expect(grid.every((w) => w.length === 7)).toBe(true);
    expect(grid[0][0].getDate()).toBe(1);
    expect(grid[4][6].getDate()).toBe(5);
    expect(monthGrid(2026, 10, 1)[0][0].getDate()).toBe(26);
  });
});

describe("WeekCalendar", () => {
  it("renders events with accessible names and navigates weeks", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<WeekCalendar events={[ev("Standup", at(9), at(9, 30))]} defaultDate={new Date(2026, 10, 11)} today={new Date(2026, 10, 11)} onEventClick={onClick} />);
    await user.click(screen.getByRole("button", { name: /Standup, 9:00 AM to 9:30 AM/ }));
    expect(onClick).toHaveBeenCalled();
    expect(screen.getByRole("region", { name: "Week of Nov 8" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Next week" }));
    expect(screen.getByRole("region", { name: "Week of Nov 15" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Standup/ })).toBeNull();
  });
});

describe("MonthCalendar", () => {
  it("selects a day and moves focus with arrows", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MonthCalendar today={new Date(2026, 10, 18)} events={[ev("x", at(9, 0, 20), at(10, 0, 20))]} onValueChange={onChange} />);
    const grid = screen.getByRole("grid", { name: "November 2026" });
    expect(within(grid).getByRole("button", { name: /November 20, 2026, has events/ })).toBeTruthy();
    const today = within(grid).getByRole("button", { name: /November 18, 2026/ });
    expect((today).getAttribute("aria-current")).toBe("date");
    today.focus();
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(within(grid).getByRole("button", { name: /November 19, 2026/ }));
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(within(grid).getByRole("button", { name: /November 26, 2026/ }));
    await user.click(within(grid).getByRole("button", { name: /November 20, 2026/ }));
    expect(onChange).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Next month" }));
    expect(screen.getByRole("grid", { name: "December 2026" })).toBeTruthy();
  });
});

describe("ResizablePanels", () => {
  it("clamps sizes", () => {
    expect(clampSize(5, 15, 85)).toBe(15);
    expect(clampSize(99, 15, 85)).toBe(85);
  });
  it("resizes by keyboard with ARIA values", async () => {
    const user = userEvent.setup();
    const onSize = vi.fn();
    render(<ResizablePanels start={<p>Left</p>} end={<p>Right</p>} defaultSize={40} onSizeChange={onSize} />);
    const sep = screen.getByRole("separator", { name: "Resize panels" });
    expect((sep).getAttribute("aria-valuenow")).toBe("40");
    sep.focus();
    await user.keyboard("{ArrowRight}");
    expect((sep).getAttribute("aria-valuenow")).toBe("45");
    await user.keyboard("{End}");
    expect((sep).getAttribute("aria-valuenow")).toBe("85");
    await user.keyboard("{Home}");
    expect((sep).getAttribute("aria-valuenow")).toBe("15");
    expect(onSize).toHaveBeenLastCalledWith(15);
  });
  it("uses up/down keys when vertical", async () => {
    const user = userEvent.setup();
    render(<ResizablePanels orientation="vertical" start={<p>Top</p>} end={<p>Bottom</p>} />);
    const sep = screen.getByRole("separator");
    expect((sep).getAttribute("aria-orientation")).toBe("horizontal");
    sep.focus();
    await user.keyboard("{ArrowDown}");
    expect((sep).getAttribute("aria-valuenow")).toBe("55");
  });
  it("resizes from pointer movement", () => {
    render(<ResizablePanels start={<p>L</p>} end={<p>R</p>} />);
    const sep = screen.getByRole("separator");
    const box = sep.parentElement as HTMLElement;
    box.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 100, right: 200, bottom: 100, x: 0, y: 0, toJSON: () => ({}) });
    fireEvent.pointerDown(sep, { pointerId: 1 });
    fireEvent.pointerMove(sep, { clientX: 120 });
    expect((sep).getAttribute("aria-valuenow")).toBe("60");
    fireEvent.pointerUp(sep);
    fireEvent.pointerMove(sep, { clientX: 20 });
    expect((sep).getAttribute("aria-valuenow")).toBe("60");
  });
});

describe("SparklineTable", () => {
  it("computes paths and change", () => {
    expect(sparklinePath([1], 10, 10)).toBe("");
    expect(sparklinePath([0, 10], 100, 20, 0)).toBe("M0.0 20.0 L100.0 0.0");
    expect(seriesChange([100, 150])).toBe(50);
    expect(seriesChange([0, 5])).toBe(0);
  });
  it("renders rows with trend labels and change", () => {
    render(<SparklineTable caption="Key metrics" rows={[{ id: "1", label: "Signups", series: [10, 12, 20] }, { id: "2", label: "Churn", series: [8, 6, 4] }]} />);
    expect(screen.getByRole("table", { name: "Key metrics" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Signups trend, rising" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Churn trend, falling" })).toBeTruthy();
    expect(screen.getByText("100.0%")).toBeTruthy();
  });
});

describe("Carousel", () => {
  it("computes indexes", () => {
    expect(clampIndex(5, 3)).toBe(2);
    expect(clampIndex(-1, 3)).toBe(0);
    expect(slideIndex(310, 300, 4)).toBe(1);
    expect(slideIndex(10, 0, 4)).toBe(0);
  });
  it("navigates with buttons, dots and keys", async () => {
    const user = userEvent.setup();
    const onIndex = vi.fn();
    render(<Carousel label="Highlights" onIndexChange={onIndex}><p>One</p><p>Two</p><p>Three</p></Carousel>);
    const root = screen.getByRole("region", { name: "Highlights" });
    expect((root).getAttribute("aria-roledescription")).toBe("carousel");
    expect(screen.getAllByRole("group")).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Previous slide" })).toHaveProperty("disabled", true);
    await user.click(screen.getByRole("button", { name: "Next slide" }));
    expect((screen.getByRole("button", { name: "Go to slide 2" })).getAttribute("aria-current")).toBe("true");
    await user.click(screen.getByRole("button", { name: "Go to slide 3" }));
    expect(screen.getByRole("button", { name: "Next slide" })).toHaveProperty("disabled", true);
    fireEvent.keyDown(root, { key: "ArrowLeft" });
    expect(onIndex).toHaveBeenLastCalledWith(1);
  });
});

const FILES: FileNode[] = [
  { id: "z", name: "zeta.txt", size: 2048 },
  { id: "docs", name: "Docs", children: [{ id: "r", name: "report.pdf", size: 1_500_000 }, { id: "sub", name: "Archive", children: [] }] },
  { id: "img", name: "photo.png", size: 4096 },
];

describe("FileManager", () => {
  it("sorts folders first and resolves paths", () => {
    expect(sortNodes(FILES).map((n) => n.id)).toEqual(["docs", "img", "z"]);
    expect(resolvePath(FILES, ["docs", "sub"]).trail.map((n) => n.id)).toEqual(["docs", "sub"]);
    expect(resolvePath(FILES, ["docs", "nope"]).items.map((n) => n.id)).toEqual(["sub", "r"]);
    expect(resolvePath(FILES, ["z"]).trail).toHaveLength(0);
  });
  it("opens folders, goes up with breadcrumbs, and opens files", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(<FileManager items={FILES} onOpenFile={onOpen} />);
    const list = screen.getByRole("listbox", { name: "All files" });
    list.focus();
    await user.keyboard("{ArrowDown}{Enter}");
    expect(screen.getByRole("listbox", { name: "Docs" })).toBeTruthy();
    expect((screen.getByRole("button", { name: "Docs" })).getAttribute("aria-current")).toBe("page");
    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: "r" }));
    await user.keyboard("{Backspace}");
    expect(screen.getByRole("listbox", { name: "All files" })).toBeTruthy();
    await user.dblClick(screen.getByRole("option", { name: /Docs/ }));
    await user.click(screen.getByRole("button", { name: "All files" }));
    expect(screen.getByRole("option", { name: /photo\.png/ })).toBeTruthy();
  });
});

describe("CohortTable", () => {
  it("formats and tints", () => {
    expect(formatPercent(0.456)).toBe("46%");
    expect(cellTint(2)).toBe(cellTint(1));
    expect(cellTint(0.5)).toContain("43%");
  });
  it("renders a row per cohort with period headers", () => {
    render(<CohortTable rows={[{ label: "Oct 6", size: 1200, values: [1, 0.6, 0.4] }, { label: "Oct 13", size: 900, values: [1, 0.5] }]} />);
    expect(screen.getByRole("table", { name: "Cohort retention" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Week 2" })).toBeTruthy();
    expect(screen.getByRole("rowheader", { name: "Oct 6" })).toBeTruthy();
    expect(screen.getByText("1,200")).toBeTruthy();
    expect(screen.getAllByText("100%")).toHaveLength(2);
  });
});

const TREE: OrgNode = {
  id: "ceo", name: "Ava Stone", title: "CEO",
  children: [
    { id: "a", name: "Ben Lake", title: "Eng", children: [{ id: "a1", name: "Cam Fox", title: "Dev" }, { id: "a2", name: "Dee Ray", title: "Dev" }] },
    { id: "b", name: "Eli Moss", title: "Ops" },
  ],
};
const OPTS = { nodeWidth: 100, nodeHeight: 40, gapX: 20, gapY: 30 };

describe("OrgChart", () => {
  it("lays out leaves in order with parents centred", () => {
    const { nodes, links, width, height } = layoutTree(TREE, OPTS);
    const pos = Object.fromEntries(nodes.map((n) => [n.node.id, n]));
    expect(pos.a1.x).toBe(0);
    expect(pos.a2.x).toBe(120);
    expect(pos.b.x).toBe(240);
    expect(pos.a.x).toBe(60);
    expect(pos.ceo.x).toBe(150);
    expect(pos.a1.y).toBe(2 * 70);
    expect(links).toHaveLength(4);
    expect(width).toBe(340);
    expect(height).toBe(180);
  });
  it("handles a single node", () => {
    expect(layoutTree({ id: "x", name: "X", title: "T" }, OPTS)).toMatchObject({ width: 100, height: 40 });
  });
  it("renders every person as a tree item", () => {
    render(<OrgChart root={TREE} />);
    expect(screen.getByRole("tree", { name: "Organization chart" })).toBeTruthy();
    expect(screen.getAllByRole("treeitem")).toHaveLength(5);
    expect(screen.getByText("Cam Fox")).toBeTruthy();
  });
});

const d = (m: number, day: number) => new Date(2026, m, day);

describe("gantt", () => {
  it("computes day spans and bar geometry", () => {
    expect(daysBetween(d(10, 1), d(10, 11))).toBe(10);
    expect(barGeometry(d(10, 1), d(10, 5), d(10, 1), d(10, 10))).toEqual({ left: 0, width: 50 });
    expect(barGeometry(d(10, 6), d(10, 10), d(10, 1), d(10, 10))).toEqual({ left: 50, width: 50 });
    expect(barGeometry(d(9, 20), d(10, 3), d(10, 1), d(10, 10))).toEqual({ left: 0, width: 30 });
    expect(barGeometry(d(11, 1), d(11, 5), d(10, 1), d(10, 10)).width).toBe(0);
  });
  it("finds the task range", () => {
    const range = taskRange([{ id: "1", label: "a", start: d(10, 3), end: d(10, 8) }, { id: "2", label: "b", start: d(10, 1), end: d(10, 4) }]);
    expect(range.start).toEqual(d(10, 1));
    expect(range.end).toEqual(d(10, 8));
  });
  it("renders a row bar with an accessible description", () => {
    render(<GanttRow label="Design" start={d(10, 1)} end={d(10, 5)} rangeStart={d(10, 1)} rangeEnd={d(10, 10)} progress={0.4} />);
    expect(screen.getByRole("rowheader", { name: "Design" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Design: Nov 1 to Nov 5, 40% complete" })).toBeTruthy();
  });
  it("renders the chart with a today line only when in range", () => {
    const tasks = [{ id: "1", label: "Design", start: d(10, 1), end: d(10, 10) }, { id: "2", label: "Build", start: d(10, 8), end: d(10, 28) }];
    const { rerender } = render(<GanttChart tasks={tasks} today={d(10, 12)} />);
    expect(screen.getByRole("table", { name: "Project timeline" })).toBeTruthy();
    expect(screen.getByRole("img", { name: /Build: Nov 8 to Nov 28/ })).toBeTruthy();
    expect(screen.getByTestId("today-line")).toBeTruthy();
    rerender(<GanttChart tasks={tasks} today={d(11, 20)} />);
    expect(screen.queryByTestId("today-line")).toBeNull();
  });
});

describe("CycleCard", () => {
  const start = d(10, 3);
  const end = d(10, 17);
  it("derives status, days left and shares", () => {
    expect(cycleStatus(start, end, d(10, 1))).toBe("upcoming");
    expect(cycleStatus(start, end, d(10, 10))).toBe("active");
    expect(cycleStatus(start, end, d(10, 20))).toBe("completed");
    expect(daysLeft(end, d(10, 14))).toBe(3);
    expect(daysLeft(end, d(10, 30))).toBe(0);
    expect(scopeShares({ completed: 5, started: 20, total: 10 })).toEqual({ done: 0.5, doing: 0.5 });
    expect(scopeShares({ completed: 0, started: 0, total: 0 })).toEqual({ done: 0, doing: 0 });
  });
  it("renders progress and status", () => {
    render(<CycleCard name="Cycle" number={7} start={start} end={end} total={20} started={5} completed={10} now={d(10, 10)} />);
    expect(screen.getByRole("article", { name: "Cycle" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Cycle 7" })).toBeTruthy();
    expect((screen.getByRole("progressbar", { name: "Cycle progress" })).getAttribute("aria-valuenow")).toBe("50");
    expect(screen.getByText("active")).toBeTruthy();
    expect(screen.getByText(/7 days left/)).toBeTruthy();
  });
});

describe("IntegrationCard", () => {
  it("shows pending then toggles to connected", async () => {
    const user = userEvent.setup();
    let release = () => {};
    const onConnect = vi.fn(() => new Promise<void>((r) => { release = r; }));
    render(<IntegrationCard name="Chat Sync" description="Post updates" icon={<span>C</span>} onConnect={onConnect} />);
    const button = screen.getByRole("button", { name: "Connect Chat Sync" });
    await user.click(button);
    expect(button).toHaveProperty("disabled", true);
    expect((button).getAttribute("aria-busy")).toBe("true");
    release();
    await waitFor(() => expect(screen.getByRole("button", { name: "Disconnect Chat Sync" })).toHaveProperty("disabled", false));
    expect(screen.getByText("Connected")).toBeTruthy();
  });
  it("respects a controlled connected prop", async () => {
    const user = userEvent.setup();
    const onDisconnect = vi.fn();
    render(<IntegrationCard name="Chat Sync" description="Post" icon="C" connected onDisconnect={onDisconnect} />);
    await user.click(screen.getByRole("button", { name: "Disconnect Chat Sync" }));
    await waitFor(() => expect(onDisconnect).toHaveBeenCalled());
    expect(screen.getByText("Connected")).toBeTruthy();
  });
});

describe("SwipeRow", () => {
  it("decides snap by distance and velocity", () => {
    expect(shouldOpen(-100, 0, 160)).toBe(true);
    expect(shouldOpen(-40, 0, 160)).toBe(false);
    expect(shouldOpen(-10, -800, 160)).toBe(true);
    expect(shouldOpen(-150, 800, 160)).toBe(false);
  });
  it("opens with arrow keys and runs actions", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const onOpen = vi.fn();
    render(<SwipeRow onOpenChange={onOpen} actions={[{ id: "del", label: "Delete", tone: "danger", onSelect: onDelete }]}><span>Invoice 42</span></SwipeRow>);
    const row = screen.getByRole("group", { name: /Row, swipe left/ });
    expect((row).getAttribute("aria-expanded")).toBe("false");
    expect((screen.getByRole("button", { name: "Delete", hidden: true })).getAttribute("tabindex")).toBe("-1");
    row.focus();
    await user.keyboard("{ArrowLeft}");
    expect((row).getAttribute("aria-expanded")).toBe("true");
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalled();
    expect((row).getAttribute("aria-expanded")).toBe("false");
    expect(onOpen).toHaveBeenLastCalledWith(false);
  });
});

describe("TestimonialCard", () => {
  it("builds initials", () => {
    expect(initials("ada lovelace byron")).toBe("AL");
    expect(initials("Bo")).toBe("B");
  });
  it("renders quote, author and rating", () => {
    render(<TestimonialCard quote="Saved us hours." author="Maya Chen" role="Head of Ops" rating={4} />);
    expect(screen.getByText(/Saved us hours/)).toBeTruthy();
    expect(screen.getByText("Maya Chen")).toBeTruthy();
    expect(screen.getByRole("img", { name: "Rated 4 out of 5" })).toBeTruthy();
    expect(screen.getByText("MC")).toBeTruthy();
  });
});

describe("FaqList", () => {
  const items = [{ id: "a", question: "What is it?", answer: "A kit." }, { id: "b", question: "Is it free?", answer: "Yes." }];
  it("toggles ids", () => {
    expect(toggleOpen([], "a", false)).toEqual(["a"]);
    expect(toggleOpen(["a"], "b", false)).toEqual(["b"]);
    expect(toggleOpen(["a"], "b", true)).toEqual(["a", "b"]);
    expect(toggleOpen(["a", "b"], "a", true)).toEqual(["b"]);
  });
  it("expands one answer at a time with aria-expanded and regions", async () => {
    const user = userEvent.setup();
    render(<FaqList items={items} />);
    const first = screen.getByRole("button", { name: "What is it?" });
    const second = screen.getByRole("button", { name: "Is it free?" });
    expect((first).getAttribute("aria-expanded")).toBe("false");
    await user.click(first);
    expect((first).getAttribute("aria-expanded")).toBe("true");
    expect((screen.getByRole("region", { name: "What is it?" })).textContent).toContain("A kit.");
    await user.click(second);
    expect((first).getAttribute("aria-expanded")).toBe("false");
    expect((second).getAttribute("aria-expanded")).toBe("true");
  });
});

describe("FeatureGrid", () => {
  it("renders each feature", () => {
    render(<FeatureGrid features={[{ id: "1", icon: "*", title: "Fast", description: "Quick." }, { id: "2", icon: "+", title: "Safe", description: "Secure." }]} columns={2} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByRole("heading", { name: "Safe" })).toBeTruthy();
  });
});

describe("StepsCard", () => {
  it("maps step states", () => {
    expect(stepState(0, 1)).toBe("done");
    expect(stepState(1, 1)).toBe("current");
    expect(stepState(2, 1)).toBe("upcoming");
  });
  it("marks the current step and completed steps", () => {
    render(<StepsCard title="Get started" current={1} steps={[{ title: "Create account" }, { title: "Add data", description: "Import a file." }, { title: "Share" }]} />);
    expect(screen.getByRole("region", { name: "Get started" })).toBeTruthy();
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect((items[1]).getAttribute("aria-current")).toBe("step");
    expect((items[0]).textContent).toContain("(completed)");
    expect(screen.getByText("Import a file.")).toBeTruthy();
  });
});
