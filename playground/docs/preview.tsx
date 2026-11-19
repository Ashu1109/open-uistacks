import { Component, lazy, Suspense, useEffect, useRef, useState, type ComponentType, type ErrorInfo, type ReactNode } from "react";
import { DemoView } from "../demo";
import { SECTION_OF } from "./meta";
import { pascal, type Item } from "./items";

/* Live previews: a component or block renders its own demo out of its playground section (isolated through DemoView),
   a template renders directly. Cards mount their preview only when scrolled near, zoomed down to fit. */

const sectionLoaders = import.meta.glob<{ Section: ComponentType }>(["../sections/*.tsx", "!../sections/*.test.tsx"]);
const templateLoaders = import.meta.glob<Record<string, unknown>>("../../originals/templates/*.tsx");

const cache = new Map<string, ComponentType>();

function lazyOnce(key: string, load: () => Promise<ComponentType>): ComponentType {
  const hit = cache.get(key);
  if (hit) return hit;
  const LazyComponent = lazy(async () => ({ default: await load() }));
  cache.set(key, LazyComponent);
  return LazyComponent;
}

function sectionComponent(key: string): ComponentType {
  return lazyOnce(`section:${key}`, async () => (await sectionLoaders[`../sections/${key}.tsx`]()).Section);
}

function templateComponent(slug: string): ComponentType {
  return lazyOnce(`template:${slug}`, async () => {
    const mod = await templateLoaders[`../../originals/templates/${slug}.tsx`]();
    const named = mod[pascal(slug)];
    const found = typeof named === "function" ? named : Object.values(mod).find((v) => typeof v === "function");
    return found as ComponentType;
  });
}

class Boundary extends Component<{ children: ReactNode }, { error?: Error }> {
  state: { error?: Error } = {};
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Preview failed", error, info.componentStack);
  }
  render() {
    if (this.state.error) return <p className="text-sm text-danger-text">Preview failed: {this.state.error.message}</p>;
    return this.props.children;
  }
}

function Loading() {
  return <div aria-hidden className="h-24 w-full max-w-sm animate-pulse rounded-[16px] bg-track/60" />;
}

export function Preview({ item }: { item: Item }) {
  if (item.kind === "template") {
    const Template = templateComponent(item.slug);
    return (
      <Boundary>
        <Suspense fallback={<Loading />}>
          <Template />
        </Suspense>
      </Boundary>
    );
  }
  const key = SECTION_OF[item.slug];
  if (!key) return <p className="text-sm text-fg-muted">No preview yet.</p>;
  const SectionDemo = sectionComponent(key);
  return (
    <Boundary>
      <Suspense fallback={<Loading />}>
        <DemoView.Provider value={{ only: item.slug, bare: true }}>
          <SectionDemo />
        </DemoView.Provider>
      </Suspense>
    </Boundary>
  );
}

const ZOOM: Record<Item["kind"], number> = { component: 1, block: 0.5, template: 0.34 };

/** True once the element is properly on screen, so a preview's entrance animation plays where you can see it. */
function useSeen<T extends HTMLElement>(): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return setSeen(true);
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setSeen(true);
      observer.disconnect();
    }, { threshold: 0.25, rootMargin: "0px 0px 80px 0px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, seen];
}

function isSurface(el: Element): boolean {
  const style = getComputedStyle(el);
  const bg = style.backgroundColor;
  return (bg !== "transparent" && !/rgba\(.*,\s*0\)$/.test(bg)) || style.boxShadow !== "none" || parseFloat(style.borderTopWidth) > 0 || style.backgroundImage !== "none";
}

