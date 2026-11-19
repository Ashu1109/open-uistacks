import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  areaPath, arcPath, bandPath, boxStats, clamp, extent, formatCurrency, formatNumber, formatPercent, levelColor, linePath, linearScale,
  niceTicks, orthographic, pointerIndex, polar, quantile, quantizeLevel, sankeyLayout, stackSeries, stepGrid, stepIndex, treemapLayout,
  useChartWidth, waterfallTotals, worldDots, withNumber, CountUp, type Point,
} from "./ui/chart-utils";
import { ForecastChart } from "./ui/forecast-chart";
import { ActivityHeatmap, buildHeatmapGrid, formatDay } from "./ui/activity-heatmap";
import { Treemap } from "./ui/treemap";
import { BulletChart, bulletStatus } from "./ui/bullet-chart";
import { Candlestick, candleChange } from "./ui/candlestick";
import { ScatterPlot, nearestPoint } from "./ui/scatter-plot";
import { WaffleChart, waffleCells } from "./ui/waffle-chart";
import { DotGlobe } from "./ui/dot-globe";
import { DotMap, projectMap } from "./ui/dot-map";
import { ThresholdGauge, gaugeAngle, zoneFor } from "./ui/threshold-gauge";
import { PortfolioChart, periodChange } from "./ui/portfolio-chart";
import { SinceLastVisit, deltaSince } from "./ui/since-last-visit";
import { UptimeBars, uptimePercent, type UptimeDay } from "./ui/uptime-bars";
import { FunnelChart, funnelRates } from "./ui/funnel-chart";
import { RadarChart, radarPoints } from "./ui/radar-chart";
import { StackedArea } from "./ui/stacked-area";
import { HourHeatmap, formatHour, peakCell } from "./ui/hour-heatmap";
import { WaterfallChart } from "./ui/waterfall-chart";
import { SankeyChart } from "./ui/sankey-chart";
import { AnnotatedLine } from "./ui/annotated-line";
import { BoxPlot } from "./ui/box-plot";
import { MultiLine } from "./ui/multi-line";

afterEach(cleanup);

const live = (container: HTMLElement) => container.querySelector("[aria-live]")?.textContent ?? "";
const LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

describe("scales and ticks", () => {
  it("maps linearly and inverts", () => {
    const s = linearScale([0, 10], [100, 0]);
    expect(s(0)).toBe(100);
    expect(s(5)).toBe(50);
    expect(s.invert(25)).toBe(7.5);
    expect(linearScale([3, 3], [0, 10])(3)).toBe(5);
  });

  it("finds extents and clamps", () => {
    expect(extent([3, -1, 7, NaN])).toEqual([-1, 7]);
    expect(extent([])).toEqual([0, 0]);
    expect(clamp(5, 0, 3)).toBe(3);
  });

  it("builds nice ticks covering the range", () => {
    expect(niceTicks(0, 100, 5)).toEqual([0, 20, 40, 60, 80, 100]);
    expect(niceTicks(3, 97, 5)).toEqual([0, 20, 40, 60, 80, 100]);
    expect(niceTicks(0.1, 0.9, 4)).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1]);
    const flat = niceTicks(5, 5);
    expect(flat[0]).toBeLessThan(5);
    expect(flat[flat.length - 1]).toBeGreaterThan(5);
    expect(niceTicks(NaN, 1)).toEqual([]);
  });
});

describe("formatting", () => {
  it("compacts numbers", () => {
    expect(formatNumber(950)).toBe("950");
    expect(formatNumber(12_400)).toBe("12.4k");
    expect(formatNumber(999_950)).toBe("1M");
    expect(formatNumber(1_240_000)).toBe("1.24M");
    expect(formatNumber(-2500)).toBe("-2.5k");
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(Infinity)).toBe("–");
  });

  it("formats currency and percent", () => {
    expect(formatCurrency(1234.5)).toBe("$1,234.50");
    expect(formatCurrency(1234.5, 0)).toBe("$1,235");
    expect(formatPercent(0.256)).toBe("26%");
    expect(formatPercent(0.256, 1)).toBe("25.6%");
  });
});

describe("paths", () => {
  const pts: Point[] = [{ x: 0, y: 10 }, { x: 10, y: 0 }, { x: 20, y: 5 }];

  it("builds straight and empty paths", () => {
    expect(linePath(pts)).toBe("M0,10L10,0L20,5");
    expect(linePath([])).toBe("");
    expect(linePath([pts[0]])).toBe("M0,10");
  });

  it("smooths with a monotone curve that never overshoots", () => {
    const d = linePath(pts, true);
    expect(d.startsWith("M0,10C")).toBe(true);
    const nums = d.match(/-?\d+(\.\d+)?/g)!.map(Number);
    const ys = nums.filter((_, i) => i % 2 === 1);
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...ys)).toBeLessThanOrEqual(10);
  });

  it("closes areas and bands", () => {
    expect(areaPath(pts, 20)).toBe("M0,10L10,0L20,5L20,20L0,20Z");
    expect(areaPath([], 20)).toBe("");
    const band = bandPath([{ x: 0, y: 0 }, { x: 10, y: 0 }], [{ x: 0, y: 5 }, { x: 10, y: 5 }]);
    expect(band).toBe("M0,0L10,0L10,5L0,5Z");
  });
});

