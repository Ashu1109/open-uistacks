import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dialog } from "./ui/dialog";
import { DropdownMenu, pickAlign, placeMenu, typeaheadIndex, type MenuEntry } from "./ui/dropdown-menu";
import { ContextMenu } from "./ui/context-menu";
import { CommandPalette, filterCommands, fuzzyScore, groupCommands, type Command } from "./ui/command-palette";
import { NotificationCenter, formatRelative, unreadCount, type NotificationItem } from "./ui/notification-center";
import { BottomSheet, shouldDismiss } from "./ui/bottom-sheet";
import { SideSheet } from "./ui/side-sheet";
import { Coachmark, placeCallout } from "./ui/coachmark";
import { Lightbox, wrapIndex } from "./ui/lightbox";
import { HoverCard } from "./ui/hover-card";
import { ShortcutsDialog, filterShortcuts, formatKeys } from "./ui/shortcuts-dialog";
import { ImageCropper, centeredOffset, clampOffset, coverScale, cropRect, zoomOffset } from "./ui/image-cropper";
import { DisplayOptions, countChanged, type DisplayOption } from "./ui/display-options";
import { FilterBar, countActive, toggleValue } from "./ui/filter-bar";
import { AppSwitcher, gridMove } from "./ui/app-switcher";
import { SidebarNav, groupOf } from "./ui/sidebar-nav";
import { FormWizard, clampStep } from "./ui/form-wizard";
import { ScrollSpyToc, pickActive } from "./ui/scroll-spy-toc";
import { BottomTabBar, formatBadge } from "./ui/bottom-tab-bar";
import { Dock, magnify } from "./ui/dock";
import { Toaster, toast } from "./ui/toast";
import { OnboardingChecklist, progressOf } from "./ui/onboarding-checklist";
import { UsageMeter, usageLevel } from "./ui/usage-meter";
import { ForecastAlert, forecastUsage } from "./ui/forecast-alert";

afterEach(() => {
  toast.dismiss();
  cleanup();
  vi.unstubAllGlobals();
});

const DAY = 86_400_000;
const gone = (role: string, name?: string) => waitFor(() => expect(screen.queryByRole(role, name ? { name } : undefined)).toBeNull());

