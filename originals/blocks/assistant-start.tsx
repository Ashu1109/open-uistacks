"use client";

import { useRef, useState } from "react";
import { Paperclip, Sparkles } from "lucide-react";
import { PromptInput, PromptInputAction } from "../ui/prompt-input";
import { ModelPicker, type ModelOption } from "../ui/model-picker";
import { ContextMeter } from "../ui/context-meter";
import { Attachment, AttachmentList } from "../ui/attachment";
import { Suggestions } from "../../registry/ui/suggestions";

/* Assistant start: the empty state of a new chat, with the composer, model picker, attachments, a context meter and starter chips. A full-width section (centred 680px column); sending hands text, model and files to onSend. */

export interface StartSend {
  text: string;
  model: string;
  files: File[];
}

export interface AssistantStartProps {
  models?: ModelOption[];
  defaultModel?: string;
  starters?: string[];
  /** Tokens already in the conversation, and the model's window. */
  contextUsed?: number;
  contextLimit?: number;
  onSend?: (send: StartSend) => void;
  className?: string;
}

export const DEFAULT_MODELS: ModelOption[] = [
  { id: "swift", name: "Swift", description: "Fast answers for everyday work" },
  { id: "deep", name: "Deep", description: "Slower, better at hard problems", badge: "New" },
  { id: "draft", name: "Draft", description: "Long-form writing and editing" },
];

export const DEFAULT_STARTERS = ["Plan my week", "Write a SQL query", "Rewrite this politely", "Explain like I'm new"];

export function AssistantStart({
  models = DEFAULT_MODELS,
  defaultModel = "swift",
  starters = DEFAULT_STARTERS,
  contextUsed = 0,
  contextLimit = 128000,
  onSend,
  className = "",
}: AssistantStartProps) {
  const [draft, setDraft] = useState("");
  const [model, setModel] = useState(defaultModel);
  const [files, setFiles] = useState<File[]>([]);
  const picker = useRef<HTMLInputElement>(null);

  const send = (text: string) => {
    onSend?.({ text, model, files });
    setFiles([]);
  };

  return (
    <section aria-label="New chat" className={`@container flex w-full justify-center ${className}`}>
      <div className="flex w-full max-w-[680px] flex-col items-center gap-6 px-4 py-10 @[640px]:py-16">
        <span className="grid size-12 place-items-center rounded-[16px] bg-[image:var(--grad-primary)] text-[var(--inverse-fg)] shadow-[var(--shadow-btn-primary)]" aria-hidden>
          <Sparkles size={22} />
        </span>
        <div className="text-center">
          <h2 className="text-[26px] font-semibold tracking-[-0.02em] text-fg">How can I help?</h2>
          <p className="mt-1 text-[15px] text-fg-muted">Start a conversation or drop in a file.</p>
        </div>
        <div className="w-full">
          <PromptInput
            value={draft}
            onValueChange={setDraft}
            onSubmit={send}
            header={
              files.length ? (
                <AttachmentList>
                  {files.map((f, i) => (
                    <Attachment key={`${f.name}-${i}`} name={f.name} size={f.size} type={f.type} onRemove={() => setFiles((prev) => prev.filter((_, j) => j !== i))} />
                  ))}
                </AttachmentList>
              ) : undefined
            }
            leading={
              <>
                <PromptInputAction label="Attach files" onClick={() => picker.current?.click()}>
                  <Paperclip size={18} />
                </PromptInputAction>
                <input
                  ref={picker}
                  type="file"
                  multiple
                  hidden
                  aria-label="Choose files"
                  onChange={(e) => {
                    const picked = Array.from(e.target.files ?? []);
                    setFiles((prev) => [...prev, ...picked]);
                    e.target.value = "";
                  }}
                />
              </>
            }
            trailing={
              <>
                <ContextMeter used={contextUsed} limit={contextLimit} placement="top" />
                <ModelPicker models={models} value={model} onValueChange={setModel} placement="top" align="end" />
              </>
            }
          />
        </div>
        <Suggestions items={starters.map((label) => ({ label }))} variant="chips" onSelect={(label) => setDraft(label)} className="justify-center" />
      </div>
    </section>
  );
}
