"use client";

import { useState, type ReactNode } from "react";
import { BookOpen, Code2, MessageSquare, PenLine, Sparkles } from "lucide-react";
import { PromptInput } from "../ui/prompt-input";
import { Suggestions, type Suggestion } from "../../registry/ui/suggestions";

/* Assistant home: the landing screen of an AI assistant with a greeting, the composer, suggestion cards and recent chats. A full-width section (it centres itself in a 720px column); it answers to its container, not the viewport. */

export interface RecentChat {
  id: string;
  title: string;
  /** Short preview of the last message. */
  preview?: string;
  /** Already formatted, such as "2h ago". */
  when: string;
}

export interface AssistantHomeProps {
  name?: string;
  greeting?: string;
  suggestions?: Suggestion[];
  recents?: RecentChat[];
  /** Fires with the text of a typed prompt or a picked suggestion. */
  onPrompt?: (text: string) => void;
  onOpenChat?: (id: string) => void;
  className?: string;
}

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

const icon = (node: ReactNode) => <span className="text-fg-muted">{node}</span>;

export const DEFAULT_SUGGESTIONS: Suggestion[] = [
  { label: "Summarise last week's customer calls", description: "Pull themes and open questions", icon: icon(<MessageSquare size={16} />) },
  { label: "Draft a launch announcement", description: "Friendly tone, under 150 words", icon: icon(<PenLine size={16} />) },
  { label: "Explain this stack trace", description: "Find the likely root cause", icon: icon(<Code2 size={16} />) },
  { label: "Build a reading list on retrieval", description: "Five papers, one line each", icon: icon(<BookOpen size={16} />) },
];

export const DEFAULT_RECENTS: RecentChat[] = [
  { id: "r1", title: "Quarterly roadmap review", preview: "Here are the three themes that kept coming up…", when: "2h ago" },
  { id: "r2", title: "Onboarding email copy", preview: "Version two keeps the same structure but shorter.", when: "Yesterday" },
  { id: "r3", title: "Rate limiter design", preview: "A token bucket per key is the simplest start.", when: "Mon" },
];

export function AssistantHome({
  name = "Maya",
  greeting = "Good afternoon",
  suggestions = DEFAULT_SUGGESTIONS,
  recents = DEFAULT_RECENTS,
  onPrompt,
  onOpenChat,
  className = "",
}: AssistantHomeProps) {
  const [draft, setDraft] = useState("");
  return (
    <section aria-label="Assistant home" className={`@container flex w-full justify-center ${className}`}>
      <div className="flex w-full max-w-[720px] flex-col gap-8 px-4 py-8 @[640px]:py-12">
        <header className="flex flex-col items-center gap-3 text-center">
          <span className="grid size-11 place-items-center rounded-[14px] bg-select-soft text-select-text" aria-hidden>
            <Sparkles size={22} />
          </span>
          <h2 className="text-[26px] font-semibold tracking-[-0.02em] text-fg @[640px]:text-[32px]">
            {greeting}, {name}
          </h2>
          <p className="text-[15px] text-fg-muted">What would you like to work on?</p>
        </header>

        <PromptInput value={draft} onValueChange={setDraft} onSubmit={(t) => onPrompt?.(t)} placeholder="Ask anything" />

        <Suggestions items={suggestions} variant="cards" onSelect={(label) => onPrompt?.(label)} className="@[640px]:grid-cols-2" />

        <div className="flex flex-col gap-2">
          <h3 className="px-1 text-[13px] font-medium text-fg-muted">Recent chats</h3>
          <ul className="flex flex-col rounded-[18px] bg-surface p-1.5 shadow-[var(--shadow-card)]">
            {recents.map((chat) => (
              <li key={chat.id}>
                <button
                  type="button"
                  onClick={() => onOpenChat?.(chat.id)}
                  className={`flex w-full items-center justify-between gap-4 rounded-[12px] px-3 py-2.5 text-left transition hover:bg-[color-mix(in_srgb,var(--fg)_4%,var(--surface))] ${ring}`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-medium text-fg">{chat.title}</span>
                    {chat.preview ? <span className="block truncate text-[13px] text-fg-muted">{chat.preview}</span> : null}
                  </span>
                  <span className="shrink-0 text-[12px] text-fg-subtle">{chat.when}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