describe("pure helpers", () => {
  it("wraps and clamps indices", () => {
    expect(wrapIndex(-1, 3)).toBe(2);
    expect(wrapIndex(3, 3)).toBe(0);
    expect(wrapIndex(1, 0)).toBe(0);
    expect(clampStep(9, 3)).toBe(2);
    expect(clampStep(-2, 3)).toBe(0);
  });

  it("flips menus inside the viewport", () => {
    expect(placeMenu(100, 100, 200, 300, 1000, 800)).toEqual({ left: 100, top: 100 });
    expect(placeMenu(900, 700, 200, 300, 1000, 800)).toEqual({ left: 700, top: 400 });
    expect(pickAlign("start", 500, 100)).toBe("end");
    expect(pickAlign("start", 100, 500)).toBe("start");
  });

  it("finds typeahead matches, cycling single letters", () => {
    const labels = ["Rename", "Duplicate", "Delete"];
    expect(typeaheadIndex(labels, 0, "d")).toBe(1);
    expect(typeaheadIndex(labels, 1, "d")).toBe(2);
    expect(typeaheadIndex(labels, 0, "del")).toBe(2);
    expect(typeaheadIndex(labels, 0, "z")).toBe(-1);
  });

  it("scores fuzzy matches and rejects non-subsequences", () => {
    expect(fuzzyScore("xyz", "Command")).toBeNull();
    expect(fuzzyScore("cmd", "Command")?.indices).toEqual([0, 2, 6]);
    expect(fuzzyScore("", "anything")).toEqual({ score: 0, indices: [] });
    const strong = fuzzyScore("sa", "Save file");
    const weak = fuzzyScore("sa", "Share via email");
    expect(strong && weak && strong.score > weak.score).toBe(true);
  });

  it("ranks, keyword-matches and groups commands", () => {
    const run = () => {};
    const commands: Command[] = [
      { id: "share", label: "Share via email", group: "File", onSelect: run },
      { id: "save", label: "Save file", group: "File", onSelect: run },
      { id: "exit", label: "Exit", keywords: ["quit"], group: "App", onSelect: run },
    ];
    expect(filterCommands(commands, "sa").map((r) => r.command.id)).toEqual(["save", "share"]);
    expect(filterCommands(commands, "quit").map((r) => r.command.id)).toEqual(["exit"]);
    expect(filterCommands(commands, "").map((r) => r.command.id)).toEqual(["share", "save", "exit"]);
    expect(groupCommands(filterCommands(commands, "")).map((g) => [g.name, g.items.length])).toEqual([["File", 2], ["App", 1]]);
  });

  it("formats notification ages and counts unread", () => {
    const now = 1_000_000_000;
    expect(formatRelative(now - 10_000, now)).toBe("just now");
    expect(formatRelative(now - 5 * 60_000, now)).toBe("5m ago");
    expect(formatRelative(now - 3 * 3_600_000, now)).toBe("3h ago");
    expect(formatRelative(now - 2 * DAY, now)).toBe("2d ago");
    expect(formatRelative(now - 15 * DAY, now)).toBe("2w ago");
    expect(unreadCount([{ id: "a", title: "A", time: 0 }, { id: "b", title: "B", time: 0, read: true }])).toBe(1);
  });

  it("decides sheet dismissal from distance or flick speed", () => {
    expect(shouldDismiss(150, 0)).toBe(true);
    expect(shouldDismiss(40, 900)).toBe(true);
    expect(shouldDismiss(40, 100)).toBe(false);
  });

  it("places callouts on a side that fits and clamps to the viewport", () => {
    const viewport = { width: 1000, height: 800 };
    const size = { width: 300, height: 150 };
    const low = { left: 400, top: 700, width: 100, height: 40 };
    expect(placeCallout(low, size, viewport, "bottom").side).toBe("top");
    expect(placeCallout({ left: 400, top: 100, width: 100, height: 40 }, size, viewport, "bottom").side).toBe("bottom");
    const edge = placeCallout({ left: 0, top: 300, width: 40, height: 40 }, size, viewport, "top");
    expect(edge.left).toBeGreaterThanOrEqual(8);
  });

  it("formats and filters keyboard shortcuts", () => {
    expect(formatKeys(["mod", "shift", "k"], true)).toEqual(["⌘", "⇧", "K"]);
    expect(formatKeys(["mod", "enter"], false)).toEqual(["Ctrl", "Enter"]);
    const groups = [
      { title: "Edit", shortcuts: [{ label: "Copy", keys: ["mod", "c"] }, { label: "Paste", keys: ["mod", "v"] }] },
      { title: "View", shortcuts: [{ label: "Zoom in", keys: ["mod", "+"] }] },
    ];
    expect(filterShortcuts(groups, "cop")).toHaveLength(1);
    expect(filterShortcuts(groups, "view")[0].shortcuts).toHaveLength(1);
    expect(filterShortcuts(groups, "")).toBe(groups);
  });

  it("does crop rectangle math", () => {
    const image = { width: 1000, height: 500 };
    const frame = { width: 200, height: 200 };
    expect(coverScale(image, frame)).toBeCloseTo(0.4);
    const shown = { width: 400, height: 200 };
    const centered = centeredOffset(shown, frame);
    expect(centered).toEqual({ x: -100, y: 0 });
    expect(cropRect(image, frame, 1, centered)).toEqual({ x: 250, y: 0, width: 500, height: 500 });
    const zoomed = zoomOffset(centered, 0.4, 0.8, frame);
    expect(zoomed).toEqual({ x: -300, y: -100 });
    expect(cropRect(image, frame, 2, zoomed)).toEqual({ x: 375, y: 125, width: 250, height: 250 });
    expect(clampOffset({ x: 50, y: -999 }, shown, frame)).toEqual({ x: 0, y: 0 });
    expect(clampOffset({ x: -999, y: 0 }, shown, frame)).toEqual({ x: -200, y: 0 });
  });

  it("toggles filters, counts them and counts changed display settings", () => {
    expect(toggleValue(["a"], "b")).toEqual(["a", "b"]);
    expect(toggleValue(["a", "b"], "a")).toEqual(["b"]);
    expect(countActive({ x: ["1", "2"], y: [] , z: ["3"] })).toBe(3);
    const options: DisplayOption[] = [{ id: "dense", label: "Dense", type: "toggle" }, { id: "sort", label: "Sort", type: "select", choices: [{ value: "a", label: "A" }] }];
    expect(countChanged(options, { dense: true, sort: "a" }, { dense: false, sort: "a" })).toBe(1);
  });

  it("moves through a grid and finds nav groups", () => {
    expect(gridMove(0, "ArrowRight", 3, 7)).toBe(1);
    expect(gridMove(2, "ArrowRight", 3, 7)).toBe(3);
    expect(gridMove(4, "ArrowDown", 3, 7)).toBe(4);
    expect(gridMove(1, "ArrowDown", 3, 7)).toBe(4);
    expect(gridMove(0, "ArrowUp", 3, 7)).toBe(0);
    expect(gridMove(3, "End", 3, 7)).toBe(6);
    const sections = [{ items: [{ id: "g", label: "G", children: [{ id: "c", label: "C" }] }] }];
    expect(groupOf(sections, "c")).toBe("g");
    expect(groupOf(sections, "zz")).toBeUndefined();
  });

  it("picks the first visible section, else keeps the current one", () => {
    expect(pickActive(["a", "b", "c"], new Set(["c", "b"]), "a")).toBe("b");
    expect(pickActive(["a", "b"], new Set(), "b")).toBe("b");
  });

  it("formats badges and magnifies near the pointer", () => {
    expect(formatBadge(0)).toBe("");
    expect(formatBadge(7)).toBe("7");
    expect(formatBadge(120)).toBe("99+");
    expect(magnify(0, 44, 72, 132)).toBe(72);
    expect(magnify(132, 44, 72, 132)).toBe(44);
    expect(magnify(Infinity, 44, 72, 132)).toBe(44);
    expect(magnify(66, 44, 72, 132)).toBeCloseTo(58);
    expect(magnify(-66, 44, 72, 132)).toBeCloseTo(58);
  });

  it("computes progress, usage levels and forecasts", () => {
    const tasks = [{ id: "a", title: "A" }, { id: "b", title: "B" }, { id: "c", title: "C" }, { id: "d", title: "D" }];
    expect(progressOf(tasks, ["a", "d", "ghost"])).toEqual({ done: 2, total: 4, percent: 50 });
    expect(progressOf([], [])).toEqual({ done: 0, total: 0, percent: 0 });
    expect(usageLevel(0.5)).toBe("ok");
    expect(usageLevel(0.85)).toBe("warning");
    expect(usageLevel(0.97)).toBe("danger");
    const period = { periodStart: 0, periodEnd: 30 * DAY, now: 10 * DAY, limit: 1000 };
    expect(forecastUsage({ ...period, used: 200 })).toMatchObject({ projected: 600, status: "on-track", exhaustsAt: null });
    expect(forecastUsage({ ...period, used: 300 }).status).toBe("watch");
    expect(forecastUsage({ ...period, used: 500 })).toMatchObject({ projected: 1500, status: "over", exhaustsAt: 20 * DAY });
    expect(forecastUsage({ ...period, used: 1000 }).status).toBe("over");
  });
});

