"use client";

import { Fragment, type ReactNode } from "react";
import { Citation } from "../../registry/ui/citation";
import { Feedback } from "../../registry/ui/feedback";
import { ThinkingState } from "../ui/thinking-state";

/* Chat answer with sources: a question, a finished answer whose [n] markers become hover citations, a numbered source list and answer feedback. Fits a half- or full-width slot; the source grid goes two columns when its container is 560px or wider. */

export interface AnswerSource {
  label: string;
  title: string;
  meta?: string;
  quote?: string;
  href?: string;
}

export interface ChatAnswerSourcesProps {
  question?: string;
  /** Paragraphs; write [1], [2] where a source backs a claim. */
  answer?: string[];
  sources?: AnswerSource[];
  thoughtSeconds?: number;
  onFeedback?: (value: "up" | "down") => void;
  className?: string;
}

export type AnswerPart = { kind: "text"; text: string } | { kind: "cite"; index: number };

/** Splits a paragraph into text and citation parts; markers outside 1..count stay as text. */
export function splitCitations(text: string, count: number): AnswerPart[] {
  const parts: AnswerPart[] = [];
  let last = 0;
  for (const m of text.matchAll(/\[(\d+)\]/g)) {
    const n = Number(m[1]);
    if (n < 1 || n > count) continue;
    const at = m.index ?? 0;
    if (at > last) parts.push({ kind: "text", text: text.slice(last, at) });
    parts.push({ kind: "cite", index: n });
    last = at + m[0].length;
  }
  if (last < text.length) parts.push({ kind: "text", text: text.slice(last) });
  return parts;
}

export const DEFAULT_SOURCES: AnswerSource[] = [
  { label: "handbook.northwind.example", title: "Remote work handbook", meta: "Updated Oct 2026", quote: "Teams agree [[four core hours]] in their own timezone." },
  { label: "wiki.northwind.example", title: "Meeting norms", meta: "Wiki page", quote: "Meetings need an agenda and [[end ten minutes early]]." },
  { label: "survey.northwind.example", title: "Pulse survey results", meta: "Q3 report", quote: "Async updates saved a median of [[3.2 hours]] a week." },
];

export const DEFAULT_ANSWER = [
  "Most teams settle on four overlapping core hours in their own timezone and keep everything else asynchronous [1].",
  "Short meetings help: agendas are required and calls end ten minutes early so people can reset [2]. Written updates saved a median of 3.2 hours per person each week last quarter [3].",
];

export function ChatAnswerSources({
  question = "How do we keep a remote team in sync without more meetings?",
  answer = DEFAULT_ANSWER,
  sources = DEFAULT_SOURCES,
  thoughtSeconds = 9,
  onFeedback,
  className = "",
}: ChatAnswerSourcesProps) {
  const cite = (index: number): ReactNode => {
    const s = sources[index - 1];
    return <Citation index={index} label={s.label} title={s.title} meta={s.meta} quote={s.quote} href={s.href} className="mx-0.5 align-middle" />;
  };
  return (
    <article aria-label="Answer with sources" className={`@container flex w-full flex-col gap-4 ${className}`}>
      <div className="self-end rounded-[18px] rounded-br-[6px] bg-select-soft px-4 py-2.5 text-[15px] text-select-text">{question}</div>
      <div className="flex flex-col gap-3">
        <ThinkingState active={false} seconds={thoughtSeconds}>
          Looked for team-practice guidance, then matched claims to the three most relevant documents.
        </ThinkingState>
        <div className="flex flex-col gap-3 text-[15px] leading-7 text-fg">
          {answer.map((p, i) => (
            <p key={i}>
              {splitCitations(p, sources.length).map((part, j) => (
                <Fragment key={j}>{part.kind === "text" ? part.text : cite(part.index)}</Fragment>
              ))}
            </p>
          ))}
        </div>
        <Feedback text={answer.join("\n\n")} onFeedback={(v) => onFeedback?.(v)} />
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-[13px] font-medium text-fg-muted">Sources</h3>
        <ol className="grid gap-2 @[560px]:grid-cols-2">
          {sources.map((s, i) => (
            <li key={s.label} className="flex items-start gap-3 rounded-[14px] bg-surface p-3 shadow-[var(--shadow-card)]">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-subtle text-[12px] font-medium text-fg-muted">{i + 1}</span>
              <span className="min-w-0">
                <span className="block truncate text-[14px] font-medium text-fg">{s.title}</span>
                <span className="block truncate text-[12px] text-fg-subtle">{[s.label, s.meta].filter(Boolean).join(" · ")}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </article>
  );
}
