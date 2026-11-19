"use client";

import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "motion/react";


/* Source viewer: shows the document excerpt behind a citation with the cited passage highlighted, and steps between several sources. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}
const spring = { type: "spring", stiffness: 480, damping: 34 } as const;

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface SourceDoc {
  id: string;
  title: string;
  url?: string;
  text: string;
  /** The passage the answer relied on; marked inside `text`. */
  highlight?: string;
}

export interface TextPart {
  text: string;
  match: boolean;
}

/** Splits `text` around the first case-insensitive occurrence of `highlight`. */
export function splitHighlight(text: string, highlight?: string): TextPart[] {
  if (!highlight) return [{ text, match: false }];
  const at = text.toLowerCase().indexOf(highlight.toLowerCase());
  if (at < 0) return [{ text, match: false }];
  return [
    { text: text.slice(0, at), match: false },
    { text: text.slice(at, at + highlight.length), match: true },
    { text: text.slice(at + highlight.length), match: false },
  ].filter((p) => p.text);
}

export interface SourceViewerProps {
  sources: SourceDoc[];
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  className?: string;
}

export function SourceViewer({ sources, defaultIndex = 0, onIndexChange, className = "" }: SourceViewerProps) {
  const reduce = useReduce();
  const [dir, setDir] = useState(1);
  const [index, setIndex] = useState(Math.min(defaultIndex, Math.max(sources.length - 1, 0)));
  const source = sources[index];
  if (!source) return null;

  const go = (i: number) => {
    setDir(i > index ? 1 : -1);
    setIndex(i);
    onIndexChange?.(i);
  };

  return (
    <motion.section aria-label="Source" initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={spring} className={`w-full max-w-lg overflow-hidden rounded-[20px] bg-surface shadow-[var(--shadow-card)] ${className}`}>
      <header className="flex items-center gap-1 border-b border-track px-2 py-1.5">
        <motion.button type="button" aria-label="Previous source" disabled={index === 0} whileTap={reduce ? undefined : { scale: 0.88, x: -2 }} onClick={() => go(index - 1)} className={`grid size-7 place-items-center rounded-full text-fg-muted transition-colors hover:bg-subtle disabled:opacity-30 ${ring}`}><ChevronLeft size={15} aria-hidden /></motion.button>
        <motion.h3 key={source.id} initial={reduce ? false : { opacity: 0, x: dir * 14 }} animate={{ opacity: 1, x: 0 }} transition={spring} className="min-w-0 flex-1 truncate text-center text-[13px] font-medium text-fg">{source.title}</motion.h3>
        <span role="status" className="text-xs tabular-nums text-fg-subtle">{index + 1} / {sources.length}</span>
        <motion.button type="button" aria-label="Next source" disabled={index === sources.length - 1} whileTap={reduce ? undefined : { scale: 0.88, x: 2 }} onClick={() => go(index + 1)} className={`grid size-7 place-items-center rounded-full text-fg-muted transition-colors hover:bg-subtle disabled:opacity-30 ${ring}`}><ChevronRight size={15} aria-hidden /></motion.button>
      </header>
      <motion.p key={source.id} initial={reduce ? false : { opacity: 0, x: dir * 20 }} animate={{ opacity: 1, x: 0 }} transition={spring} tabIndex={0} className={`max-h-56 overflow-auto px-4 py-3 text-[13px] leading-6 text-fg-muted ${ring}`}>
        {splitHighlight(source.text, source.highlight).map((p, i) => p.match ? <motion.mark key={i} initial={reduce ? false : { opacity: 0.2 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.2 }} className="rounded bg-warning-soft px-0.5 text-fg">{p.text}</motion.mark> : <span key={i}>{p.text}</span>)}
      </motion.p>
      {source.url && (
        <footer className="border-t border-track px-4 py-2">
          <a href={source.url} target="_blank" rel="noreferrer" className={`inline-flex items-center gap-1 rounded text-xs font-medium text-select-text hover:underline ${ring}`}>Open original <ExternalLink size={12} aria-hidden /></a>
        </footer>
      )}
    </motion.section>
  );
}
