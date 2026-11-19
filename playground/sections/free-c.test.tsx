import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Section } from "./free-c";

const SLUGS = [
  "kbd", "avatar", "stat-card", "code-block", "avatar-stack", "leaderboard", "timeline", "sortable-list",
  "audio-player", "rolling-number", "grouped-bar", "compare-bars", "ring-stats", "donut-chart",
  "announcement-pill", "copy-prompt-box", "newsletter-signup", "changelog-entry", "metric-strip", "cta-banner", "confetti",
];

beforeAll(() => {
  class Obs {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return []; }
  }
  vi.stubGlobal("ResizeObserver", Obs);
  vi.stubGlobal("IntersectionObserver", Obs);
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false, media: query, onchange: null,
    addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false,
  }));
});

afterEach(cleanup);

describe("free-c section", () => {
  it.each(SLUGS)("renders the %s demo", (slug) => {
    render(<Section />);
    expect(document.getElementById(slug)).not.toBeNull();
  });

  it("exposes key accessible names", () => {
    render(<Section />);
    expect(screen.getAllByRole("button", { name: "Play" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Celebrate launch/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reorder Lead, position 1 of 4" })).toBeTruthy();
  });
});
