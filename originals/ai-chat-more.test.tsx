import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EffortSlider, stepEffort, indexFromPointer } from "./ui/effort-slider";
import { AiRecap } from "./ui/ai-recap";
import { SuggestedEdits, tally } from "./ui/suggested-edits";
import { ClarifyingQuestion } from "./ui/clarifying-question";
import { Correction } from "./ui/correction";
import { ReviewStack, decisionForKey } from "./ui/review-stack";
import { AiSummary, summaryText } from "./ui/ai-summary";
import { ConnectorsStrip, toggleConnector } from "./ui/connectors-strip";
import { PromptComposerDocked } from "./ui/prompt-composer-docked";
import { VoicePrompt, barHeights } from "./ui/voice-prompt";
import { InlineAsk } from "./ui/inline-ask";
import { MentionPrompt, findMentionQuery, insertMention, filterMentions } from "./ui/mention-prompt";
import { PromptAttachments, newFiles } from "./ui/prompt-attachments";
import { MiniPrompt } from "./ui/mini-prompt";
import { ConversationList, groupConversations, groupLabel } from "./ui/conversation-list";
import { ArtifactPanel, nextTab } from "./ui/artifact-panel";
import { PromptLibrary, filterPrompts, allTags } from "./ui/prompt-library";
import { ImageGenerations, placeholderGradient } from "./ui/image-generations";
import { GhostAutocomplete, ghostRemainder } from "./ui/ghost-autocomplete";
import { LiveTranscript, formatClock } from "./ui/live-transcript";
import { RedactedText, parseRedactions } from "./ui/redacted-text";
import { ShareChat, isShared } from "./ui/share-chat";
import { SearchResults, hostname } from "./ui/search-results";
import { ChartAnswer, layoutChart, linePath } from "./ui/chart-answer";
import { SourceViewer, splitHighlight } from "./ui/source-viewer";
import { PromptEnhancer, wordDelta } from "./ui/prompt-enhancer";
import { TranslatePanel, swapPair } from "./ui/translate-panel";
import { AssistantPicker, nextAssistant } from "./ui/assistant-picker";


interface AiChatMatchers<R = unknown> {
  toBeInTheDocument(): R;
  toBeDisabled(): R;
  toBeVisible(): R;
  toHaveAttribute(name: string, value?: string): R;
  toHaveValue(value: string): R;
  toHaveTextContent(text: string | RegExp): R;
}
type Dom = AiChatMatchers & { not: AiChatMatchers };
const dom = (value: unknown) => expect(value) as unknown as Dom;

const el = (x: unknown) => x as HTMLElement;
expect.extend({
  toBeInTheDocument: (r: unknown) => ({ pass: r !== null && el(r).isConnected, message: () => "element is not in the document" }),
  toBeDisabled: (r: unknown) => ({ pass: (el(r) as HTMLButtonElement).disabled === true, message: () => "element is not disabled" }),
  toBeVisible: (r: unknown) => ({ pass: el(r).isConnected && !el(r).hidden && !el(r).closest("[hidden]"), message: () => "element is not visible" }),
  toHaveAttribute: (r: unknown, name: string, value?: string) => {
    const actual = el(r).getAttribute(name);
    return { pass: value === undefined ? actual !== null : actual === value, message: () => `attribute ${name} was ${actual}` };
  },
  toHaveValue: (r: unknown, value: string) => ({ pass: (el(r) as HTMLInputElement).value === value, message: () => `value was ${(el(r) as HTMLInputElement).value}` }),
  toHaveTextContent: (r: unknown, text: string | RegExp) => {
    const actual = el(r).textContent ?? "";
    return { pass: typeof text === "string" ? actual.includes(text) : text.test(actual), message: () => `text was "${actual}"` };
  },
});

afterEach(cleanup);

