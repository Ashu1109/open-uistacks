"use client";

import { useEffect, useState } from "react";
import { Mic, MicOff, PhoneOff } from "lucide-react";
import { formatClock } from "./session-replay";

/* Voice call: a call card for a voice agent with a ringing / live / ended state, a running timer, an animated level meter, mute and hang-up buttons and a live caption line. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export type CallStatus = "ringing" | "live" | "ended";

export interface VoiceCallProps {
  name: string;
  /** Number or role shown under the name. */
  detail?: string;
  status: CallStatus;
  /** Seconds already elapsed when the card mounts or the status becomes live. */
  startSeconds?: number;
  /** Latest caption; shown while live. */
  caption?: string;
  muted?: boolean;
  onMutedChange?: (muted: boolean) => void;
  onHangUp?: () => void;
  className?: string;
}

export const BAR_COUNT = 24;

/** Deterministic pseudo-level (0.15 to 1) for bar `i` at tick `t`, so the meter looks alive without randomness. */
export function barLevel(i: number, t: number): number {
  return 0.15 + 0.85 * Math.abs(Math.sin(i * 0.9 + t * 0.6) * Math.cos(i * 0.37 - t * 0.21));
}

const LABEL: Record<CallStatus, string> = { ringing: "Calling…", live: "On call", ended: "Call ended" };

export function VoiceCall({ name, detail, status, startSeconds = 0, caption, muted, onMutedChange, onHangUp, className = "" }: VoiceCallProps) {
  const [seconds, setSeconds] = useState(startSeconds);
  const [tick, setTick] = useState(0);
  const [innerMuted, setInnerMuted] = useState(false);
  const isMuted = muted ?? innerMuted;
  const live = status === "live";

  useEffect(() => {
    if (!live) return;
    const clock = setInterval(() => setSeconds((s) => s + 1), 1000);
    const meter = setInterval(() => setTick((t) => t + 1), 120);
    return () => {
      clearInterval(clock);
      clearInterval(meter);
    };
  }, [live]);

  const toggleMute = () => {
    if (muted === undefined) setInnerMuted(!isMuted);
    onMutedChange?.(!isMuted);
  };

  return (
    <article aria-label={`Call with ${name}`} className={`w-full max-w-sm rounded-[22px] bg-surface p-5 shadow-[var(--shadow-card)] dark:bg-raised ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-medium text-fg">{name}</p>
          {detail && <p className="truncate text-xs text-fg-subtle">{detail}</p>}
        </div>
        <div className="text-right">
          <p role="status" className={`text-xs font-medium ${live ? "text-success-text" : "text-fg-subtle"}`}>{LABEL[status]}</p>
          <p className="text-sm tabular-nums text-fg" aria-label="Call duration">{formatClock(seconds)}</p>
        </div>
      </div>
      <div aria-hidden className="mt-4 flex h-12 items-center justify-center gap-[3px]">
        {Array.from({ length: BAR_COUNT }, (_, i) => (
          <span key={i} className="w-[3px] rounded-full bg-select transition-[height] duration-150" style={{ height: `${(live && !isMuted ? barLevel(i, tick) : 0.1) * 100}%`, opacity: live ? 1 : 0.35 }} />
        ))}
      </div>
      <p aria-live="polite" className="mt-2 min-h-10 text-center text-sm text-fg-muted">{live && caption ? `“${caption}”` : ""}</p>
      <div className="mt-3 flex justify-center gap-3">
        <button type="button" aria-label={isMuted ? "Unmute" : "Mute"} aria-pressed={isMuted} disabled={status === "ended"} onClick={toggleMute} className={`grid size-11 place-items-center rounded-full transition-colors disabled:opacity-40 ${isMuted ? "bg-warning-soft text-warning-text" : "bg-subtle text-fg hover:bg-track"} ${ring}`}>
          {isMuted ? <MicOff size={18} aria-hidden /> : <Mic size={18} aria-hidden />}
        </button>
        <button type="button" aria-label="End call" disabled={status === "ended"} onClick={onHangUp} className={`grid size-11 place-items-center rounded-full bg-danger-solid text-white disabled:opacity-40 ${ring}`}>
          <PhoneOff size={18} aria-hidden />
        </button>
      </div>
    </article>
  );
}
