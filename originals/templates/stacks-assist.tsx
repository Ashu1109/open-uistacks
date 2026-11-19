"use client";

import { useState } from "react";
import { BookOpen, Home, MessageSquare, Quote, Sparkles, SquarePen } from "lucide-react";
import { AppShell } from "../blocks/app-shell";
import { AssistantHome } from "../blocks/assistant-home";
import { AssistantStart } from "../blocks/assistant-start";
import { ChatAnswerSources } from "../blocks/chat-answer-sources";
import { ChatThreadComposer } from "../blocks/chat-thread-composer";
import { KnowledgeSources } from "../blocks/knowledge-sources";
import { Button } from "../../registry/ui/button";
import type { NavSection } from "../ui/sidebar-nav";

/* Stacks Assist: an AI assistant product screen. Navigation switches between Home, New chat, a Chat thread, a cited Answer and the Knowledge sources manager. */

export interface StacksAssistProps {
  className?: string;
}

const SECTIONS: NavSection[] = [
  {
    items: [
      { id: "home", label: "Home", icon: <Home size={18} /> },
      { id: "new", label: "New chat", icon: <SquarePen size={18} /> },
      { id: "chat", label: "Chat", icon: <MessageSquare size={18} /> },
      { id: "answer", label: "Answer", icon: <Quote size={18} /> },
    ],
  },
  { title: "Workspace", items: [{ id: "knowledge", label: "Knowledge", icon: <BookOpen size={18} /> }] },
];

const TITLES: Record<string, string> = {
  home: "Home",
  new: "New chat",
  chat: "Chat",
  answer: "Answer",
  knowledge: "Knowledge",
};

export function StacksAssist({ className = "" }: StacksAssistProps) {
  const [view, setView] = useState("home");
  return (
    <AppShell
      className={className}
      product={{
        name: "Stacks Assist",
        mark: (
          <span className="grid size-8 place-items-center rounded-[10px] bg-[image:var(--grad-primary)] text-[var(--inverse-fg)]" aria-hidden>
            <Sparkles size={16} />
          </span>
        ),
      }}
      sections={SECTIONS}
      activeId={view}
      onNavigate={setView}
      title={TITLES[view]}
      actions={
        <Button size="sm" variant="secondary" leadingIcon={<SquarePen />} onClick={() => setView("new")}>
          New chat
        </Button>
      }
    >
      {view === "home" ? <AssistantHome onPrompt={() => setView("chat")} onOpenChat={() => setView("chat")} /> : null}
      {view === "new" ? <AssistantStart onSend={() => setView("chat")} /> : null}
      {view === "chat" ? <div className="h-full min-h-[480px]"><ChatThreadComposer /></div> : null}
      {view === "answer" ? <div className="mx-auto w-full max-w-[720px] p-4"><ChatAnswerSources /></div> : null}
      {view === "knowledge" ? <div className="mx-auto w-full max-w-[880px] p-4"><KnowledgeSources /></div> : null}
    </AppShell>
  );
}
