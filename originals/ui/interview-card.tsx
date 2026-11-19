"use client";

import { useState } from "react";
import { CountUp } from "./chart-utils";

/* Interview card: an AI-written interview summary with an overall score, per-criterion bars, highlights and an advance / hold / pass decision. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export type Decision = "advance" | "hold" | "pass";

export interface Criterion {
  label: string;
  /** 0 to 5. */
  score: number;
}

export interface InterviewCardProps {
  name: string;
  role: string;
  date: string;
  criteria: Criterion[];
  summary: string;
  highlights?: string[];
  decision?: Decision | null;
  defaultDecision?: Decision | null;
  onDecision?: (decision: Decision) => void;
  className?: string;
}

export function averageScore(criteria: Criterion[]): number {
  if (criteria.length === 0) return 0;
  return Math.round((criteria.reduce((sum, c) => sum + c.score, 0) / criteria.length) * 10) / 10;
}

export function suggestedDecision(score: number): Decision {
  return score >= 4 ? "advance" : score >= 3 ? "hold" : "pass";
}

const DECISIONS: { id: Decision; label: string; on: string }[] = [
  { id: "advance", label: "Advance", on: "bg-success-soft text-success-text" },
  { id: "hold", label: "Hold", on: "bg-warning-soft text-warning-text" },
  { id: "pass", label: "Pass", on: "bg-danger-soft text-danger-text" },
];

export function InterviewCard({ name, role, date, criteria, summary, highlights = [], decision, defaultDecision = null, onDecision, className = "" }: InterviewCardProps) {
  const [inner, setInner] = useState<Decision | null>(defaultDecision);
  const current = decision === undefined ? inner : decision;
  const average = averageScore(criteria);
  const suggestion = suggestedDecision(average);
  const choose = (d: Decision) => {
    if (decision === undefined) setInner(d);
    onDecision?.(d);
  };

  return (
    <article aria-label={`Interview with ${name}`} className={`w-full max-w-md rounded-[20px] bg-surface p-5 shadow-[var(--shadow-card)] dark:bg-raised ${className}`}>
      <header className="flex items-start justify-between gap-4">
        <div>
          <h4 className="text-[15px] font-medium text-fg">{name}</h4>
          <p className="text-xs text-fg-subtle">{role} · {date}</p>
        </div>
        <div className="text-right">
          <p aria-label={`Overall score ${average} out of 5`} className="text-2xl font-semibold tabular-nums leading-none text-fg"><CountUp text={average.toFixed(1)} /></p>
          <p className="mt-1 text-[11px] text-fg-subtle">of 5 · AI suggests {suggestion}</p>
        </div>
      </header>
      <p className="mt-3 text-sm leading-relaxed text-fg-muted">{summary}</p>
      <ul aria-label="Criteria" className="mt-4 grid gap-2">
        {criteria.map((c) => (
          <li key={c.label} className="grid grid-cols-[96px_1fr_24px] items-center gap-3 text-xs">
            <span className="text-fg-muted">{c.label}</span>
            <span role="meter" aria-label={c.label} aria-valuemin={0} aria-valuemax={5} aria-valuenow={c.score} className="h-1.5 overflow-hidden rounded-full bg-track">
              <span className="block h-full rounded-full bg-select" style={{ width: `${(Math.min(Math.max(c.score, 0), 5) / 5) * 100}%` }} />
            </span>
            <span className="text-right tabular-nums text-fg">{c.score}</span>
          </li>
        ))}
      </ul>
      {highlights.length > 0 && (
        <ul aria-label="Highlights" className="mt-4 grid gap-1.5 border-t border-track pt-3">
          {highlights.map((h) => (
            <li key={h} className="text-xs text-fg-muted before:mr-2 before:text-fg-subtle before:content-['•']">{h}</li>
          ))}
        </ul>
      )}
      <div role="radiogroup" aria-label="Decision" className="mt-4 flex gap-1 rounded-[12px] bg-subtle p-1">
        {DECISIONS.map((d) => (
          <button key={d.id} type="button" role="radio" aria-checked={current === d.id} onClick={() => choose(d.id)} className={`h-8 flex-1 rounded-[9px] text-[13px] font-medium transition-colors ${current === d.id ? d.on : "text-fg-muted hover:text-fg"} ${ring}`}>
            {d.label}
          </button>
        ))}
      </div>
    </article>
  );
}