describe("stackSeries", () => {
  it("offsets each layer on the one below", () => {
    const layers = stackSeries([[1, 2], [3, 4]]);
    expect(layers[0]).toEqual([{ y0: 0, y1: 1 }, { y0: 0, y1: 2 }]);
    expect(layers[1]).toEqual([{ y0: 1, y1: 4 }, { y0: 2, y1: 6 }]);
  });

  it("normalises columns to one and treats negatives as zero", () => {
    const layers = stackSeries([[1, 0], [3, 0]], true);
    expect(layers[1][0].y1).toBe(1);
    expect(layers[0][1]).toEqual({ y0: 0, y1: 0 });
    expect(stackSeries([[-5], [5]])[1][0]).toEqual({ y0: 0, y1: 5 });
  });
});

describe("waterfallTotals", () => {
  it("keeps a running total with subtotal bars", () => {
    const bars = waterfallTotals([
      { label: "Start", value: 100, total: true },
      { label: "Add", value: 30 },
      { label: "Cut", value: -50 },
      { label: "End", value: 0, total: true },
    ]);
    expect(bars.map((b) => [b.start, b.end, b.kind])).toEqual([[0, 100, "total"], [100, 130, "up"], [130, 80, "down"], [0, 80, "total"]]);
  });
});

describe("box statistics", () => {
  it("interpolates quantiles", () => {
    expect(quantile([1, 2, 3, 4], 0.5)).toBe(2.5);
    expect(Number.isNaN(quantile([], 0.5))).toBe(true);
  });

  it("applies Tukey fences", () => {
    const s = boxStats([1, 2, 3, 4, 5, 6, 7, 8, 9, 100])!;
    expect(s.q1).toBe(3.25);
    expect(s.median).toBe(5.5);
    expect(s.q3).toBe(7.75);
    expect(s.whiskerHigh).toBe(9);
    expect(s.whiskerLow).toBe(1);
    expect(s.outliers).toEqual([100]);
    expect(boxStats([])).toBeNull();
    expect(boxStats([4])!.median).toBe(4);
  });
});

describe("treemapLayout", () => {
  const items = [{ value: 6 }, { value: 6 }, { value: 4 }, { value: 3 }, { value: 2 }, { value: 2 }, { value: 1 }];
  const bounds = { x: 0, y: 0, w: 600, h: 400 };
  const tiles = treemapLayout(items, bounds);

  it("fills the bounds with areas proportional to value", () => {
    const total = items.reduce((s, i) => s + i.value, 0);
    tiles.forEach((t) => expect((t.w * t.h) / (600 * 400)).toBeCloseTo(t.item.value / total, 6));
    expect(tiles.reduce((s, t) => s + t.w * t.h, 0)).toBeCloseTo(600 * 400, 4);
  });

  it("stays inside the bounds and drops empty items", () => {
    tiles.forEach((t) => {
      expect(t.x).toBeGreaterThanOrEqual(-1e-6);
      expect(t.y).toBeGreaterThanOrEqual(-1e-6);
      expect(t.x + t.w).toBeLessThanOrEqual(600 + 1e-6);
      expect(t.y + t.h).toBeLessThanOrEqual(400 + 1e-6);
    });
    expect(treemapLayout([{ value: 0 }, { value: -2 }], bounds)).toEqual([]);
    expect(treemapLayout([{ value: 1 }, { value: 0 }], bounds)).toHaveLength(1);
  });

  it("keeps tiles roughly square", () => {
    tiles.forEach((t) => expect(Math.max(t.w / t.h, t.h / t.w)).toBeLessThan(4));
  });
});

