import { useState } from "react";
import { Brain, Home, Inbox, Paperclip, Settings, Sparkles, Zap } from "lucide-react";
import { Demo } from "../demo";
import { PromptInput, PromptInputAction } from "../../originals/ui/prompt-input";
import { ModelPicker, type ModelOption } from "../../originals/ui/model-picker";
import { ContextMeter } from "../../originals/ui/context-meter";
import { ThinkingState } from "../../originals/ui/thinking-state";
import { Attachment, AttachmentList } from "../../originals/ui/attachment";
import { AppShell } from "../../originals/blocks/app-shell";

const MODELS: ModelOption[] = [
  { id: "swift", name: "Swift", description: "Quick answers for everyday questions", icon: <Zap size={16} /> },
  { id: "balanced", name: "Balanced", description: "Strong reasoning at a good speed", icon: <Sparkles size={16} />, badge: "Default" },
  { id: "deep", name: "Deep", description: "Thinks longer on hard problems", icon: <Brain size={16} />, badge: "New" },
  { id: "legacy", name: "Legacy", description: "Retired, kept for old threads", disabled: true },
];

function Composer() {
  const [busy, setBusy] = useState(false);
  const send = () => {
    setBusy(true);
    setTimeout(() => setBusy(false), 2000);
  };
  return (
    <PromptInput
      busy={busy}
      onStop={() => setBusy(false)}
      onSubmit={send}
      leading={
        <PromptInputAction label="Attach files">
          <Paperclip size={16} />
        </PromptInputAction>
      }
      trailing={
        <>
          <ContextMeter used={46_000} limit={200_000} />
          <ModelPicker models={MODELS} defaultValue="balanced" placement="top" align="end" />
        </>
      }
    />
  );
}

export function Section() {
  return (
    <div className="grid gap-10">
      <Demo title="Prompt input" slug="prompt-input">
        <div className="mx-auto w-full max-w-xl">
          <Composer />
        </div>
      </Demo>
      <Demo title="Model picker" slug="model-picker">
        <ModelPicker models={MODELS} defaultValue="balanced" />
      </Demo>
      <Demo title="Context meter" slug="context-meter">
        <div className="flex flex-wrap items-center gap-3">
          <ContextMeter used={40_000} limit={200_000} showLabel placement="bottom" segments={[{ label: "System", tokens: 4_200 }, { label: "Messages", tokens: 35_800 }]} />
          <ContextMeter used={150_000} limit={200_000} showLabel placement="bottom" />
          <ContextMeter used={188_000} limit={200_000} showLabel placement="bottom" />
        </div>
      </Demo>
      <Demo title="Thinking state" slug="thinking-state">
        <div className="grid gap-2">
          <ThinkingState active />
          <ThinkingState active={false} seconds={65} defaultOpen>
            Compared both approaches; the second needs no new dependency.
          </ThinkingState>
        </div>
      </Demo>
      <Demo title="App shell" slug="app-shell">
        <div className="h-[420px] w-full overflow-hidden rounded-[16px] shadow-[var(--shadow-card)]">
          <AppShell
            product={{ name: "Northbeam", mark: <span className="grid size-7 place-items-center rounded-[9px] bg-[image:var(--grad-primary)] text-[var(--inverse-fg)]"><Sparkles size={14} /></span> }}
            sections={[{ items: [{ id: "home", label: "Home", icon: <Home size={16} /> }, { id: "inbox", label: "Inbox", icon: <Inbox size={16} />, badge: 3 }, { id: "settings", label: "Settings", icon: <Settings size={16} /> }] }]}
            title="Home"
            subtitle="Workspace overview"
          >
            <div className="grid gap-3 @[640px]:grid-cols-3">
              {["Open tasks", "Due this week", "Shipped"].map((label, i) => (
                <div key={label} className="rounded-[16px] bg-surface p-4 shadow-[var(--shadow-card)] dark:bg-raised">
                  <p className="text-xs text-fg-muted">{label}</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-fg">{[24, 7, 132][i]}</p>
                </div>
              ))}
            </div>
          </AppShell>
        </div>
      </Demo>
      <Demo title="Attachment" slug="attachment">
        <AttachmentList>
          <Attachment key="a" name="storyboard-final.png" size={1_800_000} type="image/png" />
          <Attachment key="b" name="brief.pdf" size={2_500_000} progress={0.45} />
          <Attachment key="c" name="raw-footage.mov" error="Over the 50 MB limit" onRemove={() => {}} />
        </AttachmentList>
      </Demo>
    </div>
  );
}
