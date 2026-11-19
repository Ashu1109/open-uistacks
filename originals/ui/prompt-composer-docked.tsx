"use client";

import { useState } from "react";
import { Paperclip } from "lucide-react";
import { PromptInput, PromptInputAction } from "./prompt-input";
import { ModelPicker, type ModelOption } from "./model-picker";
import { ContextMeter } from "./context-meter";

/* Prompt composer, docked: the chat composer pinned to the bottom of its container with suggestion chips above, a model picker, a context meter and a fade so messages scroll under it. */

export interface PromptComposerDockedProps {
  onSubmit?: (text: string) => void;
  onStop?: () => void;
  busy?: boolean;
  /** Quick prompts shown above the field while it is empty. */
  suggestions?: string[];
  models?: ModelOption[];
  model?: string;
  onModelChange?: (id: string) => void;
  contextUsed?: number;
  contextLimit?: number;
  onAttach?: () => void;
  disclaimer?: string;
  className?: string;
}

export function PromptComposerDocked({ onSubmit, onStop, busy = false, suggestions = [], models, model, onModelChange, contextUsed, contextLimit, onAttach, disclaimer, className = "" }: PromptComposerDockedProps) {
  const [value, setValue] = useState("");
  return (
    <div className={`sticky bottom-0 w-full bg-gradient-to-t from-[var(--bg)] from-70% to-transparent px-3 pb-3 pt-6 ${className}`}>
      <div className="mx-auto grid max-w-2xl gap-2">
        {value === "" && suggestions.length > 0 && (
          <ul aria-label="Suggested prompts" className="flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <li key={s}>
                <button type="button" onClick={() => setValue(s)} className="rounded-full bg-surface px-3 py-1.5 text-[13px] text-fg-muted shadow-[var(--shadow-btn-secondary)] outline-none transition-colors hover:text-fg focus-visible:ring-2 focus-visible:ring-[var(--select)]">{s}</button>
              </li>
            ))}
          </ul>
        )}
        <PromptInput
          value={value}
          onValueChange={setValue}
          onSubmit={onSubmit}
          onStop={onStop}
          busy={busy}
          leading={onAttach && <PromptInputAction label="Attach file" onClick={onAttach}><Paperclip size={17} aria-hidden /></PromptInputAction>}
          trailing={
            <>
              {contextUsed !== undefined && contextLimit !== undefined && <ContextMeter used={contextUsed} limit={contextLimit} />}
              {models && <ModelPicker models={models} value={model} onValueChange={onModelChange} placement="top" align="end" />}
            </>
          }
        />
        {disclaimer && <p className="text-center text-xs text-fg-subtle">{disclaimer}</p>}
      </div>
    </div>
  );
}