// ponytail: demos render in a full-width block (as authored), so a narrow demo would sit at the left; this shifts it
// to the middle with left padding (the wrapper is border-box, so it never grows past its frame). A full-width visible surface means the demo fills the frame on purpose.
function centerNarrowDemo(host: HTMLElement) {
  const target = host.querySelector<HTMLElement>("[data-demo]");
  if (!target) return;
  target.style.paddingLeft = "";
  const box = host.getBoundingClientRect();
  if (box.width === 0) return;
  const scale = host.offsetWidth ? box.width / host.offsetWidth : 1;
  let left = Infinity;
  let right = -Infinity;
  for (const el of target.querySelectorAll("*")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0 || r.width > box.width * 1.02) continue;
    if (el.checkVisibility && !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
    if (r.width >= box.width * 0.94) {
      if (isSurface(el)) return;
      continue;
    }
    left = Math.min(left, r.left);
    right = Math.max(right, r.right);
  }
  const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.textContent?.trim()) continue;
    const parent = node.parentElement;
    if (parent?.checkVisibility && !parent.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
    range.selectNodeContents(node);
    const r = range.getBoundingClientRect();
    if (r.width === 0) continue;
    left = Math.min(left, r.left);
    right = Math.max(right, r.right);
  }
  if (!Number.isFinite(left) || right - left >= box.width * 0.94) return;
  const shift = (box.left + box.right) / 2 - (left + right) / 2;
  if (shift > 2) target.style.paddingLeft = `${shift / scale}px`;
}

/** Wraps a component preview: a full-width frame (capped) with narrow demos shifted to the centre once they settle. */
export function CenteredPreview({ item, maxWidth }: { item: Item; maxWidth: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    const timers = [60, 400, 1200].map((ms) => window.setTimeout(() => centerNarrowDemo(host), ms));
    const observer = typeof MutationObserver === "undefined" ? undefined : new MutationObserver(() => window.setTimeout(() => centerNarrowDemo(host), 50));
    observer?.observe(host, { childList: true, subtree: true });
    window.setTimeout(() => observer?.disconnect(), 2500);
    return () => {
      timers.forEach(clearTimeout);
      observer?.disconnect();
    };
  }, [item.slug, maxWidth]);
  return (
    <div ref={ref} className="mx-auto w-full" style={{ maxWidth }}>
      <Preview item={item} />
    </div>
  );
}

/** How much wider than its frame the widest scrolling or overflowing part of a demo is (1 when it fits). */
function overflowRatio(root: HTMLElement): number {
  let ratio = root.clientWidth ? root.scrollWidth / root.clientWidth : 1;
  for (const el of root.querySelectorAll<HTMLElement>("*")) {
    const style = getComputedStyle(el);
    if (el.clientWidth < 40 || !/(auto|scroll)/.test(style.overflowX) || style.scrollSnapType !== "none") continue;
    ratio = Math.max(ratio, el.scrollWidth / el.clientWidth);
  }
  return Math.min(ratio, 2.4);
}

/** A live preview for index cards: it mounts when it scrolls into view (so entrance animations are seen), stays inert
    until the pointer enters (so nothing grabs focus or scrolls the page on mount), then responds to hover and clicks.
    Components render at real size; only content wider than the card is zoomed out to fit. */
export function CardPreview({ item }: { item: Item }) {
  const [ref, seen] = useSeen<HTMLDivElement>();
  const inner = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(1);
  const [live, setLive] = useState(false);
  useEffect(() => {
    if (!seen || item.kind === "template") return;
    const timers = [700, 2000].map((ms) =>
      window.setTimeout(() => {
        const el = inner.current;
        if (!el) return;
        const ratio = overflowRatio(el);
        if (ratio > 1.04) setFit((f) => (f === 1 ? ratio : f));
      }, ms)
    );
    return () => timers.forEach(clearTimeout);
  }, [seen, item.kind]);
  const zoom = ZOOM[item.kind] / fit;
  const body = item.kind === "template" ? (
    <div className="h-full w-full overflow-hidden rounded-[24px] shadow-[var(--shadow-card)]"><Preview item={item} /></div>
  ) : (
    <CenteredPreview item={item} maxWidth={(item.kind === "component" ? 560 : 1400) * fit} />
  );
  const interactive = live && item.kind === "component";
  return (
    <div ref={ref} onPointerEnter={() => setLive(true)} className="absolute inset-0">
      <div
        inert={!interactive}
        aria-hidden={!interactive}
        className={`absolute inset-0 flex justify-center overflow-hidden px-5 pb-5 pt-2 [align-items:safe_center] ${interactive ? "" : "pointer-events-none"}`}
      >
        <div ref={inner} style={zoom === 1 ? undefined : { zoom, width: `${100 / zoom}%`, height: item.kind === "template" ? 860 : undefined }} className={zoom === 1 ? "w-full" : undefined}>
          {seen && body}
        </div>
      </div>
    </div>
  );
}
