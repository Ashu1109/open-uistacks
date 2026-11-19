import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PromptInput } from "./ui/prompt-input";
import { ModelPicker, pickSide, stepIndex, type ModelOption } from "./ui/model-picker";
import { ContextMeter, contextLevel, formatTokens } from "./ui/context-meter";
import { ThinkingState, formatDuration } from "./ui/thinking-state";
import { Attachment, fileKind, formatBytes } from "./ui/attachment";

afterEach(cleanup);

const MODELS: ModelOption[] = [
  { id: "a", name: "Swift" },
  { id: "b", name: "Retired", disabled: true },
  { id: "c", name: "Deep" },
];

describe("formatters", () => {
  it("formats token counts", () => {
    expect(formatTokens(950)).toBe("950");
    expect(formatTokens(12_400)).toBe("12.4k");
    expect(formatTokens(128_000)).toBe("128k");
    expect(formatTokens(99_960)).toBe("100k");
    expect(formatTokens(999_950)).toBe("1M");
    expect(formatTokens(1_240_000)).toBe("1.2M");
  });

  it("maps fill ratio to a level", () => {
    expect(contextLevel(0.5)).toBe("ok");
    expect(contextLevel(0.7)).toBe("warning");
    expect(contextLevel(0.95)).toBe("danger");
  });

  it("formats durations and bytes", () => {
    expect(formatDuration(8)).toBe("8s");
    expect(formatDuration(65)).toBe("1m 05s");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(2_500_000)).toBe("2.4 MB");
    expect(formatBytes(18 * 1024 * 1024)).toBe("18 MB");
  });

  it("detects file kinds from type and extension", () => {
    expect(fileKind("photo.PNG")).toBe("image");
    expect(fileKind("clip", "video/mp4")).toBe("video");
    expect(fileKind("backup.tar.gz")).toBe("archive");
    expect(fileKind("notes", "text/plain")).toBe("text");
    expect(fileKind("README")).toBe("file");
  });
});

describe("stepIndex", () => {
  it("skips disabled options and wraps", () => {
    expect(stepIndex(MODELS, 0, 1)).toBe(2);
    expect(stepIndex(MODELS, 2, 1)).toBe(0);
    expect(stepIndex(MODELS, 0, -1)).toBe(2);
    expect(stepIndex([{ id: "x", name: "X", disabled: true }], 0, 1)).toBe(-1);
  });
});

describe("pickSide", () => {
  it("keeps the preferred side unless it is short of room and the other side has more", () => {
    expect(pickSide("top", 500, 100)).toBe("top");
    expect(pickSide("top", 120, 600)).toBe("bottom");
    expect(pickSide("top", 120, 80)).toBe("top");
    expect(pickSide("bottom", 600, 90)).toBe("top");
  });
});

describe("PromptInput", () => {
  it("sends trimmed text on Enter and clears, keeps Shift+Enter as a newline", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<PromptInput onSubmit={onSubmit} />);
    const field = screen.getByRole("textbox");

    await user.type(field, "  hello{Shift>}{Enter}{/Shift}world  ");
    expect(onSubmit).not.toHaveBeenCalled();
    await user.keyboard("{Enter}");

    expect(onSubmit).toHaveBeenCalledWith("hello\nworld");
    expect(field).toHaveProperty("value", "");
  });

  it("does not send empty text, and shows stop while busy", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onStop = vi.fn();
    const { rerender } = render(<PromptInput onSubmit={onSubmit} />);
    expect(screen.getByRole("button", { name: "Send" })).toHaveProperty("disabled", true);
    await user.type(screen.getByRole("textbox"), "   {Enter}");
    expect(onSubmit).not.toHaveBeenCalled();

    rerender(<PromptInput onSubmit={onSubmit} busy onStop={onStop} />);
    await user.click(screen.getByRole("button", { name: "Stop" }));
    expect(onStop).toHaveBeenCalledOnce();
  });
});

describe("ModelPicker", () => {
  it("opens with the keyboard, skips disabled options and selects with Enter", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ModelPicker models={MODELS} onValueChange={onValueChange} />);
    const button = screen.getByRole("button", { name: "Model: Swift" });

    button.focus();
    await user.keyboard("{ArrowDown}");
    const list = screen.getByRole("listbox");
    expect(list.getAttribute("aria-activedescendant")).toBe(screen.getByRole("option", { name: "Swift" }).id);

    await user.keyboard("{ArrowDown}");
    expect(list.getAttribute("aria-activedescendant")).toBe(screen.getByRole("option", { name: "Deep" }).id);
    await user.keyboard("{Enter}");

    expect(onValueChange).toHaveBeenCalledWith("c");
    expect(screen.getByRole("button", { name: "Model: Deep" })).toBe(document.activeElement);
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
  });

  it("closes on Escape without changing the value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ModelPicker models={MODELS} onValueChange={onValueChange} />);
    await user.click(screen.getByRole("button", { name: "Model: Swift" }));
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
    expect(onValueChange).not.toHaveBeenCalled();
  });
});

describe("ContextMeter", () => {
  it("names its fill and shows details on focus", async () => {
    const user = userEvent.setup();
    render(<ContextMeter used={150_000} limit={200_000} segments={[{ label: "Files", tokens: 40_000 }]} />);
    await user.tab();
    expect(screen.getByRole("button", { name: "Context window 75% used" })).toBe(document.activeElement);
    expect(screen.getByRole("tooltip").textContent).toContain("150k of 200k tokens · 50k left");
    expect(screen.getByRole("tooltip").textContent).toContain("Files40k");
  });
});

describe("ThinkingState", () => {
  it("shows the time spent once done and folds the reasoning open", async () => {
    const user = userEvent.setup();
    render(
      <ThinkingState active={false} seconds={8}>
        Checked the docs first.
      </ThinkingState>
    );
    const toggle = screen.getByRole("button", { name: /Thought for 8s/ });
    expect(screen.queryByText("Checked the docs first.")).toBeNull();
    await user.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("Checked the docs first.")).toBeTruthy();
  });

  it("cannot open when there is no reasoning", () => {
    render(<ThinkingState active />);
    expect(screen.getByRole("button")).toHaveProperty("disabled", true);
  });
});

describe("Attachment", () => {
  it("shows progress, errors and removes", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const { rerender } = render(<Attachment name="brief.pdf" size={2_500_000} progress={0.45} onRemove={onRemove} />);
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("45");

    rerender(<Attachment name="brief.pdf" size={2_500_000} onRemove={onRemove} />);
    expect(screen.getByText("PDF · 2.4 MB")).toBeTruthy();

    rerender(<Attachment name="brief.pdf" error="Too large" onRemove={onRemove} />);
    expect(screen.getByRole("alert").textContent).toBe("Too large");

    await user.click(screen.getByRole("button", { name: "Remove brief.pdf" }));
    expect(onRemove).toHaveBeenCalledOnce();
  });
});
