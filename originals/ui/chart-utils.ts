import { createElement as el, useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type ComponentProps, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import { animate, motion, useIsPresent, useReducedMotion, type MotionProps } from "motion/react";

/* Chart utils: shared scale, tick, path, layout and statistics math for the hand-built SVG charts, plus tiny axis, tooltip and keyboard helpers. */

export const SERIES = [
  "var(--series-1)",
  "var(--success)",
  "var(--warning)",
  "var(--series-3)",
  "var(--danger)",
  "color-mix(in srgb, var(--series-1) 45%, var(--surface))",
];
export const seriesColor = (i: number) => SERIES[((i % SERIES.length) + SERIES.length) % SERIES.length];

export const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);
const round2 = (n: number) => Number(n.toFixed(2));

export type Scale = ((v: number) => number) & { invert: (p: number) => number; domain: [number, number]; range: [number, number] };

export function linearScale(domain: [number, number], range: [number, number]): Scale {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0;
  const fn = (v: number) => (span === 0 ? (r0 + r1) / 2 : r0 + ((v - d0) / span) * (r1 - r0));
  const invert = (p: number) => (r1 === r0 ? d0 : d0 + ((p - r0) / (r1 - r0)) * span);
  return Object.assign(fn, { invert, domain, range });
}

export function extent(values: number[]): [number, number] {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return [0, 0];
  return [Math.min(...finite), Math.max(...finite)];
}

/** Round tick values that cover [min, max], about `count` of them. */
export function niceTicks(min: number, max: number, count = 5): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [];
  let lo = Math.min(min, max);
  let hi = Math.max(min, max);
  if (lo === hi) {
    const pad = Math.abs(lo) * 0.5 || 1;
    lo -= pad;
    hi += pad;
  }
  const raw = (hi - lo) / Math.max(count, 1);
  const exp = Math.floor(Math.log10(raw));
  const f = raw / 10 ** exp;
  const step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * 10 ** exp;
  const start = Math.floor(lo / step) * step;
  const end = Math.ceil(hi / step) * step;
  const out: number[] = [];
  for (let i = 0; start + i * step <= end + step / 1e6; i++) out.push(Number((start + i * step).toFixed(10)));
  return out;
}

/** 950, 12.4k, 1.24M, -2.5k. */
export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return "–";
  const rounded = Math.abs(Number(n.toPrecision(3)));
  const units: [number, string][] = [[1e9, "B"], [1e6, "M"], [1e3, "k"]];
  const unit = units.find(([v]) => rounded >= v);
  if (!unit) return String(Number(n.toPrecision(3)));
  return `${Number((n / unit[0]).toPrecision(3))}${unit[1]}`;
}

export function formatCurrency(n: number, digits = 2): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
}

export const formatPercent = (ratio: number, digits = 0) => `${(ratio * 100).toFixed(digits)}%`;

export interface Point {
  x: number;
  y: number;
}

function monotoneTangents(pts: Point[]): number[] {
  const n = pts.length;
  const slopes: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const dx = pts[i + 1].x - pts[i].x;
    slopes.push(dx === 0 ? 0 : (pts[i + 1].y - pts[i].y) / dx);
  }
  const t = pts.map((_, i) => {
    if (i === 0) return slopes[0];
    if (i === n - 1) return slopes[n - 2];
    return slopes[i - 1] * slopes[i] <= 0 ? 0 : (slopes[i - 1] + slopes[i]) / 2;
  });
  for (let i = 0; i < n - 1; i++) {
    if (slopes[i] === 0) {
      t[i] = 0;
      t[i + 1] = 0;
      continue;
    }
    const a = t[i] / slopes[i];
    const b = t[i + 1] / slopes[i];
    const s = a * a + b * b;
    if (s > 9) {
      const k = 3 / Math.sqrt(s);
      t[i] = k * a * slopes[i];
      t[i + 1] = k * b * slopes[i];
    }
  }
  return t;
}

