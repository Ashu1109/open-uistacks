"use client";

import { Check, ChevronDown, Copy, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";
import { useId, useState } from "react";

/* AI summary: a labelled AI-generated summary card with a lead sentence, collapsible key points, copy, and thumbs feedback. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export type SummaryFeedback = "up" | "down";

/** Plain text used by the copy button. */
export function summaryText(summary: string, points: string[]): string {
  return [summary, ...points.map((p) => `- ${p}`)].join("\n");
}

export interface AiSummaryProps {
  title?: string;
  summary: string;
  points?: string[];
  /** e.g. "Based on 4 documents". */
  footnote?: string;
  defaultOpen?: boolean;
  onFeedback?: (value: SummaryFeedback) => void;
  onCopy?: (text: string) => void;
  className?: string;
}

export function AiSummary({ title = "Summary", summary, points = [], footnote, defaultOpen = true, onFeedback, onCopy, className = "" }: AiSummaryProps) {
  const id = useId();
  const [open, setOpen] = useState(defaultOpen);
  const [copied, setCopied] = useState(false);
  const [vote, setVote] = useState<SummaryFeedback | null>(null);

  const copy = () => {
    const text = summaryText(summary, points);
    void navigator.clipboard?.writeText(text).catch(() => undefined);
    onCopy?.(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const rate = (v: SummaryFeedback) => {
    setVote(v);
    onFeedback?.(v);
  };

  return (
    <section aria-label={title} className={`w-full max-w-lg rounded-[20px] bg-surface p-4 shadow-[var(--shadow-card)] ${className}`}>
      <header className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-select-soft px-2 py-0.5 text-xs font-medium text-select-text"><Sparkles size={12} aria-hidden /> AI</span>
        <h3 className="flex-1 text-sm font-medium text-fg">{title}</h3>
        <button type="button" onClick={copy} aria-label={copied ? "Copied" : "Copy summary"} className={`grid size-7 place-items-center rounded-full text-fg-muted hover:bg-subtle ${ring}`}>{copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}</button>
      </header>
      <p className="mt-2 text-[14px] leading-6 text-fg">{summary}</p>
      {points.length > 0 && (
        <>
          <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)} className={`mt-2 inline-flex items-center gap-1 rounded-full text-xs font-medium text-fg-muted ${ring}`}>
            Key points <ChevronDown size={13} className={`transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
          </button>
          <ul id={id} hidden={!open} className="mt-1.5 grid gap-1 pl-4 text-[13px] leading-5 text-fg-muted [&>li]:list-disc">
            {points.map((p) => <li key={p}>{p}</li>)}
          </ul>
        </>
      )}
      <footer className="mt-3 flex items-center text-xs text-fg-subtle">
        <span className="flex-1">{footnote}</span>
        <button type="button" aria-label="Good summary" aria-pressed={vote === "up"} onClick={() => rate("up")} className={`grid size-7 place-items-center rounded-full hover:bg-subtle ${vote === "up" ? "text-success-text" : ""} ${ring}`}><ThumbsUp size={14} aria-hidden /></button>
        <button type="button" aria-label="Bad summary" aria-pressed={vote === "down"} onClick={() => rate("down")} className={`grid size-7 place-items-center rounded-full hover:bg-subtle ${vote === "down" ? "text-danger-text" : ""} ${ring}`}><ThumbsDown size={14} aria-hidden /></button>
      </footer>
    </section>
  );
}