describe("sankeyLayout", () => {
  const nodes = [{ id: "a" }, { id: "b" }, { id: "c", label: "Cee" }, { id: "d" }];
  const links = [{ source: "a", target: "b", value: 5 }, { source: "a", target: "c", value: 3 }, { source: "b", target: "d", value: 5 }];
  const out = sankeyLayout(nodes, links, { width: 600, height: 300 });
  const node = (id: string) => out.nodes.find((n) => n.id === id)!;

  it("assigns columns by longest path", () => {
    expect([node("a").column, node("b").column, node("c").column, node("d").column]).toEqual([0, 1, 1, 2]);
    expect(node("c").label).toBe("Cee");
    expect(node("a").x).toBe(0);
    expect(node("d").x + node("d").w).toBe(600);
  });

  it("sizes nodes and ribbons on one scale", () => {
    const fromA = out.links.filter((l) => l.source === "a").reduce((s, l) => s + l.width, 0);
    expect(fromA).toBeCloseTo(node("a").h, 6);
    const width = (target: string) => out.links.find((l) => l.source === "a" && l.target === target)!.width;
    expect(width("b") / width("c")).toBeCloseTo(5 / 3, 6);
    out.nodes.forEach((n) => expect(n.y + n.h).toBeLessThanOrEqual(300 + 1e-6));
    expect(out.links.every((l) => l.path.startsWith("M"))).toBe(true);
  });

  it("ignores invalid links and survives cycles", () => {
    const bad = sankeyLayout([{ id: "x" }, { id: "y" }], [{ source: "x", target: "y", value: 1 }, { source: "y", target: "x", value: 1 }, { source: "x", target: "x", value: 2 }, { source: "x", target: "nope", value: 2 }, { source: "x", target: "y", value: 0 }], { width: 100, height: 100 });
    expect(bad.nodes).toHaveLength(2);
    expect(bad.links.length).toBeGreaterThanOrEqual(1);
    expect(sankeyLayout([], [], { width: 100, height: 100 })).toEqual({ nodes: [], links: [] });
  });
});

describe("geometry helpers", () => {
  it("converts polar coordinates with zero at the top", () => {
    const top = polar(50, 50, 10, 0);
    expect(top.x).toBeCloseTo(50);
    expect(top.y).toBeCloseTo(40);
    expect(polar(50, 50, 10, 90).x).toBeCloseTo(60);
    expect(arcPath(50, 50, 10, -90, 90)).toBe("M40,50A10,10 0 0 1 60,50");
    expect(arcPath(50, 50, 10, 0, 270)).toContain("0 1 1");
  });

  it("projects orthographically", () => {
    const front = orthographic(0, 0, 0, 0);
    expect(front.x).toBeCloseTo(0);
    expect(front.z).toBeCloseTo(1);
    expect(orthographic(0, 90, 0, 0).x).toBeCloseTo(1);
    expect(orthographic(0, 180, 0, 0).z).toBeCloseTo(-1);
    expect(orthographic(0, 90, 90, 0).z).toBeCloseTo(1);
  });

  it("quantises intensity", () => {
    expect(quantizeLevel(0, 10)).toBe(0);
    expect(quantizeLevel(1, 10)).toBe(1);
    expect(quantizeLevel(10, 10)).toBe(4);
    expect(quantizeLevel(5, 0)).toBe(0);
    expect(levelColor(0)).toBe("var(--track)");
    expect(levelColor(4)).toContain("100%");
  });

  it("generates an invented land mask", () => {
    const dots = worldDots(5);
    expect(dots.length).toBeGreaterThan(300);
    expect(dots.every((d) => Math.abs(d.lat) < 90 && Math.abs(d.lon) < 180)).toBe(true);
    expect(worldDots(10).length).toBeLessThan(dots.length);
  });
});

describe("keyboard and pointer helpers", () => {
  it("steps through indexes", () => {
    expect(stepIndex(null, "ArrowRight", 5)).toBe(0);
    expect(stepIndex(2, "ArrowRight", 5)).toBe(3);
    expect(stepIndex(4, "ArrowRight", 5)).toBe(4);
    expect(stepIndex(0, "ArrowLeft", 5)).toBe(0);
    expect(stepIndex(2, "Home", 5)).toBe(0);
    expect(stepIndex(2, "End", 5)).toBe(4);
    expect(stepIndex(2, "Escape", 5)).toBe("clear");
    expect(stepIndex(2, "a", 5)).toBeNull();
    expect(stepIndex(null, "ArrowRight", 0)).toBeNull();
  });

  it("steps across a grid", () => {
    expect(stepGrid(null, "ArrowDown", 3, 3)).toEqual({ row: 0, col: 0 });
    expect(stepGrid({ row: 0, col: 0 }, "ArrowDown", 3, 3)).toEqual({ row: 1, col: 0 });
    expect(stepGrid({ row: 2, col: 2 }, "ArrowRight", 3, 3)).toEqual({ row: 2, col: 2 });
    expect(stepGrid({ row: 1, col: 1 }, "x", 3, 3)).toBeNull();
  });

  it("maps a pointer to the nearest index", () => {
    const e = (x: number) => ({ clientX: x, currentTarget: { getBoundingClientRect: () => ({ left: 0, width: 200 }) } });
    expect(pointerIndex(e(100), 5, 0, 100, 100)).toBe(2);
    expect(pointerIndex(e(500), 5, 0, 100, 100)).toBe(4);
    expect(pointerIndex(e(0), 5, 0, 100, 100)).toBe(0);
    expect(pointerIndex(e(10), 1, 0, 100, 100)).toBe(0);
    expect(pointerIndex({ clientX: 5, currentTarget: { getBoundingClientRect: () => ({ left: 0, width: 0 }) } }, 5, 0, 100, 100)).toBeNull();
  });
});

