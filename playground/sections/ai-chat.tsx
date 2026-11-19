import { useEffect, useState, type ReactNode } from "react";
import { useDemoView } from "../demo";
import { EffortSlider } from "../../originals/ui/effort-slider";
import { AiRecap } from "../../originals/ui/ai-recap";
import { SuggestedEdits } from "../../originals/ui/suggested-edits";
import { ClarifyingQuestion } from "../../originals/ui/clarifying-question";
import { Correction } from "../../originals/ui/correction";
import { ReviewStack } from "../../originals/ui/review-stack";
import { AiSummary } from "../../originals/ui/ai-summary";
import { ConnectorsStrip } from "../../originals/ui/connectors-strip";
import { PromptComposerDocked } from "../../originals/ui/prompt-composer-docked";
import { VoicePrompt, type VoiceState } from "../../originals/ui/voice-prompt";
import { InlineAsk } from "../../originals/ui/inline-ask";
import { MentionPrompt } from "../../originals/ui/mention-prompt";
import { PromptAttachments, type PromptAttachment } from "../../originals/ui/prompt-attachments";
import { MiniPrompt } from "../../originals/ui/mini-prompt";
import { ConversationList } from "../../originals/ui/conversation-list";
import { ArtifactPanel } from "../../originals/ui/artifact-panel";
import { PromptLibrary } from "../../originals/ui/prompt-library";
import { ImageGenerations } from "../../originals/ui/image-generations";
import { GhostAutocomplete } from "../../originals/ui/ghost-autocomplete";
import { LiveTranscript, type TranscriptLine } from "../../originals/ui/live-transcript";
import { RedactedText } from "../../originals/ui/redacted-text";
import { ShareChat } from "../../originals/ui/share-chat";
import { SearchResults } from "../../originals/ui/search-results";
import { ChartAnswer } from "../../originals/ui/chart-answer";
import { SourceViewer } from "../../originals/ui/source-viewer";
import { PromptEnhancer } from "../../originals/ui/prompt-enhancer";
import { TranslatePanel } from "../../originals/ui/translate-panel";
import { AssistantPicker } from "../../originals/ui/assistant-picker";

function Demo({ title, slug, children }: { title: string; slug: string; children: ReactNode }) {
  const view = useDemoView(slug);
  if (view === "hidden") return null;
  if (view === "bare") return <div data-demo className="col-span-full w-full min-w-0">{children}</div>;
  return (
    <section id={slug} className="grid gap-3">
      <h3 className="text-sm font-medium text-fg-muted">{title}</h3>
      <div className="rounded-[20px] bg-subtle/50 p-6">{children}</div>
    </section>
  );
}

const NOW = Date.now();
const DAY = 86_400_000;

const SCRIPT: TranscriptLine[] = [
  { id: "1", speaker: "Ana", text: "Thanks for joining, let's start with the launch timeline.", at: 4 },
  { id: "2", speaker: "Ravi", text: "Design is done, engineering needs another week.", at: 13 },
  { id: "3", speaker: "Ana", text: "Then we move the announcement to the 14th.", at: 22 },
];

function EnhancerDemo() {
  const [state, setState] = useState<{ loading: boolean; enhanced: string }>({ loading: false, enhanced: "" });
  useEffect(() => {
    if (!state.loading) return;
    const t = setTimeout(() => setState({ loading: false, enhanced: "Write a warm, four-line poem about autumn evenings, using imagery of falling leaves and woodsmoke." }), 1200);
    return () => clearTimeout(t);
  }, [state.loading]);
  return <PromptEnhancer original="write a poem about autumn" loading={state.loading} enhanced={state.enhanced} onEnhance={() => setState({ loading: true, enhanced: "" })} onDiscard={() => setState({ loading: false, enhanced: "" })} onAccept={() => setState({ loading: false, enhanced: "" })} />;
}