describe("Dialog", () => {
  const open = () =>
    render(
      <Dialog
        trigger={<button>Delete project</button>}
        title="Delete project?"
        description="This cannot be undone."
        footer={<><button>Cancel</button><button>Delete</button></>}
      >
        Body text
      </Dialog>,
    );

  it("opens as a labelled modal dialog in the body, locks scroll and restores focus on Escape", async () => {
    const user = userEvent.setup();
    open();
    const trigger = screen.getByRole("button", { name: "Delete project" });
    await user.click(trigger);

    const dialog = screen.getByRole("dialog", { name: "Delete project?" });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.closest("body")).toBe(document.body);
    expect(dialog.getAttribute("aria-describedby")).toBeTruthy();
    expect(document.body.style.overflow).toBe("hidden");
    expect(screen.getByRole("button", { name: "Cancel" })).toBe(document.activeElement);

    await user.keyboard("{Escape}");
    await gone("dialog");
    expect(trigger).toBe(document.activeElement);
    expect(document.body.style.overflow).toBe("");
  });

  it("traps Tab focus and closes on backdrop click", async () => {
    const user = userEvent.setup();
    open();
    await user.click(screen.getByRole("button", { name: "Delete project" }));
    await user.tab({ shift: true });
    expect(screen.getByRole("button", { name: "Close" })).toBe(document.activeElement);
    await user.tab();
    expect(screen.getByRole("button", { name: "Cancel" })).toBe(document.activeElement);

    await user.click(document.querySelector("[data-modal-backdrop]") as HTMLElement);
    await gone("dialog");
  });

  it("stays open on backdrop click when persistent, and reports open changes", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Dialog defaultOpen persistent title="Saving" onOpenChange={onOpenChange} />);
    await user.click(document.querySelector("[data-modal-backdrop]") as HTMLElement);
    expect(screen.getByRole("dialog", { name: "Saving" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe("DropdownMenu", () => {
  const items: MenuEntry[] = [
    { id: "rename", label: "Rename" },
    { id: "dup", label: "Duplicate" },
    { id: "sep", type: "separator" },
    { id: "off", label: "Archive", disabled: true },
    { id: "del", label: "Delete", danger: true },
  ];

  it("opens, moves with arrows skipping disabled items, and selects", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<DropdownMenu trigger={<button>Actions</button>} items={items.map((i) => (i.id === "del" && !i.type ? { ...i, onSelect } : i))} />);
    const trigger = screen.getByRole("button", { name: "Actions" });
    expect(trigger.getAttribute("aria-haspopup")).toBe("menu");

    await user.click(trigger);
    expect(screen.getByRole("menu", { name: "Menu" })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "Rename" })).toBe(document.activeElement);
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Delete" })).toBe(document.activeElement);
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Rename" })).toBe(document.activeElement);
    await user.keyboard("{End}{Enter}");
    expect(onSelect).toHaveBeenCalledOnce();
    await gone("menu");
    expect(trigger).toBe(document.activeElement);
  });

  it("jumps by typeahead and closes with Escape", async () => {
    const user = userEvent.setup();
    render(<DropdownMenu trigger={<button>Actions</button>} items={items} />);
    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.keyboard("d");
    expect(screen.getByRole("menuitem", { name: "Duplicate" })).toBe(document.activeElement);
    await user.keyboard("{Escape}");
    await gone("menu");
    expect(screen.getByRole("button", { name: "Actions" })).toBe(document.activeElement);
  });

  it("opens from the keyboard and exposes checkbox items", async () => {
    const user = userEvent.setup();
    render(<DropdownMenu trigger={<button>View</button>} items={[{ id: "g", label: "Grid", checked: true, keepOpen: true }]} />);
    screen.getByRole("button", { name: "View" }).focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitemcheckbox", { name: "Grid" }).getAttribute("aria-checked")).toBe("true");
  });
});

describe("ContextMenu", () => {
  it("opens on right click at the pointer and closes with Escape, focusing the area", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ContextMenu label="Canvas actions" items={[{ id: "paste", label: "Paste", onSelect }, { id: "clear", label: "Clear" }]}><p>Canvas</p></ContextMenu>);
    const area = screen.getByLabelText("Canvas actions", { selector: "div[tabindex]" });
    fireEvent.contextMenu(area, { clientX: 40, clientY: 60 });

    const menu = await screen.findByRole("menu", { name: "Canvas actions" });
    expect(menu.closest("body")).toBe(document.body);
    expect(screen.getByRole("menuitem", { name: "Paste" })).toBe(document.activeElement);
    await user.keyboard("{Escape}");
    await gone("menu");
    expect(area).toBe(document.activeElement);

    fireEvent.contextMenu(area, { clientX: 10, clientY: 10 });
    await user.click(await screen.findByRole("menuitem", { name: "Paste" }));
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it("opens from the keyboard", async () => {
    const user = userEvent.setup();
    render(<ContextMenu label="Row" items={[{ id: "a", label: "Open" }]}><p>Row</p></ContextMenu>);
    screen.getByLabelText("Row", { selector: "div[tabindex]" }).focus();
    await user.keyboard("{Shift>}{F10}{/Shift}");
    expect(await screen.findByRole("menuitem", { name: "Open" })).toBeTruthy();
  });
});