describe("ForecastChart", () => {
  it("renders a summary and reads actual versus forecast points by keyboard", async () => {
    const user = userEvent.setup();
    const { container } = render(<ForecastChart actual={[10, 12, 14]} forecast={[16, 18]} band={[[14, 18], [15, 21]]} labels={["a", "b", "c", "d", "e"]} />);
    const chart = screen.getByRole("img", { name: /Forecast chart: 3 actual and 2 forecast/ });
    await user.click(chart.parentElement!);
    chart.focus();
    await user.keyboard("{End}");
    expect(live(container)).toBe("e, forecast 18");
    await user.keyboard("{Home}");
    expect(live(container)).toBe("a, actual 10");
    await user.keyboard("{Escape}");
    expect(live(container)).toBe("");
  });
});

describe("MultiLine", () => {
  const series = [{ name: "Alpha", values: [1, 3, 2, 5, 4] }, { name: "Beta", values: [2, 2, 3, 3, 6] }];

  it("reads every series at the active point", async () => {
    const user = userEvent.setup();
    const { container } = render(<MultiLine series={series} labels={LABELS} />);
    screen.getByRole("img", { name: /2 series over 5 points: Alpha, Beta/ }).focus();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(live(container)).toBe("Tue: Alpha 3, Beta 2");
  });

  it("toggles a series from the legend", async () => {
    const user = userEvent.setup();
    const { container } = render(<MultiLine series={series} labels={LABELS} />);
    const btn = screen.getByRole("button", { name: "Alpha" });
    expect(btn.getAttribute("aria-pressed")).toBe("true");
    expect(container.querySelectorAll("svg path")).toHaveLength(2);
    await user.click(btn);
    expect(btn.getAttribute("aria-pressed")).toBe("false");
    expect(container.querySelectorAll("svg path")).toHaveLength(1);
  });
});

describe("AnnotatedLine", () => {
  it("exposes annotations as buttons and reads the note on focus", async () => {
    const user = userEvent.setup();
    const { container } = render(<AnnotatedLine values={[3, 4, 9, 7, 8]} labels={LABELS} annotations={[{ index: 2, title: "Launch", note: "v2 shipped", tone: "success" }, { index: 9, title: "Off chart" }]} />);
    const marker = screen.getByRole("button", { name: "Event 1: Launch. v2 shipped" });
    expect(screen.queryByRole("button", { name: /Off chart/ })).toBeNull();
    await user.tab();
    await user.tab();
    expect(document.activeElement).toBe(marker);
    expect(live(container)).toContain("Launch");
  });
});

describe("StackedArea", () => {
  it("lists each layer with its share", async () => {
    const user = userEvent.setup();
    const { container } = render(<StackedArea series={[{ name: "Web", values: [1, 2, 3] }, { name: "App", values: [3, 2, 1] }]} labels={["Jan", "Feb", "Mar"]} />);
    screen.getByRole("img", { name: /Stacked area chart of Web, App/ }).focus();
    await user.keyboard("{ArrowRight}");
    expect(live(container)).toBe("Jan: Web 1, App 3");
    expect(screen.getAllByText("Web").length).toBeGreaterThan(0);
  });

  it("describes a normalised chart", () => {
    render(<StackedArea normalize series={[{ name: "A", values: [1, 1] }]} labels={["x", "y"]} />);
    expect(screen.getByRole("img", { name: /as shares of the total/ })).toBeTruthy();
  });
});

describe("PortfolioChart", () => {
  const ranges = [{ id: "1w", label: "1W", values: [100, 110, 105, 120] }, { id: "1m", label: "1M", values: [200, 180, 150] }];

  it("computes period change", () => {
    expect(periodChange([100, 125])).toEqual({ abs: 25, pct: 0.25 });
    expect(periodChange([100, 125, 50], 1).abs).toBe(25);
    expect(periodChange([])).toEqual({ abs: 0, pct: 0 });
    expect(periodChange([0, 5]).pct).toBe(0);
  });

  it("shows the headline and switches range", async () => {
    const user = userEvent.setup();
    const onRangeChange = vi.fn();
    render(<PortfolioChart ranges={ranges} onRangeChange={onRangeChange} />);
    expect(screen.getByText("$120.00")).toBeTruthy();
    expect(screen.getByRole("button", { name: "1W" }).getAttribute("aria-pressed")).toBe("true");
    await user.click(screen.getByRole("button", { name: "1M" }));
    expect(onRangeChange).toHaveBeenCalledWith("1m");
    expect(screen.getByText("$150.00")).toBeTruthy();
    expect(screen.getByText(/−\$50\.00 \(−25\.00%\)/)).toBeTruthy();
  });

  it("scrubs the headline with the keyboard", async () => {
    const user = userEvent.setup();
    render(<PortfolioChart ranges={ranges} />);
    screen.getByRole("img", { name: /Portfolio value over 1W/ }).focus();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(screen.getAllByText("$110.00").length).toBeGreaterThan(0);
  });
});