function VoiceDemo() {
  const [state, setState] = useState<VoiceState>("idle");
  const [level, setLevel] = useState(0);
  useEffect(() => {
    if (state !== "listening") return;
    const t = setInterval(() => setLevel(0.2 + Math.random() * 0.8), 120);
    return () => clearInterval(t);
  }, [state]);
  return <VoicePrompt state={state} level={level} onStart={() => setState("listening")} onStop={() => setState("idle")} />;
}

function TranscriptDemo() {
  const [shown, setShown] = useState(1);
  useEffect(() => {
    const t = setInterval(() => setShown((n) => (n >= SCRIPT.length ? 1 : n + 1)), 2200);
    return () => clearInterval(t);
  }, []);
  return <LiveTranscript lines={SCRIPT.slice(0, shown)} interim="and then we should confirm" interimSpeaker="Ravi" />;
}

function AttachmentsDemo() {
  const [files, setFiles] = useState<PromptAttachment[]>([{ id: "1", name: "roadmap.pdf", size: 482_000 }, { id: "2", name: "metrics.csv", size: 12_400, progress: 0.6 }]);
  return (
    <PromptAttachments
      attachments={files}
      onAdd={(added) => setFiles((f) => [...f, ...added.map((a) => ({ id: `${a.name}-${a.size}`, name: a.name, size: a.size, type: a.type }))])}
      onRemove={(id) => setFiles((f) => f.filter((x) => x.id !== id))}
    />
  );
}

function ConversationsDemo() {
  const [active, setActive] = useState("1");
  const [items, setItems] = useState([
    { id: "1", title: "Quarterly report outline", updatedAt: NOW - 3_600_000 },
    { id: "2", title: "Debug the upload queue", updatedAt: NOW - DAY },
    { id: "3", title: "Trip to the coast", updatedAt: NOW - 3 * DAY },
    { id: "4", title: "Onboarding email draft", updatedAt: NOW - 20 * DAY },
  ]);
  return <ConversationList conversations={items} activeId={active} onSelect={setActive} onDelete={(id) => setItems((l) => l.filter((c) => c.id !== id))} onNew={() => undefined} />;
}