describe("pure helpers", () => {
  it("steps the effort slider", () => {
    expect(stepEffort(1, "ArrowRight", 4)).toBe(2);
    expect(stepEffort(3, "ArrowRight", 4)).toBe(3);
    expect(stepEffort(1, "Home", 4)).toBe(0);
    expect(stepEffort(1, "End", 4)).toBe(3);
    expect(stepEffort(1, "x", 4)).toBeNull();
    expect(indexFromPointer(50, 0, 100, 5)).toBe(2);
    expect(indexFromPointer(500, 0, 100, 5)).toBe(4);
  });
  it("tallies edits, toggles connectors, maps review keys", () => {
    const edits = [{ id: "a", before: "x", after: "y" }, { id: "b", before: "x", after: "y" }];
    expect(tally(edits, { a: "accepted" })).toEqual({ pending: 1, accepted: 1, rejected: 0 });
    const cs = [{ id: "d", name: "Drive" }, { id: "e", name: "Bad", error: "x" }];
    expect(toggleConnector([], "d", cs)).toEqual(["d"]);
    expect(toggleConnector(["d"], "d", cs)).toEqual([]);
    expect(toggleConnector([], "e", cs)).toEqual([]);
    expect(decisionForKey("ArrowRight")).toBe("approve");
    expect(decisionForKey("ArrowLeft")).toBe("reject");
    expect(decisionForKey("a")).toBeNull();
  });
  it("builds summary text and bar heights", () => {
    expect(summaryText("Hi", ["a", "b"])).toBe("Hi\n- a\n- b");
    const quiet = barHeights(0);
    const loud = barHeights(1);
    expect(quiet.every((h) => h === 0.15)).toBe(true);
    expect(loud[2]).toBeGreaterThan(loud[0]);
  });
  it("parses mentions", () => {
    const q = findMentionQuery("hi @ma", 6);
    expect(q).toEqual({ start: 3, query: "ma" });
    expect(findMentionQuery("a@b", 3)).toBeNull();
    expect(insertMention("hi @ma", 6, q!, "Maya")).toEqual({ text: "hi @Maya ", caret: 9 });
    expect(filterMentions([{ id: "1", label: "Maya" }, { id: "2", label: "Omar" }], "om")).toHaveLength(1);
  });
  it("filters new files", () => {
    const f = new File(["abc"], "a.txt");
    expect(newFiles([f], [{ id: "1", name: "a.txt", size: 3 }])).toHaveLength(0);
    expect(newFiles([f], [])).toHaveLength(1);
  });
  it("groups conversations by day", () => {
    const now = new Date(2026, 5, 15, 12).getTime();
    const day = 86_400_000;
    expect(groupLabel(now - 1000, now)).toBe("Today");
    expect(groupLabel(now - day, now)).toBe("Yesterday");
    expect(groupLabel(now - 4 * day, now)).toBe("Previous 7 days");
    expect(groupLabel(now - 30 * day, now)).toBe("Older");
    const groups = groupConversations([{ id: "1", title: "Alpha", updatedAt: now }, { id: "2", title: "Beta", updatedAt: now - 30 * day }], now, "be");
    expect(groups.map((g) => g.label)).toEqual(["Older"]);
  });
  it("handles tabs, prompts, gradients, ghosts, clocks", () => {
    expect(nextTab("preview", "ArrowRight")).toBe("code");
    expect(nextTab("code", "ArrowRight")).toBe("preview");
    expect(nextTab("code", "Home")).toBe("preview");
    expect(nextTab("code", "q")).toBeNull();
    const prompts = [{ id: "1", title: "Email", text: "Write", tags: ["work"] }, { id: "2", title: "Poem", text: "Rhyme", tags: ["fun"] }];
    expect(filterPrompts(prompts, "po", null)).toHaveLength(1);
    expect(filterPrompts(prompts, "", "work")).toHaveLength(1);
    expect(allTags(prompts)).toEqual(["fun", "work"]);
    expect(placeholderGradient("a")).toBe(placeholderGradient("a"));
    expect(ghostRemainder("Hello wo", "Hello world")).toBe("rld");
    expect(ghostRemainder("Hi", "Bye")).toBe("");
    expect(formatClock(7)).toBe("0:07");
    expect(formatClock(3729)).toBe("1:02:09");
  });
  it("parses redactions and hostnames", () => {
    expect(parseRedactions("Call [[Ana]] now")).toEqual([{ text: "Call ", redacted: false }, { text: "Ana", redacted: true }, { text: " now", redacted: false }]);
    expect(isShared("private")).toBe(false);
    expect(isShared("link")).toBe(true);
    expect(hostname("https://www.example.com/a")).toBe("example.com");
    expect(hostname("nope")).toBe("nope");
  });
  it("lays out charts and highlights", () => {
    const g = layoutChart([{ label: "a", value: 5 }, { label: "b", value: 10 }], 100, 100, 0);
    expect(g[1].h).toBe(100);
    expect(g[0].h).toBe(50);
    expect(layoutChart([], 100, 100)).toEqual([]);
    expect(linePath(g).startsWith("M")).toBe(true);
    expect(splitHighlight("The quick fox", "QUICK").map((p) => p.text)).toEqual(["The ", "quick", " fox"]);
    expect(splitHighlight("abc", "z")).toHaveLength(1);
    expect(wordDelta("a b", "a b c d")).toBe(2);
    expect(swapPair({ from: "en", to: "fr" })).toEqual({ from: "fr", to: "en" });
    const list = [{ id: "a", name: "A", description: "" }, { id: "b", name: "B", description: "", disabled: true }, { id: "c", name: "C", description: "" }];
    expect(nextAssistant(list, 0, 1)).toBe(2);
    expect(nextAssistant(list, 0, -1)).toBe(2);
  });
});