describe("Candlestick", () => {
  const data = [{ label: "D1", open: 10, high: 14, low: 9, close: 13 }, { label: "D2", open: 13, high: 15, low: 8, close: 9 }];

  it("computes the period change", () => {
    expect(candleChange(data[0])).toBeCloseTo(0.3);
    expect(candleChange({ label: "z", open: 0, high: 1, low: 0, close: 1 })).toBe(0);
  });

  it("reads OHLC by keyboard", async () => {
    const user = userEvent.setup();
    const { container } = render(<Candlestick data={data} />);
    screen.getByRole("img", { name: /Candlestick chart of 2 periods/ }).focus();
    await user.keyboard("{End}");
    expect(live(container)).toBe("D2: open 13, high 15, low 8, close 9");
  });
});

describe("WaterfallChart", () => {
  it("labels every bar and reads it on focus", async () => {
    const user = userEvent.setup();
    const { container } = render(<WaterfallChart steps={[{ label: "Revenue", value: 100, total: true }, { label: "Costs", value: -40 }, { label: "Profit", value: 0, total: true }]} />);
    expect(screen.getByRole("group", { name: /ending at 60/ })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Costs: −40, running total 60" })).toBeTruthy();
    await user.tab();
    await user.tab();
    expect(live(container)).toBe("Costs: −40");
  });
});

describe("ScatterPlot", () => {
  const points = [{ x: 3, y: 4, group: "A", label: "p3" }, { x: 1, y: 2, group: "B", label: "p1" }, { x: 2, y: 9, group: "A", label: "p2" }];

  it("finds the nearest point within range", () => {
    const pts = [{ x: 0, y: 0 }, { x: 10, y: 10 }];
    expect(nearestPoint(pts, 9, 9, 5)).toBe(1);
    expect(nearestPoint(pts, 5, 5, 3)).toBeNull();
  });

  it("walks points left to right and shows the legend", async () => {
    const user = userEvent.setup();
    const { container } = render(<ScatterPlot points={points} xLabel="Speed" yLabel="Cost" />);
    expect(screen.getByRole("img", { name: /Scatter plot of 3 points, Cost against Speed/ })).toBeTruthy();
    expect(screen.getByText("B")).toBeTruthy();
    screen.getByRole("img", { name: /Scatter plot/ }).focus();
    await user.keyboard("{ArrowRight}");
    expect(live(container)).toBe("p1: Speed 1, Cost 2, B");
  });
});

describe("BoxPlot", () => {
  it("describes each group's statistics", async () => {
    const user = userEvent.setup();
    const { container } = render(<BoxPlot groups={[{ label: "Alpha", values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 100] }, { label: "Empty", values: [] }]} />);
    const g = screen.getByRole("img", { name: /Alpha: median 5\.5, quartiles 3\.25 to 7\.75, whiskers 1 to 9, 1 outliers/ });
    expect(screen.queryByRole("img", { name: /Empty/ })).toBeNull();
    await user.tab();
    expect(document.activeElement).toBe(g);
    expect(live(container)).toContain("median 5.5");
  });
});

