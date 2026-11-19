import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AssistantHome } from "./assistant-home";
import { AssistantStart } from "./assistant-start";
import { ChatAnswerSources, splitCitations } from "./chat-answer-sources";
import { ChatThreadComposer, revealWords } from "./chat-thread-composer";
import { KnowledgeSources, totalDocuments, DEFAULT_KNOWLEDGE } from "./knowledge-sources";
import { StacksAssist } from "../templates/stacks-assist";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("AssistantHome", () => {
  it("greets, lists recents and reports opened chats and prompts", async () => {
    const user = userEvent.setup();
    const onOpenChat = vi.fn();
    const onPrompt = vi.fn();
    render(<AssistantHome onOpenChat={onOpenChat} onPrompt={onPrompt} />);
    expect(screen.getByRole("heading", { name: /Good afternoon, Maya/ })).toBeTruthy();
    await user.click(screen.getByText("Quarterly roadmap review"));
    expect(onOpenChat).toHaveBeenCalledWith("r1");
    await user.click(screen.getByText("Draft a launch announcement"));
    expect(onPrompt).toHaveBeenCalledWith("Draft a launch announcement");
  });
});

describe("AssistantStart", () => {
  it("renders the composer and a starter fills it", async () => {
    const user = userEvent.setup();
    render(<AssistantStart />);
    expect(screen.getByRole("heading", { name: "How can I help?" })).toBeTruthy();
    await user.click(screen.getByText("Plan my week"));
    expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe("Plan my week");
  });

  it("sends text and attached files, and files can be removed", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<AssistantStart onSend={onSend} />);
    const file = new File(["x"], "notes.txt", { type: "text/plain" });
    await user.upload(screen.getByLabelText("Choose files"), file);
    expect(screen.getByText("notes.txt")).toBeTruthy();
    await user.type(screen.getByRole("textbox"), "hello{Enter}");
    expect(onSend).toHaveBeenCalledWith({ text: "hello", model: "swift", files: [file] });
    expect(screen.queryByText("notes.txt")).toBeNull();
  });
});

describe("ChatAnswerSources", () => {
  it("splits citation markers and ignores out-of-range ones", () => {
    expect(splitCitations("a [1] b [5]", 2)).toEqual([
      { kind: "text", text: "a " },
      { kind: "cite", index: 1 },
      { kind: "text", text: " b [5]" },
    ]);
  });

  it("renders the answer, citations and numbered sources", () => {
    render(<ChatAnswerSources />);
    expect(screen.getByRole("article", { name: "Answer with sources" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Sources" })).toBeTruthy();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getAllByText("Remote work handbook").length).toBeGreaterThan(0);
  });
});

describe("ChatThreadComposer", () => {
  it("reveals words with original spacing", () => {
    expect(revealWords("one two  three", 2)).toBe("one two");
    expect(revealWords("one two", 0)).toBe("");
  });

  it("appends the message, thinks, then streams the reply", () => {
    vi.useFakeTimers();
    render(<ChatThreadComposer replyFor={() => "alpha beta gamma"} thinkingMs={100} wordMs={10} />);
    const box = screen.getByRole("textbox");
    fireEvent.change(box, { target: { value: "Plan it" } });
    fireEvent.keyDown(box, { key: "Enter" });
    expect(screen.getByText("Plan it")).toBeTruthy();
    expect(screen.getByRole("button", { name: /stop/i })).toBeTruthy();
    act(() => void vi.advanceTimersByTime(100 + 10));
    expect(screen.getByText("alpha")).toBeTruthy();
    act(() => void vi.advanceTimersByTime(40));
    expect(screen.getByText("alpha beta gamma")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /stop/i })).toBeNull();
  });

  it("stop keeps the streamed part, and unmount clears timers", () => {
    vi.useFakeTimers();
    const { unmount } = render(<ChatThreadComposer replyFor={() => "alpha beta gamma"} thinkingMs={0} wordMs={10} />);
    const box = screen.getByRole("textbox");
    fireEvent.change(box, { target: { value: "go" } });
    fireEvent.keyDown(box, { key: "Enter" });
    act(() => void vi.advanceTimersByTime(25));
    fireEvent.click(screen.getByRole("button", { name: /stop/i }));
    expect(screen.getByText("alpha beta")).toBeTruthy();
    fireEvent.change(box, { target: { value: "again" } });
    fireEvent.keyDown(box, { key: "Enter" });
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("KnowledgeSources", () => {
  it("totals enabled documents", () => {
    expect(totalDocuments(DEFAULT_KNOWLEDGE)).toBe(1284 + 212 + 96);
  });

  it("toggling a source updates the total", async () => {
    const user = userEvent.setup();
    render(<KnowledgeSources />);
    expect(screen.getByText(/1,592 documents/)).toBeTruthy();
    await user.click(screen.getByRole("switch", { name: "Use Team drive" }));
    expect(screen.getByText(/308 documents/)).toBeTruthy();
  });

  it("sync now shows syncing then synced", () => {
    vi.useFakeTimers();
    render(<KnowledgeSources syncMs={500} />);
    fireEvent.click(screen.getByRole("button", { name: "Sync Engineering handbook now" }));
    expect((screen.getByRole("button", { name: "Sync Engineering handbook now" }) as HTMLButtonElement).disabled).toBe(true);
    act(() => void vi.advanceTimersByTime(500));
    expect((screen.getByRole("button", { name: "Sync Engineering handbook now" }) as HTMLButtonElement).disabled).toBe(false);
    expect(screen.getAllByText("Synced").length).toBe(3);
  });

  it("adds a source from the menu", async () => {
    const user = userEvent.setup();
    render(<KnowledgeSources />);
    await user.click(screen.getByRole("button", { name: "Add source" }));
    await user.click(screen.getByRole("menuitem", { name: "Website" }));
    expect(screen.getByText("New website")).toBeTruthy();
  });
});

describe("StacksAssist", () => {
  it("renders Home and navigation switches views", async () => {
    const user = userEvent.setup();
    render(<StacksAssist />);
    expect(screen.getByRole("region", { name: "Assistant home" })).toBeTruthy();
    await user.click(screen.getAllByText("Knowledge")[0]);
    expect(screen.getByRole("region", { name: "Knowledge sources" })).toBeTruthy();
  });
});
