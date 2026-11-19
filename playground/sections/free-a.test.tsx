import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Section } from "./free-a";

const SLUGS = [
  "message", "citation", "suggestions", "feedback", "starter-cards", "citation-row", "branch-switcher",
  "approval-request", "button", "icon-button", "split-button", "bell-button", "copy-button", "input",
  "textarea", "chip-input", "currency-input", "password-input", "otp-input", "inline-edit", "number-input",
  "search-input", "phone-input", "time-input", "copy-field", "expanding-search",
];

beforeAll(() => {
  class Stub {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return []; }
  }
  vi.stubGlobal("ResizeObserver", Stub);
  vi.stubGlobal("IntersectionObserver", Stub);
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false, media: query, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {},
    addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
  }));
});

afterEach(cleanup);

describe("free-a section", () => {
  it("renders a demo for every slug", () => {
    render(<Section />);
    for (const slug of SLUGS) expect(document.getElementById(slug), slug).not.toBeNull();
  });

  it("exposes accessible names on key demos", () => {
    render(<Section />);
    expect(screen.getByRole("button", { name: "New project" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Edit" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Copy install command" })).toBeTruthy();
    expect(screen.getByLabelText("Email")).toBeTruthy();
    expect(screen.getByRole("group", { name: "Suggested prompts" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Notifications/ })).toBeTruthy();
  });
});