describe("components", () => {
  it("effort slider moves with the keyboard", async () => {
    const onValueChange = vi.fn();
    render(<EffortSlider defaultValue={1} onValueChange={onValueChange} />);
    const slider = screen.getByRole("slider", { name: "Effort" });
    dom(slider).toHaveAttribute("aria-valuetext", "Medium");
    slider.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onValueChange).toHaveBeenCalledWith(2);
    dom(slider).toHaveAttribute("aria-valuetext", "High");
  });

  it("recap dismisses", async () => {
    const onDismiss = vi.fn();
    render(<AiRecap items={[{ id: "1", text: "Draft finished" }]} since="9 AM" onDismiss={onDismiss} />);
    dom(screen.getByText("Draft finished")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Dismiss recap" }));
    expect(onDismiss).toHaveBeenCalled();
  });

  it("suggested edits accept and tally", async () => {
    const onDecide = vi.fn();
    render(<SuggestedEdits edits={[{ id: "a", before: "teh", after: "the" }, { id: "b", before: "x", after: "y" }]} onDecide={onDecide} />);
    await userEvent.click(screen.getByRole("button", { name: "Accept edit: the" }));
    expect(onDecide).toHaveBeenCalledWith("a", "accepted");
    dom(screen.getByRole("status")).toHaveTextContent("1 accepted · 1 pending");
    await userEvent.click(screen.getByRole("button", { name: "Accept all remaining" }));
    dom(screen.getByRole("status")).toHaveTextContent("2 accepted");
  });

  it("clarifying question answers with option or free text", async () => {
    const onAnswer = vi.fn();
    render(<ClarifyingQuestion question="Which tone?" options={["Formal", "Casual"]} onAnswer={onAnswer} />);
    dom(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    await userEvent.click(screen.getByLabelText("Casual"));
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(onAnswer).toHaveBeenCalledWith("Casual");
    await userEvent.type(screen.getByLabelText("Something else"), "Playful");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(onAnswer).toHaveBeenLastCalledWith("Playful");
  });

  it("correction edits and saves", async () => {
    const onCorrect = vi.fn();
    render(<Correction original="Paris is in Italy" corrected="Paris is in France" onCorrect={onCorrect} />);
    dom(screen.getByText("Corrected by you")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Edit/ }));
    const box = screen.getByLabelText("Corrected text");
    await userEvent.clear(box);
    await userEvent.type(box, "Paris is in Europe");
    await userEvent.click(screen.getByRole("button", { name: /Save/ }));
    expect(onCorrect).toHaveBeenCalledWith("Paris is in Europe");
  });

  it("review stack decides with arrow keys and finishes", async () => {
    const onDecision = vi.fn();
    const onDone = vi.fn();
    render(<ReviewStack items={[{ id: "1", title: "One", body: "a" }, { id: "2", title: "Two", body: "b" }]} onDecision={onDecision} onDone={onDone} />);
    dom(screen.getByRole("status")).toHaveTextContent("1 of 2");
    await userEvent.click(screen.getByRole("button", { name: "Approve" }));
    expect(onDecision).toHaveBeenCalledWith("1", "approve");
    fireEvent.keyDown(screen.getByRole("group", { name: "Review stack" }), { key: "ArrowLeft" });
    expect(onDecision).toHaveBeenLastCalledWith("2", "reject");
    expect(onDone).toHaveBeenCalled();
    dom(screen.getByRole("status")).toHaveTextContent("All 2 reviewed");
  });

  it("summary renders, toggles points and rates", async () => {
    const onFeedback = vi.fn();
    render(<AiSummary summary="Short version" points={["Point A"]} onFeedback={onFeedback} />);
    dom(screen.getByText("Short version")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Key points" }));
    dom(screen.queryByText("Point A")).not.toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Good summary" }));
    expect(onFeedback).toHaveBeenCalledWith("up");
  });

  it("connectors toggle as switches", async () => {
    const onValueChange = vi.fn();
    render(<ConnectorsStrip connectors={[{ id: "d", name: "Drive" }, { id: "e", name: "Mail", error: "Token expired" }]} onValueChange={onValueChange} />);
    const drive = screen.getByRole("switch", { name: /Drive/ });
    dom(drive).toHaveAttribute("aria-checked", "false");
    await userEvent.click(drive);
    expect(onValueChange).toHaveBeenCalledWith(["d"]);
    dom(drive).toHaveAttribute("aria-checked", "true");
    dom(screen.getByRole("switch", { name: /Mail/ })).toHaveAttribute("aria-checked", "false");
  });

  it("docked composer shows suggestions and fills the field", async () => {
    render(<PromptComposerDocked suggestions={["Plan my week"]} contextUsed={1000} contextLimit={8000} />);
    await userEvent.click(screen.getByRole("button", { name: "Plan my week" }));
    dom(screen.getByRole("textbox")).toHaveValue("Plan my week");
    dom(screen.queryByRole("list", { name: "Suggested prompts" })).not.toBeInTheDocument();
  });

  it("voice prompt toggles without a microphone", async () => {
    const onStart = vi.fn();
    const { rerender } = render(<VoicePrompt onStart={onStart} />);
    await userEvent.click(screen.getByRole("button", { name: "Start voice input" }));
    expect(onStart).toHaveBeenCalled();
    rerender(<VoicePrompt state="listening" level={0.5} />);
    dom(screen.getByRole("button", { name: "Stop listening" })).toHaveAttribute("aria-pressed", "true");
    dom(screen.getByRole("status")).toHaveTextContent("Listening");
  });

  it("inline ask sends a quick action and closes on Escape", async () => {
    const onSubmit = vi.fn();
    const onClose = vi.fn();
    render(<InlineAsk selection="Entropy always rises" onSubmit={onSubmit} onClose={onClose} />);
    dom(screen.getByRole("dialog", { name: "Ask about selection" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Explain" }));
    expect(onSubmit).toHaveBeenCalledWith("Explain", "Entropy always rises");
    await userEvent.type(screen.getByLabelText("Question"), "{Escape}");
    expect(onClose).toHaveBeenCalled();
  });

  it("mention prompt opens, filters and inserts", async () => {
    const onMention = vi.fn();
    render(<MentionPrompt options={[{ id: "1", label: "Maya" }, { id: "2", label: "Omar" }]} onMention={onMention} />);
    const box = screen.getByRole("combobox");
    await userEvent.type(box, "hi @o");
    dom(screen.getByRole("option", { name: /Omar/ })).toBeInTheDocument();
    dom(screen.queryByRole("option", { name: /Maya/ })).not.toBeInTheDocument();
    await userEvent.keyboard("{Enter}");
    dom(box).toHaveValue("hi @Omar ");
    expect(onMention).toHaveBeenCalledWith({ id: "2", label: "Omar" });
  });

  it("prompt attachments list chips and remove", async () => {
    const onRemove = vi.fn();
    render(<PromptAttachments attachments={[{ id: "1", name: "brief.pdf", size: 2048 }]} onRemove={onRemove} />);
    dom(screen.getByText("brief.pdf")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Remove brief.pdf" }));
    expect(onRemove).toHaveBeenCalledWith("1");
    dom(screen.getByRole("button", { name: "Attach files" })).toBeInTheDocument();
  });

  it("mini prompt sends and clears", async () => {
    const onSubmit = vi.fn();
    render(<MiniPrompt onSubmit={onSubmit} />);
    const input = screen.getByLabelText("Ask AI");
    await userEvent.type(input, "hello{Enter}");
    expect(onSubmit).toHaveBeenCalledWith("hello");
    dom(input).toHaveValue("");
    await userEvent.type(input, "oops{Escape}");
    dom(input).toHaveValue("");
  });

  it("conversation list searches, selects and deletes", async () => {
    const now = Date.now();
    const onSelect = vi.fn();
    const onDelete = vi.fn();
    render(<ConversationList now={now} activeId="1" onSelect={onSelect} onDelete={onDelete} conversations={[{ id: "1", title: "Trip plan", updatedAt: now }, { id: "2", title: "Budget", updatedAt: now }]} />);
    dom(screen.getByRole("button", { name: "Trip plan" })).toHaveAttribute("aria-current", "page");
    await userEvent.type(screen.getByLabelText("Search chats"), "bud");
    dom(screen.queryByRole("button", { name: "Trip plan" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Budget" }));
    expect(onSelect).toHaveBeenCalledWith("2");
    await userEvent.click(screen.getByRole("button", { name: "Delete Budget" }));
    expect(onDelete).toHaveBeenCalledWith("2");
  });

  it("artifact panel switches tabs with arrows", async () => {
    render(<ArtifactPanel title="Landing page" versions={[{ id: "1", label: "v1", code: "<h1>1</h1>", preview: <p>Preview one</p> }, { id: "2", label: "v2", code: "<h1>2</h1>", preview: <p>Preview two</p> }]} />);
    dom(screen.getByText("Preview two")).toBeInTheDocument();
    screen.getByRole("tab", { name: "preview" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    dom(screen.getByRole("tab", { name: "code" })).toHaveAttribute("aria-selected", "true");
    dom(await screen.findByText("<h1>2</h1>")).toBeInTheDocument();
  });

  it("prompt library filters and uses a prompt", async () => {
    const onUse = vi.fn();
    const prompts = [{ id: "1", title: "Cold email", text: "Write a cold email", tags: ["work"] }, { id: "2", title: "Haiku", text: "Write a haiku", tags: ["fun"] }];
    render(<PromptLibrary prompts={prompts} onUse={onUse} />);
    await userEvent.click(screen.getByRole("button", { name: "fun" }));
    dom(screen.queryByText("Cold email")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Haiku/ }));
    expect(onUse).toHaveBeenCalledWith(prompts[1]);
  });

  it("image generations select and retry", async () => {
    const onSelect = vi.fn();
    const onRetry = vi.fn();
    render(<ImageGenerations onSelect={onSelect} onRetry={onRetry} images={[{ id: "a", alt: "Sunset" }, { id: "b", alt: "Forest", status: "loading" }, { id: "c", alt: "River", status: "error" }]} />);
    await userEvent.click(screen.getByRole("button", { name: "Sunset" }));
    expect(onSelect).toHaveBeenCalledWith("a");
    dom(screen.getByRole("button", { name: "Sunset" })).toHaveAttribute("aria-pressed", "true");
    dom(screen.getByRole("status", { name: "Generating Forest" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Retry River" }));
    expect(onRetry).toHaveBeenCalledWith("c");
  });

  it("ghost autocomplete accepts with Tab and dismisses with Escape", async () => {
    const onAccept = vi.fn();
    render(<GhostAutocomplete suggestion="Hello world" onAccept={onAccept} />);
    const box = screen.getByRole("textbox");
    await userEvent.type(box, "Hello wo");
    dom(screen.getByRole("status")).toHaveTextContent("rld");
    await userEvent.keyboard("{Tab}");
    dom(box).toHaveValue("Hello world");
    expect(onAccept).toHaveBeenCalledWith("Hello world");
    await userEvent.clear(box);
    await userEvent.type(box, "Hel{Escape}");
    dom(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("live transcript lists lines and interim text", () => {
    render(<LiveTranscript lines={[{ id: "1", speaker: "Ana", text: "Welcome everyone", at: 5 }]} interim="so today we" />);
    dom(screen.getByRole("log")).toBeInTheDocument();
    dom(screen.getByText("Welcome everyone")).toBeInTheDocument();
    dom(screen.getByText("0:05")).toBeInTheDocument();
    dom(screen.getByText(/so today we/)).toBeInTheDocument();
  });

  it("redacted text reveals one or all", async () => {
    render(<RedactedText text="Call [[Ana]] at [[555-0100]]" />);
    dom(screen.queryByText("Ana")).not.toBeInTheDocument();
    await userEvent.click(screen.getAllByRole("button", { name: "Reveal redacted text" })[0]);
    dom(screen.getByText("Ana")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Reveal all/ }));
    dom(screen.getByText("555-0100")).toBeInTheDocument();
    dom(screen.getByRole("button", { name: "Hide all" })).toBeInTheDocument();
  });

  it("redacted text stays hidden when not revealable", () => {
    render(<RedactedText text="Key [[secret]]" revealable={false} />);
    dom(screen.getByRole("img", { name: "Redacted" })).toBeInTheDocument();
    dom(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("share chat shows the link only when shared", async () => {
    const onVisibilityChange = vi.fn();
    render(<ShareChat url="https://chat.example/s/abc" onVisibilityChange={onVisibilityChange} />);
    dom(screen.queryByLabelText("Share link")).not.toBeInTheDocument();
    await userEvent.click(screen.getByLabelText(/Anyone with the link/));
    expect(onVisibilityChange).toHaveBeenCalledWith("link");
    dom(screen.getByLabelText("Share link")).toHaveValue("https://chat.example/s/abc");
    dom(screen.getByRole("button", { name: /Copy link/ })).toBeInTheDocument();
  });

  it("search results list results and loading state", () => {
    const { rerender } = render(<SearchResults query="tides" results={[{ id: "1", title: "How tides work", url: "https://www.example.org/tides", snippet: "The moon pulls." }]} />);
    dom(screen.getByRole("link", { name: "How tides work" })).toHaveAttribute("href", "https://www.example.org/tides");
    dom(screen.getByRole("status")).toHaveTextContent('1 result for "tides"');
    rerender(<SearchResults query="tides" results={[]} loading />);
    dom(screen.getByRole("status")).toHaveTextContent("Searching");
  });

  it("chart answer exposes data as a table", async () => {
    render(<ChartAnswer answer="Q2 was strongest." title="Revenue by quarter" unit="k" data={[{ label: "Q1", value: 40 }, { label: "Q2", value: 90 }]} />);
    dom(screen.getByRole("img", { name: /Revenue by quarter: Q1 40k, Q2 90k/ })).toBeInTheDocument();
    dom(screen.getByRole("button", { name: "Show data" })).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(screen.getByRole("button", { name: "Show data" }));
    dom(screen.getByRole("table")).toBeVisible();
  });

  it("source viewer highlights and navigates", async () => {
    const onIndexChange = vi.fn();
    render(<SourceViewer onIndexChange={onIndexChange} sources={[{ id: "1", title: "Doc A", text: "Alpha beta gamma", highlight: "beta" }, { id: "2", title: "Doc B", text: "Delta" }]} />);
    expect(screen.getByText("beta").tagName).toBe("MARK");
    dom(screen.getByRole("button", { name: "Previous source" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Next source" }));
    expect(onIndexChange).toHaveBeenCalledWith(1);
    dom(screen.getByText("Doc B")).toBeInTheDocument();
  });

  it("prompt enhancer enhances, accepts", async () => {
    const onEnhance = vi.fn();
    const onAccept = vi.fn();
    const { rerender } = render(<PromptEnhancer original="write a poem" onEnhance={onEnhance} />);
    await userEvent.click(screen.getByRole("button", { name: /Enhance/ }));
    expect(onEnhance).toHaveBeenCalled();
    rerender(<PromptEnhancer original="write a poem" loading />);
    dom(screen.getByRole("status", { name: "Enhancing prompt" })).toBeInTheDocument();
    rerender(<PromptEnhancer original="write a poem" enhanced="Write a four-line poem about autumn" onAccept={onAccept} />);
    await userEvent.click(screen.getByRole("button", { name: /Use this/ }));
    expect(onAccept).toHaveBeenCalledWith("Write a four-line poem about autumn");
  });

  it("translate panel swaps languages", async () => {
    const onPairChange = vi.fn();
    render(<TranslatePanel languages={[{ code: "en", name: "English" }, { code: "fr", name: "French" }]} source="Hello" translated="Bonjour" onPairChange={onPairChange} />);
    dom(screen.getByLabelText("Translate from")).toHaveValue("en");
    dom(screen.getByLabelText("Translation")).toHaveTextContent("Bonjour");
    await userEvent.click(screen.getByRole("button", { name: "Swap languages" }));
    expect(onPairChange).toHaveBeenCalledWith({ from: "fr", to: "en" });
    dom(screen.getByLabelText("Translate from")).toHaveValue("fr");
  });

  it("assistant picker moves with arrows, skipping disabled", async () => {
    const onValueChange = vi.fn();
    render(<AssistantPicker onValueChange={onValueChange} assistants={[{ id: "a", name: "Writer", description: "Drafts" }, { id: "b", name: "Locked", description: "x", disabled: true }, { id: "c", name: "Coder", description: "Code" }]} />);
    const writer = screen.getByRole("radio", { name: /Writer/ });
    dom(writer).toHaveAttribute("aria-checked", "true");
    writer.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onValueChange).toHaveBeenCalledWith("c");
    dom(screen.getByRole("radio", { name: /Coder/ })).toHaveAttribute("aria-checked", "true");
  });
});
