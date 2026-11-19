"use client";

import { useState } from "react";
import { Send, Sparkles, Undo2 } from "lucide-react";

/* Email draft: an editable email with AI suggestion chips (shorter, friendlier...) that rewrite the body, an undo for the last rewrite, and a send button. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface EmailSuggestion {
  id: string;
  label: string;
  /** Returns the rewritten body; may be async (a model call). */
  rewrite: (body: string) => string | Promise<string>;
}

export interface EmailDraftProps {
  to: string;
  subject: string;
  defaultBody: string;
  suggestions: EmailSuggestion[];
  onSend?: (email: { to: string; subject: string; body: string }) => void;
  className?: string;
}

/** Drops the last entry; an empty history stays empty. */
export function popHistory<T>(history: readonly T[]): { rest: T[]; last: T | undefined } {
  return { rest: history.slice(0, -1), last: history[history.length - 1] };
}

export function EmailDraft({ to, subject, defaultBody, suggestions, onSend, className = "" }: EmailDraftProps) {
  const [body, setBody] = useState(defaultBody);
  const [history, setHistory] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const apply = async (s: EmailSuggestion) => {
    setBusy(s.id);
    setError(false);
    try {
      const next = await s.rewrite(body);
      setHistory((h) => [...h, body]);
      setBody(next);
    } catch {
      setError(true);
    } finally {
      setBusy(null);
    }
  };
  const undo = () => {
    const { rest, last } = popHistory(history);
    if (last === undefined) return;
    setHistory(rest);
    setBody(last);
  };

  return (
    <section aria-label="Email draft" className={`w-full max-w-xl overflow-hidden rounded-[18px] bg-surface shadow-[var(--shadow-card)] dark:bg-raised ${className}`}>
      <dl className="divide-y divide-track border-b border-track text-sm">
        <div className="flex gap-3 px-4 py-2.5"><dt className="w-14 text-fg-subtle">To</dt><dd className="text-fg">{to}</dd></div>
        <div className="flex gap-3 px-4 py-2.5"><dt className="w-14 text-fg-subtle">Subject</dt><dd className="text-fg">{subject}</dd></div>
      </dl>
      <textarea aria-label="Message body" value={body} onChange={(e) => setBody(e.target.value)} rows={7} className="block w-full resize-none bg-transparent px-4 py-3 text-sm leading-relaxed text-fg outline-none" />
      <div className="flex flex-wrap items-center gap-2 border-t border-track px-3 py-2.5">
        <Sparkles size={14} aria-hidden className="ml-1 text-select-text" />
        {suggestions.map((s) => (
          <button key={s.id} type="button" disabled={busy !== null} onClick={() => void apply(s)} className={`h-7 rounded-full bg-select-soft px-3 text-xs font-medium text-select-text transition-opacity disabled:opacity-60 ${ring}`}>
            {busy === s.id ? "Rewriting…" : s.label}
          </button>
        ))}
        {history.length > 0 && (
          <button type="button" onClick={undo} className={`inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-xs text-fg-muted hover:bg-subtle ${ring}`}>
            <Undo2 size={12} aria-hidden /> Undo
          </button>
        )}
        <button type="button" onClick={() => onSend?.({ to, subject, body })} className={`ml-auto inline-flex h-8 items-center gap-1.5 rounded-[10px] bg-[image:var(--grad-primary)] px-3.5 text-[13px] font-medium text-[var(--inverse-fg)] shadow-[var(--shadow-btn-primary)] ${ring}`}>
          <Send size={13} aria-hidden /> Send
        </button>
      </div>
      <p role="status" className="px-4 pb-2 text-xs text-danger-text empty:hidden">{error ? "That rewrite failed. Your draft is unchanged." : ""}</p>
    </section>
  );
}
