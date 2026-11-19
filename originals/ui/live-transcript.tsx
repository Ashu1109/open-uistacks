"use client";

import { useEffect, useRef } from "react";

/* Live transcript: a scrolling caption log of who said what and when, with an in-progress line shown faded; it stays pinned to the newest line and needs no microphone, only the text you pass in. */

export interface TranscriptLine {
  id: string;
  speaker: string;
  text: string;
  /** Seconds from the start of the recording. */
  at: number;
}

/** 0:07, 12:03, 1:02:09. */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

export interface LiveTranscriptProps {
  lines: TranscriptLine[];
  /** Words still being recognised; shown faded after the last line. */
  interim?: string;
  interimSpeaker?: string;
  live?: boolean;
  className?: string;
}

export function LiveTranscript({ lines, interim, interimSpeaker = "Speaker", live = true, className = "" }: LiveTranscriptProps) {
  const log = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = log.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines.length, interim]);

  return (
    <section aria-label="Live transcript" className={`flex h-72 w-full max-w-lg flex-col rounded-[20px] bg-surface shadow-[var(--shadow-card)] ${className}`}>
      <header className="flex items-center gap-2 px-4 pt-3 text-xs font-medium text-fg-muted">
        <span aria-hidden className={`size-2 rounded-full ${live ? "animate-pulse bg-danger" : "bg-track-strong"}`} />
        {live ? "Live" : "Ended"}
      </header>
      <div ref={log} role="log" aria-live="off" tabIndex={0} className="min-h-0 flex-1 overflow-auto px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--select)]">
        <ol className="grid gap-2.5">
          {lines.map((l) => (
            <li key={l.id} className="text-[14px] leading-5">
              <span className="mr-2 text-xs font-medium text-select-text">{l.speaker}</span>
              <time className="mr-2 text-xs tabular-nums text-fg-subtle">{formatClock(l.at)}</time>
              <span className="text-fg">{l.text}</span>
            </li>
          ))}
          {interim && (
            <li className="text-[14px] leading-5 text-fg-subtle" data-interim>
              <span className="mr-2 text-xs font-medium">{interimSpeaker}</span>
              {interim}
              <span aria-hidden className="ml-0.5 inline-block h-3.5 w-px animate-pulse bg-current align-middle" />
            </li>
          )}
        </ol>
      </div>
    </section>
  );
}
