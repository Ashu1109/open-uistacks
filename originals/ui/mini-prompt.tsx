"use client";

import { ArrowUp, Sparkles } from "lucide-react";
import { useState, useSyncExternalStore, type FormEvent } from "react";
import { motion, useReducedMotion } from "motion/react";


/* Mini prompt: a compact single-line pill for quick asks inside toolbars and cards; Enter sends, Escape clears. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}
const spring = { type: "spring", stiffness: 480, damping: 34 } as const;

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface MiniPromptProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onSubmit?: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function MiniPrompt({ value: valueProp, defaultValue = "", onValueChange, onSubmit, placeholder = "Ask AI", disabled = false, className = "" }: MiniPromptProps) {
  const reduce = useReduce();
  const [inner, setInner] = useState(defaultValue);
  const value = valueProp ?? inner;
  const change = (next: string) => {
    if (valueProp === undefined) setInner(next);
    onValueChange?.(next);
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const text = value.trim();
    if (!text || disabled) return;
    onSubmit?.(text);
    change("");
  };
  return (
    <motion.form initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={spring} onSubmit={submit} className={`flex h-10 w-full max-w-sm items-center gap-2 rounded-full bg-surface pl-3.5 pr-1.5 shadow-[var(--shadow-card)] transition-shadow duration-200 focus-within:shadow-[var(--shadow-card),0_0_0_3px_var(--select-soft)] ${disabled ? "opacity-60" : ""} ${className}`}>
      <Sparkles size={15} className="shrink-0 text-select-text" aria-hidden />
      <input
        type="text"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(e) => change(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Escape") change(""); }}
        className="min-w-0 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-fg-subtle"
      />
      <motion.button type="submit" disabled={disabled || !value.trim()} aria-label="Send" whileTap={reduce ? undefined : { scale: 0.9 }} animate={{ scale: reduce || value.trim() ? 1 : 0.92 }} transition={spring} className={`grid size-7 shrink-0 place-items-center rounded-full bg-[image:var(--grad-primary)] text-[var(--inverse-fg)] shadow-[var(--shadow-btn-primary)] disabled:opacity-30 ${ring}`}>
        <ArrowUp size={14} strokeWidth={2.25} aria-hidden />
      </motion.button>
    </motion.form>
  );
}