describe("FunnelChart", () => {
  const stages = [{ label: "Visit", value: 1000 }, { label: "Sign up", value: 400 }, { label: "Pay", value: 100 }];

  it("computes conversion rates", () => {
    expect(funnelRates(stages)).toEqual([{ ofTop: 1, ofPrevious: 1 }, { ofTop: 0.4, ofPrevious: 0.4 }, { ofTop: 0.1, ofPrevious: 0.25 }]);
    expect(funnelRates([{ label: "x", value: 0 }, { label: "y", value: 0 }])[1]).toEqual({ ofTop: 0, ofPrevious: 0 });
  });

  it("labels stages with both rates", () => {
    render(<FunnelChart stages={stages} />);
    expect(screen.getByRole("group", { name: /3 stages, 10\.0% reaching/ })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Pay: 100, 10.0% of the first stage, 25.0% of the previous stage" })).toBeTruthy();
  });
});

describe("RadarChart", () => {
  it("places vertices around the centre", () => {
    const pts = radarPoints([10, 5], 10, 50, 50, 40);
    expect(pts[0].x).toBeCloseTo(50);
    expect(pts[0].y).toBeCloseTo(10);
    expect(pts[1].y).toBeCloseTo(70);
    expect(radarPoints([99], 10, 0, 0, 10)[0].y).toBeCloseTo(-10);
    expect(radarPoints([], 10, 0, 0, 10)).toEqual([]);
  });

  it("names vertices and lists series", async () => {
    const user = userEvent.setup();
    const { container } = render(<RadarChart axes={["Speed", "Power", "Range"]} series={[{ name: "Alpha", values: [3, 4, 5] }, { name: "Beta", values: [5, 2, 1] }]} />);
    expect(screen.getByRole("img", { name: "Alpha, Speed: 3" })).toBeTruthy();
    expect(screen.getByText("Beta")).toBeTruthy();
    await user.tab();
    expect(live(container)).toBe("Alpha, Speed: 3");
  });
});

describe("heatmaps", () => {
  it("builds a Sunday-first calendar grid ending at the end date", () => {
    const grid = buildHeatmapGrid([{ date: "2026-03-04", count: 7 }], 2, "2026-03-04");
    expect(grid).toHaveLength(2);
    expect(grid[0][0]?.date).toBe("2026-02-22");
    expect(grid[1][0]?.date).toBe("2026-03-01");
    expect(grid[1][3]).toEqual({ date: "2026-03-04", count: 7 });
    expect(grid[1][4]).toBeNull();
    expect(formatDay("2026-03-04")).toBe("Mar 4, 2026");
  });

  it("reads an activity day by keyboard", async () => {
    const user = userEvent.setup();
    const { container } = render(<ActivityHeatmap data={[{ date: "2026-03-04", count: 7 }]} weeks={3} endDate="2026-03-04" unit="commits" />);
    const chart = screen.getByRole("img", { name: /Activity heatmap: 7 commits over 3 weeks ending Mar 4, 2026/ });
    chart.focus();
    await user.keyboard("{ArrowDown}");
    expect(live(container)).toBe("Feb 15, 2026: 0 commits");
    await user.keyboard("{ArrowRight}{ArrowRight}{ArrowDown}{ArrowDown}{ArrowDown}");
    expect(live(container)).toBe("Mar 4, 2026: 7 commits");
  });

  it("formats hours and finds the peak", () => {
    expect(formatHour(0)).toBe("12 am");
    expect(formatHour(12)).toBe("12 pm");
    expect(formatHour(15)).toBe("3 pm");
    expect(peakCell([[0, 1], [5, 2]])).toEqual({ day: 1, hour: 0, value: 5 });
    expect(peakCell([[0, 0]])).toBeNull();
  });

  it("describes the hour heatmap and moves between cells", async () => {
    const user = userEvent.setup();
    const values = Array.from({ length: 7 }, (_, d) => Array.from({ length: 24 }, (_, h) => (d === 2 && h === 14 ? 90 : h % 5)));
    const { container } = render(<HourHeatmap values={values} unit="requests" />);
    const chart = screen.getByRole("img", { name: /busiest Wed at 2 pm/ });
    chart.focus();
    await user.keyboard("{ArrowRight}{ArrowRight}{ArrowDown}");
    expect(live(container)).toBe("Tue 1 am: 1 requests");
  });
});

describe("Treemap", () => {
  it("labels each tile with its share", async () => {
    const user = userEvent.setup();
    const { container } = render(<Treemap items={[{ label: "Alpha", value: 60 }, { label: "Beta", value: 30 }, { label: "Gone", value: 0 }]} />);
    expect(screen.getByRole("img", { name: "Alpha: 60, 66.7% of total" })).toBeTruthy();
    expect(screen.queryByRole("img", { name: /Gone/ })).toBeNull();
    await user.tab();
    expect(live(container)).toBe("Alpha: 60, 66.7%");
  });
});

describe("BulletChart", () => {
  it("classifies progress against target", () => {
    const row = { label: "r", value: 90, target: 100, ranges: [50, 80, 120] as [number, number, number] };
    expect(bulletStatus(row)).toBe("near");
    expect(bulletStatus({ ...row, value: 100 })).toBe("met");
    expect(bulletStatus({ ...row, value: 40 })).toBe("behind");
  });

  it("describes each row", async () => {
    const user = userEvent.setup();
    const { container } = render(<BulletChart rows={[{ label: "Revenue", value: 270, target: 250, ranges: [150, 225, 300] }]} />);
    expect(screen.getByRole("img", { name: "Revenue: 270 against a target of 250, on target" })).toBeTruthy();
    expect(screen.getByText("108%")).toBeTruthy();
    await user.tab();
    expect(live(container)).toBe("Revenue: 270 of 250");
  });
});

describe("WaffleChart", () => {
  it("always fills exactly the requested squares", () => {
    const owners = waffleCells([{ label: "a", value: 1 }, { label: "b", value: 1 }, { label: "c", value: 1 }]);
    expect(owners).toHaveLength(100);
    const counts = [0, 1, 2].map((i) => owners.filter((o) => o === i).length);
    expect(counts.sort()).toEqual([33, 33, 34]);
    expect(waffleCells([{ label: "a", value: 0 }])).toEqual([]);
    expect(waffleCells([{ label: "a", value: 3 }, { label: "b", value: 1 }], 20).filter((o) => o === 0)).toHaveLength(15);
  });

  it("lists segments with percentages and isolates on focus", async () => {
    const user = userEvent.setup();
    const { container } = render(<WaffleChart segments={[{ label: "Direct", value: 60 }, { label: "Search", value: 40 }]} />);
    expect(screen.getByRole("img", { name: "Waffle chart: Direct 60%, Search 40%." })).toBeTruthy();
    expect(within(screen.getByRole("button", { name: /Direct/ })).getByText("60%")).toBeTruthy();
    await user.tab();
    expect(live(container)).toBe("Direct: 60");
    expect(container.querySelectorAll("rect[opacity='0.18']")).toHaveLength(40);
  });
});

describe("UptimeBars", () => {
  const days: UptimeDay[] = [
    { date: "Mar 1", status: "up" },
    { date: "Mar 2", status: "down", note: "Database outage" },
    { date: "Mar 3", status: "none" },
    { date: "Mar 4", status: "degraded", uptime: 98 },
  ];

  it("averages days that have data", () => {
    expect(uptimePercent(days)).toBeCloseTo((100 + 0 + 98) / 3);
    expect(uptimePercent([{ date: "x", status: "none" }])).toBeNull();
  });

  it("reads a day with its note", async () => {
    const user = userEvent.setup();
    const { container } = render(<UptimeBars days={days} name="API" />);
    expect(screen.getByRole("img", { name: "API, last 4 days: 66.00% uptime." })).toBeTruthy();
    screen.getByRole("img").focus();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(live(container)).toBe("Mar 2: Outage, 0.00% uptime. Database outage");
    await user.keyboard("{ArrowRight}");
    expect(live(container)).toBe("Mar 3: No data");
  });
});

describe("SinceLastVisit", () => {
  it("measures change since the visit", () => {
    expect(deltaSince([10, 12, 15, 20], 1)).toEqual({ abs: 8, pct: 8 / 12 });
    expect(deltaSince([5], 0)).toEqual({ abs: 0, pct: 0 });
    expect(deltaSince([], 0)).toEqual({ abs: 0, pct: 0 });
    expect(deltaSince([0, 4], 0).pct).toBe(0);
  });

  it("describes each metric and respects lowerIsBetter", () => {
    render(
      <SinceLastVisit
        since="3 days ago"
        visitIndex={1}
        metrics={[
          { id: "a", label: "Signups", values: [10, 20, 30] },
          { id: "b", label: "Errors", values: [8, 6, 4], lowerIsBetter: true },
          { id: "c", label: "Churn", values: [3, 3, 3] },
        ]}
      />,
    );
    expect(screen.getByRole("region", { name: "Since your last visit" })).toBeTruthy();
    expect(screen.getByLabelText("Signups up 10 since your last visit").classList.contains("text-success-text")).toBe(true);
    expect(screen.getByLabelText("Errors down 2 since your last visit").classList.contains("text-success-text")).toBe(true);
    expect(screen.getByLabelText("Churn unchanged since your last visit").classList.contains("text-fg-muted")).toBe(true);
  });
});

describe("ThresholdGauge", () => {
  it("finds the zone and needle angle", () => {
    const zones = [{ to: 60, tone: "success" as const }, { to: 85, tone: "warning" as const }, { to: 100, tone: "danger" as const }];
    expect(zoneFor(30, zones).tone).toBe("success");
    expect(zoneFor(60, zones).tone).toBe("success");
    expect(zoneFor(90, zones).tone).toBe("danger");
    expect(zoneFor(500, zones).tone).toBe("danger");
    expect(gaugeAngle(0, 0, 100)).toBe(-90);
    expect(gaugeAngle(50, 0, 100)).toBe(0);
    expect(gaugeAngle(150, 0, 100)).toBe(90);
  });

  it("exposes a meter with a zone in its text", () => {
    render(<ThresholdGauge value={72} label="CPU load" unit="%" />);
    const meter = screen.getByRole("meter", { name: "CPU load" });
    expect(meter.getAttribute("aria-valuenow")).toBe("72");
    expect(meter.getAttribute("aria-valuetext")).toBe("72%, warning");
  });
});

describe("SankeyChart", () => {
  const nodes = [{ id: "a", label: "Visits" }, { id: "b", label: "Signups" }, { id: "c", label: "Bounce" }];
  const links = [{ source: "a", target: "b", value: 40 }, { source: "a", target: "c", value: 60 }];

  it("labels nodes and lists flows for screen readers", async () => {
    const user = userEvent.setup();
    const { container } = render(<SankeyChart nodes={nodes} links={links} />);
    expect(screen.getByRole("group", { name: /3 nodes and 2 flows/ })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Visits: 100" })).toBeTruthy();
    expect(screen.getByText("Visits to Bounce: 60")).toBeTruthy();
    await user.tab();
    expect(live(container)).toBe("Visits: 100");
  });
});

describe("DotGlobe", () => {
  it("renders without a canvas context", () => {
    render(<DotGlobe size={200} markers={[{ label: "Nairobi", lat: -1, lon: 36 }]} />);
    expect(screen.getByRole("img", { name: /Rotating dotted globe with 1 marked locations: Nairobi/ })).toBeTruthy();
  });

  it("draws dots when a context exists and stops on unmount", () => {
    const arc = vi.fn();
    const ctx = new Proxy({ arc }, { get: (t, k) => (k in t ? t[k as keyof typeof t] : () => {}), set: () => true });
    const spy = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
    const { unmount } = render(<DotGlobe size={200} />);
    expect(arc.mock.calls.length).toBeGreaterThan(50);
    act(() => unmount());
    spy.mockRestore();
  });
});

describe("DotMap", () => {
  it("projects lat/long onto the map", () => {
    expect(projectMap(0, 0).x).toBe(360);
    expect(projectMap(0, -180).x).toBe(0);
    expect(projectMap(85, 0).y).toBe(0);
    expect(projectMap(0, 0).y).toBeGreaterThan(projectMap(40, 0).y);
  });

  it("highlights focusable locations", async () => {
    const user = userEvent.setup();
    const { container } = render(<DotMap locations={[{ label: "Lisbon", lat: 38.7, lon: -9.1, value: 1200 }, { label: "Osaka", lat: 34.7, lon: 135.5 }]} />);
    expect(screen.getByRole("group", { name: /2 highlighted locations/ })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Osaka" })).toBeTruthy();
    await user.tab();
    expect(live(container)).toBe("Lisbon: 1.2k");
  });
});

describe("useChartWidth", () => {
  function Probe() {
    const [ref, width] = useChartWidth<HTMLDivElement>(500);
    return <div ref={ref} data-testid="probe">{width}</div>;
  }

  it("keeps the fallback where there is no ResizeObserver or layout", () => {
    render(<Probe />);
    expect(screen.getByTestId("probe").textContent).toBe("500");
  });

  it("uses the measured width, rounded, and follows resizes", () => {
    let notify: () => void = () => {};
    let measured = 412.6;
    class FakeObserver {
      constructor(cb: () => void) {
        notify = cb;
      }
      observe() {}
      disconnect() {}
    }
    vi.stubGlobal("ResizeObserver", FakeObserver);
    const rect = vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(() => measured);
    render(<Probe />);
    expect(screen.getByTestId("probe").textContent).toBe("413");
    measured = 0;
    act(() => notify());
    expect(screen.getByTestId("probe").textContent).toBe("413");
    measured = 320;
    act(() => notify());
    expect(screen.getByTestId("probe").textContent).toBe("320");
    rect.mockRestore();
    vi.unstubAllGlobals();
  });

  it("makes a chart's viewBox match its rendered width", () => {
    vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
    const rect = vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(() => 780);
    const { container } = render(<Candlestick data={[{ label: "D1", open: 1, high: 2, low: 0, close: 1.5 }]} />);
    expect(container.querySelector("svg")?.getAttribute("viewBox")).toBe("0 0 780 280");
    rect.mockRestore();
    vi.unstubAllGlobals();
  });
});

describe("count up", () => {
  it("swaps the first number and keeps its decimals, commas, prefix and suffix", () => {
    expect(withNumber("$48,200", 1234.4)).toBe("$1,234");
    expect(withNumber("99.95%", 3.14159)).toBe("3.14%");
    expect(withNumber("12 months", 0)).toBe("0 months");
    expect(withNumber("-$1,200.50 net", 50)).toBe("-$50.00 net");
    expect(withNumber("Cash positive", 5)).toBe("Cash positive");
  });

  it("shows the final text when there is no layout to animate in", () => {
    render(<CountUp text="$48,200" />);
    expect(screen.getByText("$48,200")).toBeTruthy();
  });
});
