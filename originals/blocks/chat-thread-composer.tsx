"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { PromptInput } from "../ui/prompt-input";
import { ThinkingState } from "../ui/thinking-state";
import { Message } from "../../registry/ui/message";

/* Chat thread with composer: a scrolling conversation above a docked composer. Sending appends the message, shows a thinking state, then streams a simulated reply word by word; Stop keeps what has streamed. Timers are cleared on unmount. A full-width section that fills its parent's height. */

export interface ThreadMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface ChatThreadComposerProps {
  initialMessages?: ThreadMessage[];
  /** Produces the simulated reply for a user message. */
  replyFor?: (text: string) => string;
  /** How long the thinking state shows before words arrive. */
  thinkingMs?: number;
  /** Delay between streamed words. */
  wordMs?: number;
  onSend?: (text: string) => void;
  className?: string;
}

export const DEFAULT_THREAD: ThreadMessage[] = [
  { id: "m1", role: "user", content: "Can you outline a plan for migrating our docs to a new site?" },
  { id: "m2", role: "assistant", content: "Start by auditing what exists, then group pages into a new structure, redirect old URLs, and move content in batches." },
];

/** Reveals `text` up to `count` words, keeping the original spacing. */
export function revealWords(text: string, count: number): string {
  if (count <= 0) return "";
  return text.split(/(\s+)/).slice(0, count * 2 - 1).join("");
}

export function defaultReply(text: string): string {
  return `Here is a first pass on "${text}". Break it into small steps, name an owner for each, and review progress at the end of the week.`;
}

type Phase = "idle" | "thinking" | "streaming";

export function ChatThreadComposer({
  initialMessages = DEFAULT_THREAD,
  replyFor = defaultReply,
  thinkingMs = 1200,
  wordMs = 45,
  onSend,
  className = "",
}: ChatThreadComposerProps) {
  const [messages, setMessages] = useState<ThreadMessage[]>(initialMessages);
  const [phase, setPhase] = useState<Phase>("idle");
  const [partial, setPartial] = useState("");
  const timers = useRef<{ delay?: ReturnType<typeof setTimeout>; tick?: ReturnType<typeof setInterval> }>({});
  const scroller = useRef<HTMLDivElement>(null);
  const nextId = useRef(initialMessages.length + 1);
  const partialRef = useRef("");

  const clearTimers = useCallback(() => {
    clearTimeout(timers.current.delay);
    clearInterval(timers.current.tick);
    timers.current = {};
  }, []);
  useEffect(() => clearTimers, [clearTimers]);

  useLayoutEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, partial, phase]);

  const finish = useCallback((content: string) => {
    clearTimers();
    if (content) setMessages((prev) => [...prev, { id: `m${nextId.current++}`, role: "assistant", content }]);
    partialRef.current = "";
    setPartial("");
    setPhase("idle");
  }, [clearTimers]);

  const send = (text: string) => {
    onSend?.(text);
    setMessages((prev) => [...prev, { id: `m${nextId.current++}`, role: "user", content: text }]);
    setPhase("thinking");
    const reply = replyFor(text);
    const total = reply.split(/\s+/).filter(Boolean).length;
    timers.current.delay = setTimeout(() => {
      setPhase("streaming");
      let shown = 0;
      timers.current.tick = setInterval(() => {
        shown += 1;
        partialRef.current = revealWords(reply, shown);
        setPartial(partialRef.current);
        if (shown >= total) finish(reply);
      }, wordMs);
    }, thinkingMs);
  };

  const busy = phase !== "idle";
  return (
    <section aria-label="Chat" className={`@container flex h-full min-h-[420px] w-full flex-col ${className}`}>
      <div ref={scroller} role="log" aria-live="polite" aria-label="Conversation" className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[720px] flex-col gap-5 px-4 py-6">
          {messages.map((m) => (
            <Message key={m.id} role={m.role} content={m.content} actions={m.role === "assistant"} />
          ))}
          {phase === "thinking" ? <ThinkingState active /> : null}
          {phase === "streaming" ? <Message role="assistant" content={partial} /> : null}
        </div>
      </div>
      <div className="mx-auto w-full max-w-[720px] px-4 pb-4">
        <PromptInput onSubmit={send} busy={busy} onStop={() => finish(partialRef.current)} placeholder="Reply to the assistant" />
      </div>
    </section>
  );
}