describe("CommandPalette", () => {
  const make = (onSelect = vi.fn()): Command[] => [
    { id: "new", label: "New file", group: "File", onSelect },
    { id: "save", label: "Save file", group: "File", shortcut: "⌘S", onSelect },
    { id: "theme", label: "Toggle theme", group: "View", onSelect },
  ];

  it("renders grouped options in a modal dialog", () => {
    render(<CommandPalette defaultOpen commands={make()} />);
    expect(screen.getByRole("dialog", { name: "Command palette" }).getAttribute("aria-modal")).toBe("true");
    expect(screen.getAllByRole("option")).toHaveLength(3);
    expect(screen.getByRole("group", { name: "File" })).toBeTruthy();
    expect(screen.getByRole("combobox")).toBe(document.activeElement);
  });

  it("filters fuzzily, navigates and runs the active command on Enter", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<CommandPalette defaultOpen commands={make(onSelect)} />);
    await user.keyboard("sv");
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["Save file⌘S"]);
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledOnce();
    await gone("dialog");
  });

  it("moves the active option with arrows and shows an empty state", async () => {
    const user = userEvent.setup();
    render(<CommandPalette defaultOpen commands={make()} />);
    const input = screen.getByRole("combobox");
    const first = input.getAttribute("aria-activedescendant");
    await user.keyboard("{ArrowDown}");
    expect(input.getAttribute("aria-activedescendant")).not.toBe(first);
    await user.keyboard("zzzz");
    expect(screen.getByText("No matching commands")).toBeTruthy();
  });

  it("toggles with Ctrl+K", async () => {
    const user = userEvent.setup();
    render(<CommandPalette commands={make()} />);
    expect(screen.queryByRole("dialog")).toBeNull();
    await user.keyboard("{Control>}k{/Control}");
    expect(screen.getByRole("dialog", { name: "Command palette" })).toBeTruthy();
    await user.keyboard("{Escape}");
    await gone("dialog");
  });
});