/** SVG path through the points; `smooth` uses a monotone cubic so the curve never overshoots the data. */
export function linePath(pts: Point[], smooth = false): string {
  if (pts.length === 0) return "";
  const head = `M${round2(pts[0].x)},${round2(pts[0].y)}`;
  if (pts.length === 1) return head;
  if (!smooth) return head + pts.slice(1).map((p) => `L${round2(p.x)},${round2(p.y)}`).join("");
  const t = monotoneTangents(pts);
  let d = head;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const dx = (b.x - a.x) / 3;
    d += `C${round2(a.x + dx)},${round2(a.y + t[i] * dx)},${round2(b.x - dx)},${round2(b.y - t[i + 1] * dx)},${round2(b.x)},${round2(b.y)}`;
  }
  return d;
}

export function areaPath(pts: Point[], baseline: number, smooth = false): string {
  if (pts.length === 0) return "";
  const last = pts[pts.length - 1];
  return `${linePath(pts, smooth)}L${round2(last.x)},${round2(baseline)}L${round2(pts[0].x)},${round2(baseline)}Z`;
}

/** Closed shape between an upper and a lower edge, both left to right. */
export function bandPath(upper: Point[], lower: Point[], smooth = false): string {
  if (upper.length === 0 || lower.length === 0) return "";
  return `${linePath(upper, smooth)}${linePath([...lower].reverse(), smooth).replace(/^M/, "L")}Z`;
}

export interface Layer {
  y0: number;
  y1: number;
}

/** Cumulative offsets for stacked series; negatives count as zero, `normalize` scales each column to 1. */
export function stackSeries(values: number[][], normalize = false): Layer[][] {
  const columns = Math.max(0, ...values.map((v) => v.length));
  const layers: Layer[][] = values.map(() => []);
  for (let i = 0; i < columns; i++) {
    const col = values.map((v) => Math.max(0, v[i] ?? 0));
    const total = col.reduce((a, b) => a + b, 0);
    let acc = 0;
    col.forEach((v, s) => {
      const share = normalize ? (total === 0 ? 0 : v / total) : v;
      layers[s].push({ y0: acc, y1: acc + share });
      acc += share;
    });
  }
  return layers;
}

export interface WaterfallStep {
  label: string;
  value: number;
  /** A subtotal bar spanning 0 to the running balance. The first step uses its own value as the opening balance. */
  total?: boolean;
}
export interface WaterfallBar {
  label: string;
  start: number;
  end: number;
  delta: number;
  kind: "up" | "down" | "total";
}

export function waterfallTotals(steps: WaterfallStep[]): WaterfallBar[] {
  let running = 0;
  return steps.map((s, i) => {
    if (s.total) {
      const end = i === 0 ? s.value : running;
      running = end;
      return { label: s.label, start: 0, end, delta: end, kind: "total" };
    }
    const start = running;
    running += s.value;
    return { label: s.label, start, end: running, delta: s.value, kind: s.value >= 0 ? "up" : "down" };
  });
}

