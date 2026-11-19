import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Section } from "./free-b";

const SLUGS = [
  "checkbox", "radio-group", "switch", "combobox", "quantity-stepper", "rating", "filter-chips", "step-slider",
  "theme-toggle", "tabs", "accordion", "pagination", "breadcrumbs", "tree-view", "tooltip", "popover", "badge",
  "progress", "skeleton", "empty-state", "alert-banner", "priority-icon", "status-icon", "date-chip",
];

class Stub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
}

beforeAll(() => {
  vi.stubGlobal("ResizeObserver", Stub);
  vi.stubGlobal("IntersectionObserver", Stub);
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false, media: query, onchange: null,
    addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false,
  }));
});

afterEach(cleanup);

describe("free-b section", () => {
  it.each(SLUGS)("renders the %s demo", (slug) => {
    render(<Section />);
    expect(document.getElementById(slug)).not.toBeNull();
  });

  it("exposes key roles and names", () => {
    render(<Section />);
    expect(screen.getByRole("switch", { name: /auto-save drafts/i })).toBeTruthy();
    expect(screen.getAllByRole("radio").length).toBeGreaterThanOrEqual(3);
    expect(screen.getAllByRole("tab").length).toBe(4);
    expect(screen.getByRole("navigation", { name: /pagination|page/i })).toBeTruthy();
    expect(screen.getByRole("tree", { name: /project files/i })).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: /all notifications/i })).toBeTruthy();
  });
});
