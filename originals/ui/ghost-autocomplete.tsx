"use client";

import { useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { animate, motion, useMotionValue, useReducedMotion } from "motion/react";


/* Ghost autocomplete: a text field that shows the assistant's suggested continuation as faded text after the caret; Tab accepts it, Escape dismisses it, typing the same letters keeps it. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}
const spring = { type: "spring", stiffness: 480, damping: 34 } as const;

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

/** What to show faded after `value`: the rest of `suggestion` when it continues the text, else nothing. */
export function ghostRemainder(value: string, suggestion: string): string {
  if (!value || suggestion.length <= value.length) return "";
  return suggestion.toLowerCase().startsWith(value.toLowerCase()) ? suggestion.slice(value.length) : "";
}

export interface GhostAutocompleteProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** The full text the assistant proposes, including what is already typed. */
  suggestion: string;
  onAccept?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function GhostAutocomplete({ value: valueProp, defaultValue = "", onValueChange, suggestion, onAccept, placeholder = "Start typing", className = "" }: GhostAutocompleteProps) {
  const reduce = useReduce();
  const settle = useMotionValue(1);
  const [inner, setInner] = useState(defaultValue);
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);
  const value = valueProp ?? inner;
  const ghost = dismissedFor === value ? "" : ghostRemainder(value, suggestion);

  const change = (next: string) => {
    if (valueProp === undefined) setInner(next);
    onValueChange?.(next);
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (!ghost) return;
    if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
      const full = value + ghost;
      change(full);
      if (!reduce) animate(settle, [1, 1.012, 1], { duration: 0.25 });
      onAccept?.(full);
    } else if (e.key === "Escape") {
      setDismissedFor(value);
    }
  };

  return (
    <motion.div style={{ scale: settle }} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={spring} className={`relative w-full max-w-md rounded-[18px] bg-surface shadow-[var(--shadow-card)] transition-shadow duration-200 focus-within:shadow-[var(--shadow-card),0_0_0_3px_var(--select-soft)] ${className}`}>
      <div aria-hidden className="pointer-events-none whitespace-pre-wrap break-words px-4 py-3 text-[14px] leading-6 text-transparent">
        {value}
        <motion.span key={ghost ? suggestion : "none"} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="text-fg-subtle">{ghost}</motion.span>
        {"\n"}
      </div>
      <textarea
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(e) => change(e.target.value)}
        onKeyDown={onKeyDown}
        className="absolute inset-0 resize-none rounded-[18px] bg-transparent px-4 py-3 text-[14px] leading-6 text-fg outline-none placeholder:text-fg-subtle"
      />
      {ghost && <p className="sr-only" role="status">Suggestion: {ghost}. Press Tab to accept.</p>}
      {ghost && <motion.kbd aria-hidden initial={reduce ? false : { opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={spring} className="absolute bottom-2 right-3 rounded-md bg-subtle px-1.5 py-0.5 text-[11px] text-fg-muted">Tab</motion.kbd>}
    </motion.div>
  );
}