export function quantile(sorted: number[], p: number): number {
  if (sorted.length === 0) return NaN;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

export interface BoxStats {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  whiskerLow: number;
  whiskerHigh: number;
  outliers: number[];
  count: number;
}

/** Quartiles with Tukey whiskers: the furthest values within 1.5 IQR of the box; anything beyond is an outlier. */
export function boxStats(values: number[]): BoxStats | null {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const q1 = quantile(sorted, 0.25);
  const q3 = quantile(sorted, 0.75);
  const fence = 1.5 * (q3 - q1);
  const inside = sorted.filter((v) => v >= q1 - fence && v <= q3 + fence);
  return {
    min: sorted[0],
    q1,
    median: quantile(sorted, 0.5),
    q3,
    max: sorted[sorted.length - 1],
    whiskerLow: inside[0],
    whiskerHigh: inside[inside.length - 1],
    outliers: sorted.filter((v) => v < q1 - fence || v > q3 + fence),
    count: sorted.length,
  };
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Squarified treemap: returns one rectangle per positive-valued item, largest first, tiling `bounds` exactly. */
export function treemapLayout<T extends { value: number }>(items: T[], bounds: Rect): (Rect & { item: T })[] {
  const sorted = items.filter((i) => i.value > 0).sort((a, b) => b.value - a.value);
  const total = sorted.reduce((s, i) => s + i.value, 0);
  if (total === 0) return [];
  const scale = (bounds.w * bounds.h) / total;
  const worst = (areas: number[], side: number) => {
    const sum = areas.reduce((a, b) => a + b, 0);
    return Math.max((side * side * Math.max(...areas)) / (sum * sum), (sum * sum) / (side * side * Math.min(...areas)));
  };
  const out: (Rect & { item: T })[] = [];
  let rest = bounds;
  let row: T[] = [];
  const flush = () => {
    const sum = row.reduce((s, i) => s + i.value * scale, 0);
    if (rest.w >= rest.h) {
      const w = sum / rest.h;
      let y = rest.y;
      row.forEach((item) => {
        const h = (item.value * scale) / w;
        out.push({ x: rest.x, y, w, h, item });
        y += h;
      });
      rest = { x: rest.x + w, y: rest.y, w: rest.w - w, h: rest.h };
    } else {
      const h = sum / rest.w;
      let x = rest.x;
      row.forEach((item) => {
        const w = (item.value * scale) / h;
        out.push({ x, y: rest.y, w, h, item });
        x += w;
      });
      rest = { x: rest.x, y: rest.y + h, w: rest.w, h: rest.h - h };
    }
    row = [];
  };
  for (const item of sorted) {
    const side = Math.min(rest.w, rest.h);
    const areas = row.map((r) => r.value * scale);
    if (row.length === 0 || worst([...areas, item.value * scale], side) <= worst(areas, side)) row.push(item);
    else {
      flush();
      row = [item];
    }
  }
  if (row.length) flush();
  return out;
}

export interface SankeyNodeInput {
  id: string;
  label?: string;
}
export interface SankeyLinkInput {
  source: string;
  target: string;
  value: number;
}
export interface SankeyNode extends Rect {
  id: string;
  label: string;
  column: number;
  value: number;
}
export interface SankeyLink extends SankeyLinkInput {
  path: string;
  width: number;
}

/** Column layout: a node sits one column right of its furthest source; heights share one scale so flows stay proportional. */
export function sankeyLayout(
  nodes: SankeyNodeInput[],
  links: SankeyLinkInput[],
  opts: { width: number; height: number; nodeWidth?: number; nodePadding?: number },
): { nodes: SankeyNode[]; links: SankeyLink[] } {
  const { width, height, nodeWidth = 12, nodePadding = 12 } = opts;
  const valid = links.filter((l) => l.value > 0 && l.source !== l.target && nodes.some((n) => n.id === l.source) && nodes.some((n) => n.id === l.target));
  const column = new Map(nodes.map((n) => [n.id, 0]));
  for (let pass = 0; pass < nodes.length; pass++) {
    let changed = false;
    for (const l of valid) {
      const next = (column.get(l.source) ?? 0) + 1;
      if (next > (column.get(l.target) ?? 0) && next < nodes.length) {
        column.set(l.target, next);
        changed = true;
      }
    }
    if (!changed) break;
  }
  const flow = (id: string, side: "source" | "target") => valid.filter((l) => l[side] === id).reduce((s, l) => s + l.value, 0);
  const valueOf = (id: string) => Math.max(flow(id, "source"), flow(id, "target"));
  const maxCol = Math.max(0, ...column.values());
  const cols = Array.from({ length: maxCol + 1 }, (_, c) => nodes.filter((n) => column.get(n.id) === c));
  const k = Math.min(...cols.map((c) => (c.length === 0 ? Infinity : (height - nodePadding * (c.length - 1)) / (c.reduce((s, n) => s + valueOf(n.id), 0) || 1))));
  const scale = Number.isFinite(k) && k > 0 ? k : 1;
  const placed = new Map<string, SankeyNode>();
  cols.forEach((c, ci) => {
    const used = c.reduce((s, n) => s + valueOf(n.id) * scale, 0) + nodePadding * Math.max(c.length - 1, 0);
    let y = (height - used) / 2;
    c.forEach((n) => {
      const h = valueOf(n.id) * scale;
      placed.set(n.id, { id: n.id, label: n.label ?? n.id, column: ci, value: valueOf(n.id), x: maxCol === 0 ? 0 : (ci * (width - nodeWidth)) / maxCol, y, w: nodeWidth, h });
      y += h + nodePadding;
    });
  });
  const outOffset = new Map<string, number>();
  const inOffset = new Map<string, number>();
  const ordered = [...valid].sort((a, b) => (placed.get(a.target)?.y ?? 0) - (placed.get(b.target)?.y ?? 0) || (placed.get(a.source)?.y ?? 0) - (placed.get(b.source)?.y ?? 0));
  const byIn = [...valid].sort((a, b) => (placed.get(a.source)?.y ?? 0) - (placed.get(b.source)?.y ?? 0));
  const inY = new Map<SankeyLinkInput, number>();
  byIn.forEach((l) => {
    const t = placed.get(l.target);
    if (!t) return;
    const off = inOffset.get(l.target) ?? 0;
    inY.set(l, t.y + off);
    inOffset.set(l.target, off + l.value * scale);
  });
  const outLinks = ordered.map((l) => {
    const s = placed.get(l.source);
    const t = placed.get(l.target);
    if (!s || !t) return null;
    const w = l.value * scale;
    const off = outOffset.get(l.source) ?? 0;
    outOffset.set(l.source, off + w);
    const y0 = s.y + off + w / 2;
    const y1 = (inY.get(l) ?? t.y) + w / 2;
    const x0 = s.x + s.w;
    const mid = (x0 + t.x) / 2;
    return { ...l, width: w, path: `M${round2(x0)},${round2(y0)}C${round2(mid)},${round2(y0)},${round2(mid)},${round2(y1)},${round2(t.x)},${round2(y1)}` };
  });
  return { nodes: nodes.map((n) => placed.get(n.id)).filter((n): n is SankeyNode => Boolean(n)), links: outLinks.filter((l): l is SankeyLink => l !== null) };
}

/** 0 at the top, clockwise, degrees. */
export function polar(cx: number, cy: number, r: number, deg: number): Point {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

export function arcPath(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const s = polar(cx, cy, r, a0);
  const e = polar(cx, cy, r, a1);
  return `M${round2(s.x)},${round2(s.y)}A${r},${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${round2(e.x)},${round2(e.y)}`;
}

/** Bucket a value into 0..levels, 0 only for empty cells. */
export function quantizeLevel(value: number, max: number, levels = 4): number {
  if (value <= 0 || max <= 0) return 0;
  return clamp(Math.ceil((value / max) * levels), 1, levels);
}

export function levelColor(level: number, levels = 4): string {
  return level <= 0 ? "var(--track)" : `color-mix(in srgb, var(--select) ${Math.round(25 + (level / levels) * 75)}%, var(--surface))`;
}

const LAND_BANDS: Record<number, [number, number][]> = {
  75: [[-120, -70], [-60, -20], [100, 150]],
  65: [[-165, -60], [-52, -25], [-24, -14], [5, 180]],
  55: [[-165, -55], [-8, 2], [5, 160]],
  45: [[-125, -60], [-10, 150]],
  35: [[-122, -75], [-10, 142]],
  25: [[-112, -80], [-17, 122]],
  15: [[-105, -60], [-17, 52], [72, 80], [95, 110]],
  5: [[-80, -50], [-10, 50], [95, 105], [110, 150]],
  [-5]: [[-80, -35], [10, 42], [100, 150]],
  [-15]: [[-75, -40], [12, 42], [125, 145]],
  [-25]: [[-70, -45], [15, 35], [115, 152]],
  [-35]: [[-72, -58], [18, 30], [117, 150], [172, 178]],
  [-45]: [[-73, -66], [168, 174]],
  [-55]: [[-70, -66]],
  [-65]: [[-65, -58]],
  [-75]: [[-180, 180]],
  [-85]: [[-180, 180]],
};

export interface GeoDot {
  lat: number;
  lon: number;
}

/** Invented coarse land mask (not real map data) sampled on a lat/long grid. */
export function worldDots(step = 5): GeoDot[] {
  const dots: GeoDot[] = [];
  for (let lat = 90 - step / 2; lat > -90; lat -= step) {
    const band = LAND_BANDS[Math.round((lat - 5) / 10) * 10 + 5] ?? [];
    for (let lon = -180 + step / 2; lon < 180; lon += step) {
      if (band.some(([a, b]) => lon >= a && lon <= b)) dots.push({ lat, lon });
    }
  }
  return dots;
}

/** Orthographic projection: x right, y up, z toward the viewer (visible when z > 0). */
export function orthographic(lat: number, lon: number, rotation: number, tilt = 0.35): { x: number; y: number; z: number } {
  const phi = (lat * Math.PI) / 180;
  const lam = ((lon - rotation) * Math.PI) / 180;
  return {
    x: Math.cos(phi) * Math.sin(lam),
    y: Math.cos(tilt) * Math.sin(phi) - Math.sin(tilt) * Math.cos(phi) * Math.cos(lam),
    z: Math.sin(tilt) * Math.sin(phi) + Math.cos(tilt) * Math.cos(phi) * Math.cos(lam),
  };
}

/** Keyboard stepping through `count` items; null when the key is not handled. */
export function stepIndex(current: number | null, key: string, count: number): number | "clear" | null {
  if (count === 0) return null;
  if (key === "Escape") return "clear";
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  if (key === "ArrowRight" || key === "ArrowDown") return current === null ? 0 : Math.min(current + 1, count - 1);
  if (key === "ArrowLeft" || key === "ArrowUp") return current === null ? 0 : Math.max(current - 1, 0);
  return null;
}

/** Nearest evenly spaced index for a pointer over an svg whose viewBox is `vbWidth` wide. */
export function pointerIndex(
  e: { clientX: number; currentTarget: { getBoundingClientRect(): { left: number; width: number } } },
  count: number,
  x0: number,
  x1: number,
  vbWidth: number,
): number | null {
  const rect = e.currentTarget.getBoundingClientRect();
  if (rect.width === 0 || count === 0) return null;
  if (count === 1) return 0;
  const vx = ((e.clientX - rect.left) / rect.width) * vbWidth;
  return clamp(Math.round(((vx - x0) / (x1 - x0)) * (count - 1)), 0, count - 1);
}

/** Active-index state with arrow/Home/End/Escape handling for a focusable chart. */
export function useActiveIndex(count: number) {
  const [active, setActive] = useState<number | null>(null);
  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const next = stepIndex(active, e.key, count);
      if (next === null) return;
      e.preventDefault();
      setActive(next === "clear" ? null : next);
    },
    [active, count],
  );
  const focusProps = { tabIndex: 0, onKeyDown, onBlur: () => setActive(null) };
  return { active: active !== null && active < count ? active : null, setActive, focusProps };
}

export const focusRing = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

const noSubscribe = () => () => {};
/** Reduced-motion preference, read after hydration so server and client markup match. */
export function useChartReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

export const CHART_SPRING = { type: "spring", stiffness: 420, damping: 34 } as const;
export const CHART_EASE = { type: "spring", stiffness: 520, damping: 38 } as const;

export type EnterKind = "fade" | "rise" | "growY" | "growX" | "pop" | "slideX";
const ENTER_FROM: Record<EnterKind, Record<string, number>> = {
  fade: { opacity: 0 },
  rise: { opacity: 0, y: 6 },
  growY: { opacity: 0, scaleY: 0 },
  growX: { opacity: 0, scaleX: 0 },
  pop: { opacity: 0, scale: 0 },
  slideX: { opacity: 0, x: -14 },
};
const ENTER_TO: Record<EnterKind, Record<string, number>> = {
  fade: { opacity: 1 },
  rise: { opacity: 1, y: 0 },
  growY: { opacity: 1, scaleY: 1 },
  growX: { opacity: 1, scaleX: 1 },
  pop: { opacity: 1, scale: 1 },
  slideX: { opacity: 1, x: 0 },
};
const ENTER_ORIGIN: Partial<Record<EnterKind, string>> = { growY: "50% 100%", growX: "0% 50%" };

/** Spread onto a motion element for a mount-only entrance; item `i` starts 40 ms after `i - 1` (capped), `base` seconds in. `at` pins the scale origin in svg user units. Renders the final state at once when `reduce`. */
export function enter(reduce: boolean, kind: EnterKind, i = 0, base = 0, at?: { x?: number; y?: number }): Pick<MotionProps, "initial" | "animate" | "transition" | "style"> {
  const delay = base + Math.min(i * 0.04, 0.35);
  const origin = at ? `${at.x ?? 0}px ${at.y ?? 0}px` : ENTER_ORIGIN[kind];
  return {
    initial: reduce ? false : ENTER_FROM[kind],
    animate: ENTER_TO[kind],
    transition: { ...CHART_SPRING, delay, opacity: { duration: 0.22, delay } },
    style: origin ? { transformBox: at ? "view-box" : "fill-box", transformOrigin: origin } : undefined,
  };
}

/** `value` itself on first render, then a short tween toward each new value (immediate when `reduce`). */
export function useTween(value: number, reduce: boolean, duration = 0.4): number {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    if (reduce || !Number.isFinite(value) || from.current === value) {
      from.current = value;
      setShown(value);
      return;
    }
    const controls = animate(from.current, value, { duration, ease: "easeOut", onUpdate: (v) => { from.current = v; setShown(v); } });
    return () => controls.stop();
  }, [value, reduce, duration]);
  return shown;
}

