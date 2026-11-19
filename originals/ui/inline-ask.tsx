"use client";

import { ArrowUp, Sparkles } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent, type KeyboardEvent } from "react";
import { motion, useReducedMotion } from "motion/react";


/* Inline ask: a small popover for asking the assistant about a selected passage; shows the quoted selection, quick actions and an input, Enter sends and Escape closes. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}
const spring = { type: "spring", stiffness: 480, damping: 34 } as const;

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface InlineAskProps {
  /** The text the question is about. */
  selection: string;
  onSubmit?: (question: string, selection: string) => void;
  onClose?: () => void;
  quickActions?: string[];
  className?: string;
}

export function InlineAsk({ selection, onSubmit, onClose, quickActions = ["Explain", "Simplify", "Translate"], className = "" }: InlineAskProps) {
  const reduce = useReduce();
  const field = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  useEffect(() => field.current?.focus(), []);

  const send = (question: string) => {
    const q = question.trim();
    if (q) onSubmit?.(q, selection);
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    send(text);
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") onClose?.();
  };

  return (
    <motion.div role="dialog" aria-label="Ask about selection" initial={reduce ? false : { opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={spring} style={{ transformOrigin: "top left" }} onKeyDown={onKeyDown} className={`w-80 max-w-full rounded-[18px] bg-surface p-3 shadow-[var(--shadow-overlay)] dark:bg-raised ${className}`}>
      <blockquote className="line-clamp-2 border-l-2 border-select pl-2.5 text-xs leading-4 text-fg-muted">{selection}</blockquote>
      <ul aria-label="Quick actions" className="mt-2 flex flex-wrap gap-1.5">
        {quickActions.map((a, i) => (
          <motion.li key={a} initial={reduce ? false : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: reduce ? 0 : 0.08 + i * 0.04 }}><motion.button type="button" whileTap={reduce ? undefined : { scale: 0.95 }} onClick={() => send(a)} className={`rounded-full bg-subtle px-2.5 py-1 text-xs text-fg transition-colors hover:bg-track ${ring}`}>{a}</motion.button></motion.li>
        ))}
      </ul>
      <form onSubmit={submit} className="mt-2 flex items-center gap-2 rounded-full bg-subtle py-1 pl-3 pr-1 focus-within:ring-2 focus-within:ring-[var(--select)]">
        <Sparkles size={14} className="shrink-0 text-select-text" aria-hidden />
        <input ref={field} value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask about this…" aria-label="Question" className="min-w-0 flex-1 bg-transparent text-[13px] text-fg outline-none placeholder:text-fg-subtle" />
        <motion.button type="submit" disabled={!text.trim()} aria-label="Send question" whileTap={reduce ? undefined : { scale: 0.9 }} className={`grid size-7 place-items-center rounded-full bg-[image:var(--grad-primary)] text-[var(--inverse-fg)] transition-opacity disabled:opacity-30 ${ring}`}><ArrowUp size={14} aria-hidden /></motion.button>
      </form>
    </motion.div>
  );
}
