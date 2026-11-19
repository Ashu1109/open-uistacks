"use client";

import { Mic, Square } from "lucide-react";
import { useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "motion/react";

/* Voice prompt: a mic button inside a pulsing ring and level bars driven by a 0 to 1 `level` prop, so it renders and animates without touching the microphone. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export type VoiceState = "idle" | "listening" | "processing";

export const BAR_COUNT = 5;

/** Bar heights (0.15 to 1) shaped like a soft hill around the middle, scaled by level. */
export function barHeights(level: number, count = BAR_COUNT): number[] {
  const l = Math.min(Math.max(level, 0), 1);
  const mid = (count - 1) / 2;
  return Array.from({ length: count }, (_, i) => 0.15 + 0.85 * l * (1 - Math.abs(i - mid) / (mid + 1)));
}

const CAPTION: Record<VoiceState, string> = { idle: "Tap to speak", listening: "Listening…", processing: "Working on it…" };

export interface VoicePromptProps {
  state?: VoiceState;
  /** Current input loudness, 0 to 1. */
  level?: number;
  onStart?: () => void;
  onStop?: () => void;
  className?: string;
}

export function VoicePrompt({ state = "idle", level = 0, onStart, onStop, className = "" }: VoicePromptProps) {
  const reduce = useReduce();
  const listening = state === "listening";
  const heights = barHeights(listening ? level : 0);
  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className="relative grid size-24 place-items-center">
        {listening && !reduce && (
          <motion.span aria-hidden className="absolute inset-0 rounded-full bg-select-soft" animate={{ scale: 1 + level * 0.35, opacity: 0.6 + level * 0.4 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} />
        )}
        <button
          type="button"
          aria-label={listening ? "Stop listening" : "Start voice input"}
          aria-pressed={listening}
          disabled={state === "processing"}
          onClick={listening ? onStop : onStart}
          className={`relative grid size-16 place-items-center rounded-full bg-[image:var(--grad-primary)] text-[var(--inverse-fg)] shadow-[var(--shadow-btn-primary)] disabled:opacity-50 ${ring}`}
        >
          {listening ? (
            <span aria-hidden className="flex h-6 items-center gap-[3px]">
              {heights.map((h, i) => <span key={i} className="w-[3px] rounded-full bg-current transition-[height]" style={{ height: `${h * 100}%` }} />)}
            </span>
          ) : state === "processing" ? <Square size={14} fill="currentColor" strokeWidth={0} aria-hidden /> : <Mic size={22} aria-hidden />}
        </button>
      </div>
      <p role="status" className="text-[13px] text-fg-muted">{CAPTION[state]}</p>
    </div>
  );
}