/** Wrap a direct AnimatePresence child: `children(true)` while it animates out, so the caller can hide it from assistive tech and the keyboard straight away. */
export function Leaving({ children }: { children: (leaving: boolean) => ReactNode }) {
  return children(!useIsPresent());
}

/** Props for an element that is animating out: hidden from assistive tech and unfocusable. */
export const gone = (leaving: boolean) => (leaving ? { "aria-hidden": true, inert: true } : {});

const FIRST_NUMBER = /\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?/;

/** `text` with its first number swapped for `value`, keeping that number's decimal places and thousands commas. */
export function withNumber(text: string, value: number): string {
  const found = FIRST_NUMBER.exec(text);
  if (!found) return text;
  const places = found[0].split(".")[1]?.length ?? 0;
  const [whole, fraction] = value.toFixed(places).split(".");
  const grouped = found[0].includes(",") ? whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : whole;
  return text.slice(0, found.index) + grouped + (fraction ? `.${fraction}` : "") + text.slice(found.index + found[0].length);
}

// ponytail: reads only the first en-US style number in the text; a locale with "." grouping counts oddly until the last frame, which is always `text`.
/** `text` with its first number counting up from zero the first time it scrolls into view, then `text` itself (later changes show at once). Static under reduced motion, when not laid out (jsdom, display:none), or with no number. */
export function CountUp({ text, duration = 0.8 }: { text: string; duration?: number }) {
  const reduce = useChartReduce();
  const ref = useRef<HTMLSpanElement>(null);
  const current = useRef(text);
  const stop = useRef(() => {});
  const [shown, setShown] = useState<string | null>(null);
  useLayoutEffect(() => {
    const node = ref.current;
    const found = FIRST_NUMBER.exec(current.current);
    const target = found ? Number(found[0].replace(/,/g, "")) : 0;
    if (reduce || !node || !(target > 0) || node.getClientRects().length === 0) return;
    setShown(withNumber(current.current, 0));
    let controls: { stop: () => void } | undefined;
    const start = () => {
      controls = animate(0, target, { duration, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => setShown(withNumber(current.current, v)), onComplete: () => setShown(null) });
    };
    const io = typeof IntersectionObserver === "function" ? new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io?.disconnect();
      start();
    }, { threshold: 0.2 }) : null;
    stop.current = () => {
      io?.disconnect();
      controls?.stop();
    };
    if (io) io.observe(node);
    else start();
    return () => stop.current();
  }, []);
  useEffect(() => {
    if (text === current.current) return;
    current.current = text;
    stop.current();
    setShown(null);
  }, [text]);
  return el("span", { ref, className: "tabular-nums", "aria-hidden": shown === null ? undefined : true }, shown ?? text);
}

