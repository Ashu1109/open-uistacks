"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "motion/react";


/* Redacted text: a passage where sensitive parts, marked [[like this]] in the source string, show as black bars; each can be revealed on click, or all at once. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}
const spring = { type: "spring", stiffness: 480, damping: 34 } as const;

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface RedactedSegment {
  text: string;
  redacted: boolean;
}

/** Splits "Call [[Ana]] at [[555-0100]]" into plain and redacted segments. */
export function parseRedactions(source: string): RedactedSegment[] {
  return source
    .split(/(\[\[.*?\]\])/g)
    .filter(Boolean)
    .map((part) => (part.startsWith("[[") && part.endsWith("]]") ? { text: part.slice(2, -2), redacted: true } : { text: part, redacted: false }));
}

export interface RedactedTextProps {
  /** Text with [[secret]] markers. */
  text: string;
  /** Let the reader reveal redactions; turn off for output that must stay hidden. */
  revealable?: boolean;
  className?: string;
}

export function RedactedText({ text, revealable = true, className = "" }: RedactedTextProps) {
  const reduce = useReduce();
  const segments = parseRedactions(text);
  const count = segments.filter((s) => s.redacted).length;
  const [shown, setShown] = useState<Set<number>>(new Set());
  const allShown = count > 0 && shown.size === count;

  const toggle = (i: number) => setShown((prev) => {
    const next = new Set(prev);
    if (!next.delete(i)) next.add(i);
    return next;
  });
  const toggleAll = () => setShown(allShown ? new Set() : new Set(segments.flatMap((s, i) => (s.redacted ? [i] : []))));

  return (
    <div className={`w-full max-w-md ${className}`}>
      <motion.p initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} className="text-[14px] leading-7 text-fg">
        {segments.map((s, i) => {
          if (!s.redacted) return <span key={i}>{s.text}</span>;
          const visible = revealable && shown.has(i);
          const wipe = reduce ? { initial: false as const } : { initial: { clipPath: "inset(0 100% 0 0)" }, animate: { clipPath: "inset(0 0% 0 0)" }, transition: { duration: 0.3, ease: "easeOut" as const, delay: visible ? 0 : i * 0.06 } };
          const body = visible ? s.text : "█".repeat(Math.max(3, s.text.length));
          return revealable ? (
            <motion.button key={i} type="button" aria-pressed={visible} aria-label={visible ? `Hide ${s.text}` : "Reveal redacted text"} onClick={() => toggle(i)} whileTap={reduce ? undefined : { scale: 0.96 }} className={`rounded-md px-1 align-baseline transition-colors ${visible ? "bg-warning-soft text-warning-text" : "bg-[var(--inverse)] text-transparent"} ${ring}`}><motion.span key={String(visible)} className="inline-block" {...wipe}>{visible ? s.text : <span aria-hidden>{body}</span>}</motion.span></motion.button>
          ) : (
            <motion.span key={i} role="img" aria-label="Redacted" className="rounded-md bg-[var(--inverse)] px-1 text-transparent" {...wipe}>{body}</motion.span>
          );
        })}
      </motion.p>
      {revealable && count > 0 && (
        <motion.button type="button" onClick={toggleAll} whileTap={reduce ? undefined : { scale: 0.96 }} className={`mt-2 inline-flex items-center gap-1.5 rounded-full bg-subtle px-3 py-1 text-xs font-medium text-fg-muted transition-colors hover:bg-track ${ring}`}>
          <motion.span key={String(allShown)} initial={reduce ? false : { opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={spring} className="grid">{allShown ? <EyeOff size={13} aria-hidden /> : <Eye size={13} aria-hidden />}</motion.span>
          {allShown ? "Hide all" : `Reveal all (${count})`}
        </motion.button>
      )}
    </div>
  );
}