describe("BottomSheet and SideSheet", () => {
  it("opens a labelled bottom sheet from its trigger and closes on Escape", async () => {
    const user = userEvent.setup();
    render(<BottomSheet trigger={<button>Share</button>} title="Share link" description="Anyone can view.">Link</BottomSheet>);
    await user.click(screen.getByRole("button", { name: "Share" }));
    expect(screen.getByRole("dialog", { name: "Share link" }).getAttribute("aria-modal")).toBe("true");
    expect(screen.getByRole("heading", { name: "Share link" })).toBe(document.activeElement);
    await user.keyboard("{Escape}");
    await gone("dialog");
    expect(screen.getByRole("button", { name: "Share" })).toBe(document.activeElement);
  });

  it("renders a side sheet with a footer and closes on its close button", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<SideSheet defaultOpen onOpenChange={onOpenChange} title="Filters" footer={<button>Apply</button>}>Options</SideSheet>);
    expect(screen.getByRole("dialog", { name: "Filters" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Apply" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    await gone("dialog");
  });
});

describe("Lightbox", () => {
  const images = [
    { src: "a.png", alt: "First", caption: "Caption one" },
    { src: "b.png", alt: "Second" },
    { src: "c.png", alt: "Third" },
  ];

  it("shows the image with a counter and pages with buttons and arrow keys, wrapping", async () => {
    const user = userEvent.setup();
    render(<Lightbox images={images} defaultOpen />);
    expect(screen.getByRole("dialog", { name: "Image viewer" }).getAttribute("aria-modal")).toBe("true");
    expect(screen.getByText("1 / 3")).toBeTruthy();
    expect(screen.getByText("Caption one")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Next image" }));
    expect(screen.getByText("2 / 3")).toBeTruthy();
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(screen.getByText("3 / 3")).toBeTruthy();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByText("1 / 3")).toBeTruthy();
  });

  it("opens from a trigger and closes on Escape", async () => {
    const user = userEvent.setup();
    render(<Lightbox images={images} trigger={<button>Open gallery</button>} />);
    await user.click(screen.getByRole("button", { name: "Open gallery" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    await user.keyboard("{Escape}");
    await gone("dialog");
    expect(screen.getByRole("button", { name: "Open gallery" })).toBe(document.activeElement);
  });
});

describe("ShortcutsDialog", () => {
  const groups = [
    { title: "Editing", shortcuts: [{ label: "Copy", keys: ["mod", "c"] }, { label: "Paste", keys: ["mod", "v"] }] },
    { title: "Navigation", shortcuts: [{ label: "Go to inbox", keys: ["g", "i"] }] },
  ];

  it("toggles on ? and filters the list", async () => {
    const user = userEvent.setup();
    render(<ShortcutsDialog groups={groups} />);
    await user.keyboard("?");
    expect(screen.getByRole("dialog", { name: "Keyboard shortcuts" }).getAttribute("aria-modal")).toBe("true");
    expect(screen.getByText("Go to inbox")).toBeTruthy();
    await user.type(screen.getByRole("textbox", { name: "Filter shortcuts" }), "copy");
    expect(screen.queryByText("Go to inbox")).toBeNull();
    expect(screen.getByText("Copy")).toBeTruthy();
    await user.type(screen.getByRole("textbox", { name: "Filter shortcuts" }), "qq");
    expect(screen.getByText("No shortcuts match.")).toBeTruthy();
  });

  it("renders key caps and closes on Escape", async () => {
    const user = userEvent.setup();
    render(<ShortcutsDialog groups={groups} defaultOpen hotkey={null} />);
    expect(screen.getAllByText("Ctrl")).toHaveLength(2);
    await user.keyboard("{Escape}");
    await gone("dialog");
  });
});

describe("HoverCard", () => {
  it("opens on keyboard focus with aria-describedby and closes on Escape", async () => {
    const user = userEvent.setup();
    render(<HoverCard trigger={<a href="#u">@sam</a>} openDelay={0} closeDelay={0} label="Profile">Sam is a designer.</HoverCard>);
    await user.tab();
    const card = await screen.findByRole("group", { name: "Profile" });
    expect(screen.getByRole("link", { name: "@sam" }).getAttribute("aria-describedby")).toBe(card.id);
    await user.keyboard("{Escape}");
    await gone("group", "Profile");
  });

  it("opens on hover and closes when the pointer leaves", async () => {
    const user = userEvent.setup();
    render(<HoverCard trigger={<a href="#u">@sam</a>} openDelay={0} closeDelay={0}>Details</HoverCard>);
    await user.hover(screen.getByRole("link", { name: "@sam" }));
    await screen.findByText("Details");
    await user.unhover(screen.getByRole("link", { name: "@sam" }));
    await waitFor(() => expect(screen.queryByText("Details")).toBeNull());
  });
});

describe("Coachmark", () => {
  const steps = [
    { target: "#anchor", title: "Welcome", body: "Start here." },
    { target: "#missing", title: "All done", body: "No target, centered." },
  ];

  it("walks through steps and finishes", async () => {
    const user = userEvent.setup();
    const onFinish = vi.fn();
    render(<><button id="anchor">Target</button><Coachmark steps={steps} defaultOpen onFinish={onFinish} /></>);
    expect(screen.getByRole("dialog", { name: "Welcome" })).toBeTruthy();
    expect(screen.getByText("Step 1 of 2")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Next" })).toBe(document.activeElement);

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("dialog", { name: "All done" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("dialog", { name: "Welcome" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Done" }));
    expect(onFinish).toHaveBeenCalledOnce();
    await gone("dialog");
  });

  it("skips on Escape", async () => {
    const user = userEvent.setup();
    const onSkip = vi.fn();
    render(<><button id="anchor">Target</button><Coachmark steps={steps} defaultOpen onSkip={onSkip} /></>);
    await user.keyboard("{Escape}");
    expect(onSkip).toHaveBeenCalledOnce();
    await gone("dialog");
  });
});

describe("ImageCropper", () => {
  it("reports the initial crop and updates it with the zoom slider and arrow keys", async () => {
    const user = userEvent.setup();
    const onCropChange = vi.fn();
    render(<ImageCropper src="photo.png" naturalSize={{ width: 1000, height: 500 }} width={200} onCropChange={onCropChange} />);
    expect(screen.getByRole("img", { name: "Image to crop" })).toBeTruthy();
    expect(onCropChange).toHaveBeenLastCalledWith({ x: 250, y: 0, width: 500, height: 500 });

    fireEvent.change(screen.getByRole("slider", { name: "Zoom" }), { target: { value: "2" } });
    expect(onCropChange).toHaveBeenLastCalledWith({ x: 375, y: 125, width: 250, height: 250 });
    expect(screen.getByText(/250 × 250 px at \(375, 125\)/)).toBeTruthy();

    screen.getByRole("group", { name: "Crop area" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(onCropChange.mock.lastCall?.[0].x).toBeGreaterThan(375);

    await user.click(screen.getByRole("button", { name: "Reset crop" }));
    expect(onCropChange).toHaveBeenLastCalledWith({ x: 250, y: 0, width: 500, height: 500 });
  });
});

describe("DisplayOptions", () => {
  const options: DisplayOption[] = [
    { id: "layout", label: "Layout", type: "segmented", choices: [{ value: "list", label: "List" }, { value: "board", label: "Board" }] },
    { id: "sub", label: "Show subtasks", type: "toggle" },
    { id: "sort", label: "Sort by", type: "select", choices: [{ value: "date", label: "Date" }, { value: "name", label: "Name" }] },
  ];
  const defaults = { layout: "list", sub: false, sort: "date" };

  it("opens a popover, edits settings, counts changes and resets", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<DisplayOptions options={options} defaultValue={defaults} onValueChange={onValueChange} />);
    await user.click(screen.getByRole("button", { name: "Display" }));
    expect(screen.getByRole("dialog", { name: "Display options" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "List" }).getAttribute("aria-checked")).toBe("true");

    await user.click(screen.getByRole("radio", { name: "Board" }));
    expect(onValueChange).toHaveBeenLastCalledWith({ ...defaults, layout: "board" });
    await user.click(screen.getByRole("switch", { name: "Show subtasks" }));
    expect(screen.getByRole("switch", { name: "Show subtasks" }).getAttribute("aria-checked")).toBe("true");
    await user.selectOptions(screen.getByLabelText("Sort by"), "name");
    expect(screen.getByLabelText("3 changed")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Reset to default" }));
    expect(onValueChange).toHaveBeenLastCalledWith(defaults);
  });

  it("supports arrow keys on the segmented control and Escape", async () => {
    const user = userEvent.setup();
    render(<DisplayOptions options={options} defaultValue={defaults} />);
    await user.click(screen.getByRole("button", { name: "Display" }));
    screen.getByRole("radio", { name: "List" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "Board" }).getAttribute("aria-checked")).toBe("true");
    await user.keyboard("{Escape}");
    await gone("dialog");
    expect(screen.getByRole("button", { name: /Display/ })).toBe(document.activeElement);
  });
});

describe("NotificationCenter", () => {
  const now = 10_000_000;
  const list: NotificationItem[] = [
    { id: "1", title: "Build finished", body: "main passed", time: now - 120_000 },
    { id: "2", title: "New comment", time: now - 3_600_000 * 3 },
    { id: "3", title: "Invite accepted", time: now - DAY * 2, read: true },
  ];

  it("shows the unread count, lists items and marks everything read", async () => {
    const user = userEvent.setup();
    render(<NotificationCenter defaultNotifications={list} now={now} />);
    await user.click(screen.getByRole("button", { name: "Notifications, 2 unread" }));
    expect(screen.getByRole("dialog", { name: "Notifications" })).toBeTruthy();
    expect(screen.getByText("2m ago")).toBeTruthy();
    expect(screen.getByText("3h ago")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Mark all read" }));
    expect(screen.getByRole("button", { name: "Notifications" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Mark all read" }).hasAttribute("disabled")).toBe(true);
  });

  it("filters to unread, dismisses an item, opens one and closes on Escape", async () => {
    const user = userEvent.setup();
    const onOpenNotification = vi.fn();
    render(<NotificationCenter defaultNotifications={list} now={now} onOpenNotification={onOpenNotification} />);
    await user.click(screen.getByRole("button", { name: /Notifications/ }));

    await user.click(screen.getByRole("tab", { name: /unread/i }));
    expect(screen.queryByText("Invite accepted")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Dismiss New comment" }));
    expect(screen.queryByText("New comment")).toBeNull();

    await user.click(screen.getAllByRole("button", { name: /Build finished/ })[0]);
    expect(onOpenNotification).toHaveBeenCalledWith(expect.objectContaining({ id: "1" }));
    expect(screen.getByText("You're all caught up")).toBeTruthy();

    await user.keyboard("{Escape}");
    await gone("dialog");
  });
});

describe("FilterBar", () => {
  const filters = [
    { id: "status", label: "Status", options: [{ value: "open", label: "Open" }, { value: "closed", label: "Closed" }] },
    { id: "owner", label: "Owner", options: [{ value: "me", label: "Me" }] },
  ];

  it("selects options through checkbox menus, shows removable chips and clears all", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<FilterBar filters={filters} onValueChange={onValueChange} />);
    await user.click(screen.getByRole("button", { name: "Status" }));
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Open" }));
    expect(onValueChange).toHaveBeenLastCalledWith({ status: ["open"] });
    expect(screen.getByRole("menuitemcheckbox", { name: "Open" }).getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("button", { name: "Remove Status: Open" })).toBeTruthy();
    expect(screen.getByText("1 filter applied")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Clear all" }));
    expect(onValueChange).toHaveBeenLastCalledWith({});
    expect(screen.queryByRole("button", { name: "Remove Status: Open" })).toBeNull();
  });

  it("removes a value from its chip", async () => {
    const user = userEvent.setup();
    render(<FilterBar filters={filters} defaultValue={{ owner: ["me"] }} />);
    await user.click(screen.getByRole("button", { name: "Remove Owner: Me" }));
    expect(screen.getByText("No filters applied")).toBeTruthy();
  });
});

describe("AppSwitcher", () => {
  const apps = ["Mail", "Docs", "Chat", "Maps"].map((name) => ({ id: name.toLowerCase(), name, icon: <span>{name[0]}</span> }));

  it("opens a grid, focuses the current app, moves with arrows and closes on Escape", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<AppSwitcher apps={apps} currentId="docs" columns={2} onSelect={onSelect} />);
    await user.click(screen.getByRole("button", { name: "Switch app" }));
    expect(screen.getByRole("group", { name: "Switch app" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Docs" })).toBe(document.activeElement);
    expect(screen.getByRole("button", { name: "Docs" }).getAttribute("aria-current")).toBe("true");

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("button", { name: "Maps" })).toBe(document.activeElement);
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("button", { name: "Chat" })).toBe(document.activeElement);
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "chat" }));
    await gone("group");
    expect(screen.getByRole("button", { name: "Switch app" })).toBe(document.activeElement);
  });
});

describe("SidebarNav", () => {
  const sections = [
    {
      title: "Workspace",
      items: [
        { id: "inbox", label: "Inbox", badge: 3 },
        { id: "projects", label: "Projects", children: [{ id: "alpha", label: "Alpha" }, { id: "beta", label: "Beta" }] },
      ],
    },
  ];

  it("marks the current page, expands groups and reports navigation", async () => {
    const user = userEvent.setup();
    const onActiveChange = vi.fn();
    render(<SidebarNav sections={sections} defaultActiveId="inbox" onActiveChange={onActiveChange} />);
    expect(screen.getByRole("navigation", { name: "Sidebar" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Inbox/ }).getAttribute("aria-current")).toBe("page");
    expect(screen.queryByRole("button", { name: "Alpha" })).toBeNull();

    const group = screen.getByRole("button", { name: "Projects" });
    expect(group.getAttribute("aria-expanded")).toBe("false");
    await user.click(group);
    expect(group.getAttribute("aria-expanded")).toBe("true");
    await user.click(await screen.findByRole("button", { name: "Beta" }));
    expect(onActiveChange).toHaveBeenCalledWith("beta");
    expect(screen.getByRole("button", { name: "Beta" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("button", { name: /Inbox/ }).getAttribute("aria-current")).toBeNull();
  });

  it("collapses to an icon rail that keeps accessible names, and moves focus with arrows", async () => {
    const user = userEvent.setup();
    render(<SidebarNav sections={sections} />);
    screen.getByRole("button", { name: /Inbox/ }).focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("button", { name: "Projects" })).toBe(document.activeElement);

    await user.click(screen.getByRole("button", { name: "Collapse sidebar" }));
    expect(screen.getByRole("button", { name: "Expand sidebar" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Inbox" }).getAttribute("title")).toBe("Inbox");
  });
});

describe("FormWizard", () => {
  it("blocks Next with an announced error, then advances and finishes", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    let name = "";
    const steps = [
      { id: "a", title: "Account", content: <p>Account form</p>, validate: () => (name ? null : "Enter a name to continue.") },
      { id: "b", title: "Review", content: <p>Review form</p> },
    ];
    render(<FormWizard steps={steps} onComplete={onComplete} />);
    expect(screen.getByText("Step 1 of 2")).toBeTruthy();
    expect(screen.getByRole("group", { name: "Account" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Back" }).hasAttribute("disabled")).toBe(true);

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("alert").textContent).toBe("Enter a name to continue.");
    expect(screen.getByText("Step 1 of 2")).toBeTruthy();

    name = "Ada";
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByRole("group", { name: "Review" })).toBeTruthy();
    expect(screen.getByText("Step 2 of 2")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toBe("");
    expect(document.querySelector('[aria-current="step"]')?.textContent).toContain("Review");

    await user.click(screen.getByRole("button", { name: "Finish" }));
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("goes back through completed steps from the stepper", async () => {
    const user = userEvent.setup();
    const onStepChange = vi.fn();
    const steps = [{ id: "a", title: "One", content: "1" }, { id: "b", title: "Two", content: "2" }];
    render(<FormWizard steps={steps} defaultStep={1} onStepChange={onStepChange} />);
    await user.click(screen.getByRole("button", { name: "Go back to step 1: One" }));
    expect(onStepChange).toHaveBeenCalledWith(0);
  });
});

describe("ScrollSpyToc", () => {
  const items = [{ id: "intro", label: "Intro" }, { id: "usage", label: "Usage", level: 2 as const }];

  it("renders links and marks the clicked section as current", async () => {
    const user = userEvent.setup();
    const onActiveChange = vi.fn();
    render(<ScrollSpyToc items={items} onActiveChange={onActiveChange} />);
    expect(screen.getByRole("navigation", { name: "On this page" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Intro" }).getAttribute("aria-current")).toBe("location");
    await user.click(screen.getByRole("link", { name: "Usage" }));
    expect(onActiveChange).toHaveBeenCalledWith("usage");
    expect(screen.getByRole("link", { name: "Usage" }).getAttribute("aria-current")).toBe("location");
  });

  it("follows IntersectionObserver reports when available", () => {
    let report: (entries: Partial<IntersectionObserverEntry>[]) => void = () => {};
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: (entries: Partial<IntersectionObserverEntry>[]) => void) {
          report = callback;
        }
        observe() {}
        disconnect() {}
      },
    );
    render(<><h2 id="intro">Intro</h2><h2 id="usage">Usage</h2><ScrollSpyToc items={items} /></>);
    act(() => report([{ target: document.getElementById("usage") as Element, isIntersecting: true }]));
    expect(screen.getByRole("link", { name: "Usage" }).getAttribute("aria-current")).toBe("location");
    act(() => report([{ target: document.getElementById("intro") as Element, isIntersecting: true }]));
    expect(screen.getByRole("link", { name: "Intro" }).getAttribute("aria-current")).toBe("location");
  });
});

describe("BottomTabBar", () => {
  const tabs = [
    { id: "home", label: "Home", icon: <span /> },
    { id: "inbox", label: "Inbox", icon: <span />, badge: 120 },
    { id: "me", label: "Profile", icon: <span /> },
  ];

  it("selects tabs, shows capped badges and supports arrow focus", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<BottomTabBar tabs={tabs} onValueChange={onValueChange} />);
    expect(screen.getByRole("navigation", { name: "Primary" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Home/ }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByText("99+")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /Inbox/ }));
    expect(onValueChange).toHaveBeenCalledWith("inbox");
    expect(screen.getByRole("button", { name: /Inbox/ }).getAttribute("aria-current")).toBe("page");

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: /Profile/ })).toBe(document.activeElement);
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: /Home/ })).toBe(document.activeElement);
  });
});

describe("Dock", () => {
  it("renders a toolbar of labelled buttons, selects and moves focus with arrows", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const items = [
      { id: "files", label: "Files", icon: <span />, active: true, onSelect },
      { id: "mail", label: "Mail", icon: <span /> },
    ];
    render(<Dock items={items} />);
    expect(screen.getByRole("toolbar", { name: "Dock" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Files" })).toBeTruthy();
    expect(screen.getByText("(running)")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Files" }));
    expect(onSelect).toHaveBeenCalledOnce();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: "Mail" })).toBe(document.activeElement);
  });
});

describe("Toast", () => {
  it("shows a toast in a live region and auto-dismisses it", async () => {
    render(<Toaster />);
    expect(screen.getByRole("region", { name: "Notifications" }).getAttribute("aria-live")).toBe("polite");
    act(() => {
      toast.success({ title: "Saved", description: "All changes stored.", duration: 80 });
    });
    expect(screen.getByText("Saved")).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain("All changes stored.");
    await waitFor(() => expect(screen.queryByText("Saved")).toBeNull());
  });

  it("pauses the timer while hovered", async () => {
    const user = userEvent.setup();
    render(<Toaster />);
    act(() => {
      toast({ title: "Hold on", duration: 200 });
    });
    const item = screen.getByText("Hold on").closest("li") as HTMLElement;
    await user.hover(item);
    await new Promise((r) => setTimeout(r, 450));
    expect(screen.getByText("Hold on")).toBeTruthy();
    await user.unhover(item);
    await waitFor(() => expect(screen.queryByText("Hold on")).toBeNull(), { timeout: 2000 });
  });

  it("queues past the visible maximum, uses alert for errors and runs actions", async () => {
    const user = userEvent.setup();
    const onUndo = vi.fn();
    render(<Toaster max={2} />);
    act(() => {
      toast({ title: "One", duration: 0, action: { label: "Undo", onClick: onUndo } });
      toast.error({ title: "Two", duration: 0 });
      toast({ title: "Three", duration: 0 });
    });
    expect(screen.queryByText("Three")).toBeNull();
    expect(screen.getByRole("alert").textContent).toContain("Two");

    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(onUndo).toHaveBeenCalledOnce();
    expect(await screen.findByText("Three")).toBeTruthy();
    await waitFor(() => expect(screen.queryByText("One")).toBeNull());

    await user.click(screen.getAllByRole("button", { name: "Dismiss notification" })[0]);
    await waitFor(() => expect(screen.queryByText("Two")).toBeNull());
  });
});

describe("OnboardingChecklist", () => {
  const tasks = [
    { id: "a", title: "Create a project", description: "Pick a name.", action: { label: "Create", onClick: vi.fn() } },
    { id: "b", title: "Invite a teammate" },
  ];

  it("shows progress, toggles tasks and celebrates completion", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(<OnboardingChecklist tasks={tasks} defaultCompleted={["a"]} onDismiss={onDismiss} />);
    const bar = screen.getByRole("progressbar", { name: "Get started progress" });
    expect(bar.getAttribute("aria-valuenow")).toBe("1");
    expect(bar.getAttribute("aria-valuetext")).toBe("1 of 2 complete");
    expect(screen.getByRole("checkbox", { name: "Create a project" }).getAttribute("aria-checked")).toBe("true");

    await user.click(screen.getByRole("checkbox", { name: "Invite a teammate" }));
    expect(bar.getAttribute("aria-valuenow")).toBe("2");
    expect(screen.getByText("All set. Nice work.")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("runs a task action and collapses", async () => {
    const user = userEvent.setup();
    render(<OnboardingChecklist tasks={tasks} />);
    await user.click(screen.getByRole("button", { name: "Create" }));
    expect(tasks[0].action?.onClick).toHaveBeenCalledOnce();
    await user.click(screen.getByRole("button", { name: "Collapse checklist" }));
    expect(screen.getByRole("button", { name: "Expand checklist" }).getAttribute("aria-expanded")).toBe("false");
    await waitFor(() => expect(screen.queryByRole("checkbox", { name: "Create a project" })).toBeNull());
  });
});

describe("UsageMeter", () => {
  it("exposes a meter with a readable value", () => {
    render(<UsageMeter label="Credits" used={12_400} limit={50_000} unit="credits" resets="Resets Dec 1" />);
    const meter = screen.getByRole("meter", { name: "Credits" });
    expect(meter.getAttribute("aria-valuenow")).toBe("12400");
    expect(meter.getAttribute("aria-valuemax")).toBe("50000");
    expect(meter.getAttribute("aria-valuetext")).toBe("12.4k of 50k credits used");
    expect(screen.getByText("Resets Dec 1")).toBeTruthy();
    expect(screen.getByText("25%")).toBeTruthy();
  });

  it("warns near the limit, flags overage and lists segments", () => {
    const { rerender } = render(<UsageMeter label="Seats" used={9} limit={10} />);
    expect(screen.getByText("Approaching your limit.")).toBeTruthy();
    rerender(<UsageMeter label="Seats" used={12} limit={10} segments={[{ label: "Admins", value: 4 }, { label: "Members", value: 8 }]} />);
    expect(screen.getByRole("alert").textContent).toContain("Over the limit by 2");
    expect(screen.getByRole("meter", { name: "Seats" }).getAttribute("aria-valuenow")).toBe("10");
    expect(screen.getByText("Admins")).toBeTruthy();
  });
});

describe("ForecastAlert", () => {
  const period = { periodStart: Date.UTC(2026, 10, 1, 12), periodEnd: Date.UTC(2026, 11, 1, 12), now: Date.UTC(2026, 10, 11, 12) };

  it("warns in words when the limit will be reached early", () => {
    const onDismiss = vi.fn();
    render(<ForecastAlert {...period} used={500} limit={1000} onDismiss={onDismiss} action={<button>Upgrade</button>} />);
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("Nov 21");
    expect(alert.textContent).toContain("10 days before the period ends");
    fireEvent.click(screen.getByRole("button", { name: "Dismiss forecast" }));
    expect(onDismiss).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Upgrade" })).toBeTruthy();
  });

  it("reassures when on track, and can hide itself", () => {
    const { rerender, container } = render(<ForecastAlert {...period} used={200} limit={1000} />);
    expect(screen.getByRole("status").textContent).toContain("on track");
    rerender(<ForecastAlert {...period} used={200} limit={1000} hideWhenSafe />);
    expect(container.textContent).toBe("");
  });
});