/** A stroked path that draws left to right on mount (pathLength 0 to 1); not for dashed strokes, which should `enter(..., "fade")` instead. */
export function DrawPath({ delay = 0, duration = 0.65, ...rest }: Omit<ComponentProps<typeof motion.path>, "initial" | "animate" | "transition"> & { delay?: number; duration?: number }) {
  const reduce = useChartReduce();
  return el(motion.path, {
    ...rest,
    initial: reduce ? false : { pathLength: 0, opacity: 0 },
    animate: { pathLength: 1, opacity: 1 },
    transition: { pathLength: { duration, delay, ease: "easeOut" }, opacity: { duration: 0.01, delay } },
  });
}

/** Tooltip anchored at viewBox coordinates (x, y) of a `w` by `h` chart; flips to the left on the right side. Fades and scales in, and glides between anchors. */
export function ChartTip({ x, y, w, h, children }: { x: number; y: number; w: number; h: number; children: ReactNode }) {
  const reduce = useChartReduce();
  const left = (x / w) * 100;
  const flip = left > 60;
  return el(
    "div",
    {
      "aria-hidden": true,
      className: "pointer-events-none absolute z-10",
      style: { left: `${left}%`, top: `${(y / h) * 100}%`, transform: `translate(${flip ? "calc(-100% - 10px)" : "10px"}, -50%)`, transition: reduce ? undefined : "left 90ms ease-out, top 90ms ease-out" },
    },
    el(
      motion.div,
      {
        className: "whitespace-nowrap rounded-[10px] bg-surface px-2.5 py-1.5 text-xs text-fg shadow-[var(--shadow-overlay)] dark:bg-raised",
        initial: reduce ? false : { opacity: 0, scale: 0.94 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: 0.14, ease: "easeOut" },
        style: { transformOrigin: flip ? "100% 50%" : "0% 50%" },
      },
      children,
    ),
  );
}

