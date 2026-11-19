import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppShell } from "./app-shell";

afterEach(cleanup);

const SECTIONS = [{ items: [{ id: "home", label: "Home" }, { id: "runs", label: "Runs" }] }];

describe("AppShell", () => {
  it("renders the title, actions and content, and navigates", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(
      <AppShell product={{ name: "Relay" }} sections={SECTIONS} title="Overview" actions={<button type="button">Export</button>} onNavigate={onNavigate}>
        <p>Body</p>
      </AppShell>
    );
    expect(screen.getByRole("heading", { name: "Overview" })).toBeTruthy();
    expect(screen.getByText("Body")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Export" })).toBeTruthy();
    await user.click(screen.getAllByText("Runs")[0]);
    expect(onNavigate).toHaveBeenCalledWith("runs");
  });

  it("opens the navigation drawer and closes it with Escape, returning focus", async () => {
    const user = userEvent.setup();
    render(
      <AppShell product={{ name: "Relay" }} sections={SECTIONS} title="Overview">
        <p>Body</p>
      </AppShell>
    );
    const open = screen.getByRole("button", { name: "Open navigation" });
    await user.click(open);
    expect(screen.getByRole("dialog", { name: "Relay navigation" })).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Close navigation" }));
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.activeElement).toBe(open);
  });
});
