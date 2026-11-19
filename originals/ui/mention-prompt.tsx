"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";

/* Mention prompt: a text field where typing @ opens a filtered list of people, files or tools; arrows move, Enter or Tab inserts the mention, Escape closes. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface MentionOption {
  id: string;
  label: string;
  hint?: string;
}

export interface MentionQuery {
  /** Index of the @ in the text. */
  start: number;
  query: string;
}

/** The mention being typed at `caret`, or null when the caret is not inside an @word. */
export function findMentionQuery(text: string, caret: number): MentionQuery | null {
  const before = text.slice(0, caret);
  const m = /(^|\s)@([\w.-]*)$/.exec(before);
  return m ? { start: caret - m[2].length - 1, query: m[2] } : null;
}

/** Replaces the @query with `@label ` and returns the new text and caret. */
export function insertMention(text: string, caret: number, mention: MentionQuery, label: string): { text: string; caret: number } {
  const insert = `@${label} `;
  return { text: text.slice(0, mention.start) + insert + text.slice(caret), caret: mention.start + insert.length };
}

export function filterMentions(options: MentionOption[], query: string): MentionOption[] {
  const q = query.toLowerCase();
  return options.filter((o) => o.label.toLowerCase().includes(q));
}

export interface MentionPromptProps {
  options: MentionOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onMention?: (option: MentionOption) => void;
  placeholder?: string;
  className?: string;
}

export function MentionPrompt({ options, value: valueProp, defaultValue = "", onValueChange, onMention, placeholder = "Type @ to mention", className = "" }: MentionPromptProps) {
  const listId = useId();
  const field = useRef<HTMLTextAreaElement>(null);
  const [inner, setInner] = useState(defaultValue);
  const [caret, setCaret] = useState(0);
  const [active, setActive] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const value = valueProp ?? inner;
  const mention = dismissed ? null : findMentionQuery(value, caret);
  const matches = mention ? filterMentions(options, mention.query) : [];
  const open = matches.length > 0;
  const current = Math.min(active, Math.max(matches.length - 1, 0));

  const change = (next: string, nextCaret: number) => {
    if (valueProp === undefined) setInner(next);
    onValueChange?.(next);
    setCaret(nextCaret);
    setActive(0);
    setDismissed(false);
  };

  const choose = (option: MentionOption) => {
    if (!mention) return;
    const out = insertMention(value, caret, mention, option.label);
    change(out.text, out.caret);
    onMention?.(option);
    requestAnimationFrame(() => field.current?.setSelectionRange(out.caret, out.caret));
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setActive((current + (e.key === "ArrowDown" ? 1 : matches.length - 1)) % matches.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      choose(matches[current]);
    } else if (e.key === "Escape") {
      setDismissed(true);
    }
  };

  return (
    <div className={`relative w-full max-w-md ${className}`}>
      <textarea
        ref={field}
        rows={3}
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open ? `${listId}-${current}` : undefined}
        onChange={(e) => change(e.target.value, e.target.selectionStart)}
        onSelect={(e) => setCaret(e.currentTarget.selectionStart)}
        onKeyDown={onKeyDown}
        className={`block w-full resize-none rounded-[18px] bg-surface px-4 py-3 text-[14px] leading-6 text-fg shadow-[var(--shadow-card)] placeholder:text-fg-subtle ${ring}`}
      />
      <ul id={listId} role="listbox" aria-label="Mentions" hidden={!open} className="absolute left-0 top-full z-10 mt-1 max-h-48 w-64 overflow-auto rounded-[14px] bg-surface p-1 shadow-[var(--shadow-overlay)] dark:bg-raised">
        {matches.map((o, i) => (
          <li key={o.id} id={`${listId}-${i}`} role="option" aria-selected={i === current} onPointerDown={(e) => { e.preventDefault(); choose(o); }} onPointerEnter={() => setActive(i)} className={`flex cursor-pointer items-baseline gap-2 rounded-[10px] px-2.5 py-1.5 text-[13px] ${i === current ? "bg-select-soft text-select-text" : "text-fg"}`}>
            <span className="font-medium">{o.label}</span>
            {o.hint && <span className="truncate text-xs text-fg-subtle">{o.hint}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