export function Live({ children }: { children: ReactNode }) {
  return el("span", { className: "sr-only", "aria-live": "polite" }, children);
}

export function YGrid({ ticks, y, x0, x1, format = formatNumber }: { ticks: number[]; y: (v: number) => number; x0: number; x1: number; format?: (v: number) => string }) {
  return el(
    "g",
    { "aria-hidden": true },
    ticks.flatMap((t) => [
      el("line", { key: `l${t}`, x1: x0, x2: x1, y1: y(t), y2: y(t), stroke: "var(--track)", strokeWidth: 1 }),
      el("text", { key: `t${t}`, x: x0 - 8, y: y(t), textAnchor: "end", dominantBaseline: "middle", fontSize: 10, fill: "var(--fg-subtle)" }, format(t)),
    ]),
  );
}

export function XLabels({ labels, x, y, max = 6 }: { labels: string[]; x: (i: number) => number; y: number; max?: number }) {
  const every = Math.max(1, Math.ceil(labels.length / max));
  return el(
    "g",
    { "aria-hidden": true },
    labels.map((l, i) => (i % every === 0 ? el("text", { key: i, x: x(i), y, textAnchor: "middle", fontSize: 10, fill: "var(--fg-subtle)" }, l) : null)),
  );
}

export interface GridPos {
  row: number;
  col: number;
}

/** Arrow-key movement across a rows by cols grid; null when the key is not an arrow. */
export function stepGrid(pos: GridPos | null, key: string, rows: number, cols: number): GridPos | null {
  const delta: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
  const d = delta[key];
  if (!d || rows === 0 || cols === 0) return null;
  if (!pos) return { row: 0, col: 0 };
  return { row: clamp(pos.row + d[0], 0, rows - 1), col: clamp(pos.col + d[1], 0, cols - 1) };
}

/** Rendered width of the wrapper in whole px, so a viewBox of that width keeps SVG text at its authored size; keeps `fallback` where ResizeObserver or layout is missing. */
export function useChartWidth<T extends HTMLElement = HTMLElement>(fallback: number): [RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const measure = () => {
      const w = Math.round(node.clientWidth);
      if (w > 0) setWidth(Math.max(w, 200));
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}