export function Section() {
  return (
    <div className="grid gap-10">
      <Demo title="Effort slider" slug="effort-slider"><EffortSlider /></Demo>
      <Demo title="AI recap" slug="ai-recap">
        <AiRecap since="9:40 AM" onJump={() => undefined} items={[{ id: "1", text: "The draft was extended by two sections." }, { id: "2", text: "Maya left three comments on the intro." }, { id: "3", text: "Two sources were replaced after a freshness check." }]} />
      </Demo>
      <Demo title="Suggested edits" slug="suggested-edits">
        <SuggestedEdits edits={[{ id: "a", before: "We was happy to announce", after: "We are happy to announce", reason: "Subject-verb agreement" }, { id: "b", before: "in order to be able to ship", after: "to ship", reason: "Shorter" }, { id: "c", before: "utilize", after: "use" }]} />
      </Demo>
      <Demo title="Clarifying question" slug="clarifying-question">
        <ClarifyingQuestion question="Who is this announcement for?" options={["Existing customers", "New sign-ups", "Internal team"]} onSkip={() => undefined} />
      </Demo>
      <Demo title="Correction" slug="correction"><Correction original="The meeting is on Thursday at 3 PM." corrected="The meeting is on Friday at 3 PM." onUndo={() => undefined} /></Demo>
      <Demo title="Review stack" slug="review-stack">
        <ReviewStack items={[{ id: "1", title: "Subject line A", body: "Your numbers are ready: here is what changed this week and what to do about it." }, { id: "2", title: "Subject line B", body: "Three things we noticed in your weekly numbers." }, { id: "3", title: "Subject line C", body: "A quick look at the week: wins, risks and next steps." }]} />
      </Demo>
      <Demo title="AI summary" slug="ai-summary">
        <AiSummary summary="The team agreed to ship the beta on the 14th, with billing deferred to the following sprint." points={["Design sign-off is complete", "Engineering needs one extra week", "Billing moves to sprint 12"]} footnote="Based on 3 meeting notes" />
      </Demo>
      <Demo title="Connectors strip" slug="connectors-strip">
        <ConnectorsStrip defaultValue={["drive"]} connectors={[{ id: "drive", name: "Drive" }, { id: "calendar", name: "Calendar" }, { id: "repo", name: "Repository" }, { id: "mail", name: "Mail", error: "Token expired, reconnect" }]} />
      </Demo>
      <Demo title="Prompt composer, docked" slug="prompt-composer-docked">
        <div className="relative h-72 overflow-hidden rounded-[16px] bg-surface">
          <div className="grid gap-2 p-4 text-[13px] text-fg-muted"><p>Messages scroll beneath the composer.</p><p>The fade keeps text readable.</p></div>
          <div className="absolute inset-x-0 bottom-0">
            <PromptComposerDocked suggestions={["Summarize this thread", "Draft a reply", "List action items"]} models={[{ id: "swift", name: "Swift" }, { id: "deep", name: "Deep" }]} model="swift" contextUsed={42_000} contextLimit={128_000} onAttach={() => undefined} disclaimer="AI can make mistakes. Check important details." />
          </div>
        </div>
      </Demo>
      <Demo title="Voice prompt" slug="voice-prompt"><VoiceDemo /></Demo>
      <Demo title="Inline ask" slug="inline-ask"><InlineAsk selection="The covariance matrix is positive semi-definite by construction." /></Demo>
      <Demo title="Mention prompt" slug="mention-prompt">
        <div className="pb-40"><MentionPrompt options={[{ id: "1", label: "Maya", hint: "Design" }, { id: "2", label: "Omar", hint: "Engineering" }, { id: "3", label: "roadmap.pdf", hint: "File" }, { id: "4", label: "search", hint: "Tool" }]} /></div>
      </Demo>
      <Demo title="Prompt attachments" slug="prompt-attachments"><AttachmentsDemo /></Demo>
      <Demo title="Mini prompt" slug="mini-prompt"><MiniPrompt /></Demo>
      <Demo title="Conversation list" slug="conversation-list"><ConversationsDemo /></Demo>
      <Demo title="Artifact panel" slug="artifact-panel">
        <ArtifactPanel title="Pricing card" versions={[{ id: "1", label: "v1", code: '<div class="card">\n  <h2>Starter</h2>\n  <p>$9 / month</p>\n</div>', preview: <div className="rounded-[14px] bg-subtle p-4 text-fg"><h4 className="font-medium">Starter</h4><p className="text-fg-muted">$9 / month</p></div> }, { id: "2", label: "v2", code: '<div class="card">\n  <h2>Starter</h2>\n  <p>$9 / month</p>\n  <button>Choose plan</button>\n</div>', preview: <div className="rounded-[14px] bg-subtle p-4 text-fg"><h4 className="font-medium">Starter</h4><p className="text-fg-muted">$9 / month</p><button type="button" className="mt-2 rounded-full bg-select px-3 py-1 text-xs text-[var(--on-feature)]">Choose plan</button></div> }]} />
      </Demo>
      <Demo title="Prompt library" slug="prompt-library">
        <PromptLibrary prompts={[{ id: "1", title: "Cold outreach email", text: "Write a short, friendly cold email introducing our product to a busy founder.", tags: ["work", "email"] }, { id: "2", title: "Explain like I'm five", text: "Explain the following concept in simple words a child could follow.", tags: ["learning"] }, { id: "3", title: "Meeting recap", text: "Turn these raw notes into a recap with decisions and owners.", tags: ["work"] }, { id: "4", title: "Bedtime story", text: "Tell a gentle three-paragraph story about a sleepy lighthouse.", tags: ["fun"] }]} />
      </Demo>
      <Demo title="Image generations" slug="image-generations">
        <ImageGenerations prompt="A lighthouse at dusk, watercolor" defaultSelectedId="a" images={[{ id: "a", alt: "Lighthouse, variation one" }, { id: "b", alt: "Lighthouse, variation two" }, { id: "c", alt: "Lighthouse, variation three", status: "loading" }, { id: "d", alt: "Lighthouse, variation four", status: "error" }]} />
      </Demo>
      <Demo title="Ghost autocomplete" slug="ghost-autocomplete"><GhostAutocomplete suggestion="Thanks for reaching out, I will get back to you by Friday." defaultValue="Thanks for reaching" /></Demo>
      <Demo title="Live transcript" slug="live-transcript"><TranscriptDemo /></Demo>
      <Demo title="Redacted text" slug="redacted-text"><RedactedText text="Please call [[Dana Whitfield]] on [[555-0142]] about invoice [[INV-20931]] before Friday." /></Demo>
      <Demo title="Share chat" slug="share-chat"><ShareChat url="https://chat.example.com/share/k3x9-demo" defaultVisibility="link" /></Demo>
      <Demo title="Search results" slug="search-results">
        <SearchResults query="how do tides work" results={[{ id: "1", title: "Tides explained", url: "https://www.oceanfacts.example/tides", snippet: "Tides are caused by the gravitational pull of the moon and, to a lesser degree, the sun." }, { id: "2", title: "Spring and neap tides", url: "https://tidewatch.example/spring-neap", snippet: "When the sun, moon and Earth line up, tidal ranges are at their largest." }]} />
      </Demo>
      <Demo title="Chart answer" slug="chart-answer">
        <div className="flex flex-wrap gap-4">
          <ChartAnswer answer="Signups peaked in March, then flattened." title="Monthly signups" data={[{ label: "Jan", value: 320 }, { label: "Feb", value: 410 }, { label: "Mar", value: 640 }, { label: "Apr", value: 600 }, { label: "May", value: 590 }]} />
          <ChartAnswer type="line" answer="Latency fell steadily after the cache rollout." title="p95 latency" unit=" ms" data={[{ label: "Mon", value: 420 }, { label: "Tue", value: 380 }, { label: "Wed", value: 260 }, { label: "Thu", value: 210 }, { label: "Fri", value: 190 }]} />
        </div>
      </Demo>
      <Demo title="Source viewer" slug="source-viewer">
        <SourceViewer sources={[{ id: "1", title: "Handbook, section 4", url: "https://docs.example.com/handbook", text: "Employees accrue leave monthly. Unused leave of up to five days carries over into the next calendar year. Requests are approved by the line manager.", highlight: "Unused leave of up to five days carries over" }, { id: "2", title: "Policy FAQ", text: "Leave requests should be filed at least two weeks ahead for periods longer than three days.", highlight: "at least two weeks ahead" }]} />
      </Demo>
      <Demo title="Prompt enhancer" slug="prompt-enhancer"><EnhancerDemo /></Demo>
      <Demo title="Translate panel" slug="translate-panel">
        <TranslatePanel languages={[{ code: "en", name: "English" }, { code: "es", name: "Spanish" }, { code: "de", name: "German" }]} defaultPair={{ from: "en", to: "es" }} source="Where is the nearest train station?" translated="¿Dónde está la estación de tren más cercana?" />
      </Demo>
      <Demo title="Assistant picker" slug="assistant-picker">
        <AssistantPicker defaultValue="writer" assistants={[{ id: "writer", name: "Writer", description: "Drafts and edits long-form text" }, { id: "analyst", name: "Analyst", description: "Reads tables and explains the numbers" }, { id: "coder", name: "Coder", description: "Writes and reviews code" }, { id: "legal", name: "Legal", description: "Coming soon", disabled: true }]} />
      </Demo>
    </div>
  );
}
