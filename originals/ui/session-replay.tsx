"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion, useSpring } from "motion/react";
import { Pause, Play } from "lucide-react";

/* Session replay: a scrubber and play button over a timeline of agent events; only events up to the playhead are shown, newest last, and speed is switchable. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}
const spring = { type: "spring", stiffness: 480, damping: 36 } as const;

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export type ReplayKind = "user" | "agent" | "tool" | "error";

export interface ReplayEvent {
  /** Seconds from the session start. */
  at: number;
  kind: ReplayKind;
  text: string;
}

export interface SessionReplayProps {
  events: ReplayEvent[];
  /** Total seconds; defaults to the last event. */
  duration?: number;
  time?: number;
  defaultTime?: number;
  onTimeChange?: (seconds: number) => void;
  className?: string;
}

/** 0:07, 12:03, 1:02:09. */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const mm = Math.floor(s / 60) % 60;
  const ss = String(s % 60).padStart(2, "0");
  return s >= 3600 ? `${Math.floor(s / 3600)}:${String(mm).padStart(2, "0")}:${ss}` : `${mm}:${ss}`;
}

export function visibleEvents(events: ReplayEvent[], time: number): ReplayEvent[] {
  return events.filter((e) => e.at <= time).sort((a, b) => a.at - b.at);
}

const KIND: Record<ReplayKind, { label: string; tone: string }> = {
  user: { label: "You", tone: "bg-select-soft text-select-text" },
  agent: { label: "Agent", tone: "bg-subtle text-fg-muted" },
  tool: { label: "Tool", tone: "bg-warning-soft text-warning-text" },
  error: { label: "Error", tone: "bg-danger-soft text-danger-text" },
};

const SPEEDS = [1, 2, 4] as const;

export function SessionReplay({ events, duration, time, defaultTime = 0, onTimeChange, className = "" }: SessionReplayProps) {
  const total = duration ?? Math.max(0, ...events.map((e) => e.at));
  const [inner, setInner] = useState(defaultTime);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const current = Math.min(time ?? inner, total);
  const controlled = time !== undefined;

  const seek = (t: number) => {
    if (!controlled) setInner(t);
    onTimeChange?.(t);
  };

  useEffect(() => {
    if (!playing) return;
    if (current >= total) {
      setPlaying(false);
      return;
    }
    const timer = setTimeout(() => seek(Math.min(current + 0.25 * speed, total)), 250);
    return () => clearTimeout(timer);
  });

  const shown = visibleEvents(events, current);
  const reduce = useReduce();
  const progress = useSpring(0, { stiffness: 260, damping: 34 });
  const fraction = total > 0 ? current / total : 0;
  useEffect(() => {
    if (reduce) progress.jump(fraction);
    else progress.set(fraction);
  }, [fraction, reduce, progress]);

  return (
    <section aria-label="Session replay" className={`overflow-hidden rounded-[18px] bg-surface shadow-[var(--shadow-card)] dark:bg-raised ${className}`}>
      <div className="relative flex items-center gap-3 border-b border-track px-4 py-3">
        <motion.div aria-hidden style={{ scaleX: progress }} className="absolute inset-x-0 -bottom-px h-0.5 origin-left bg-select" />
        <motion.button
          type="button"
          whileTap={reduce ? undefined : { scale: 0.92 }}
          aria-label={playing ? "Pause" : current >= total ? "Replay" : "Play"}
          onClick={() => {
            if (!playing && current >= total) seek(0);
            setPlaying((p) => !p);
          }}
          className={`grid size-8 place-items-center rounded-full bg-[image:var(--grad-primary)] text-[var(--inverse-fg)] shadow-[var(--shadow-btn-primary)] ${ring}`}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={playing ? "pause" : "play"} initial={reduce ? false : { opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={reduce ? undefined : { opacity: 0, scale: 0.5 }} transition={{ duration: 0.14 }} className="grid">
              {playing ? <Pause size={14} aria-hidden /> : <Play size={14} aria-hidden className="translate-x-px" />}
            </motion.span>
          </AnimatePresence>
        </motion.button>
        <input type="range" aria-label="Playhead" min={0} max={total} step={0.25} value={current} aria-valuetext={`${formatClock(current)} of ${formatClock(total)}`} onChange={(e) => seek(Number(e.target.value))} className={`h-1 flex-1 cursor-pointer accent-[var(--select)] ${ring}`} />
        <span className="w-20 text-right text-xs tabular-nums text-fg-subtle">{formatClock(current)} / {formatClock(total)}</span>
        <motion.button type="button" whileTap={reduce ? undefined : { scale: 0.92 }} aria-label={`Speed ${speed}x, change`} onClick={() => setSpeed((s) => SPEEDS[(SPEEDS.indexOf(s) + 1) % SPEEDS.length])} className={`h-7 rounded-lg px-2 text-xs font-medium tabular-nums text-fg-muted transition-colors hover:bg-subtle ${ring}`}>{speed}x</motion.button>
      </div>
      <ol aria-label="Events so far" className="grid max-h-64 gap-2 overflow-y-auto p-4">
        {shown.length === 0 && <li className="text-sm text-fg-subtle">Nothing yet. Press play or drag the playhead.</li>}
        {shown.map((e) => (
          <motion.li key={`${e.at}-${e.text}`} initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="flex items-start gap-3 text-sm">
            <span className="w-9 shrink-0 pt-0.5 text-xs tabular-nums text-fg-subtle">{formatClock(e.at)}</span>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${KIND[e.kind].tone}`}>{KIND[e.kind].label}</span>
            <span className="text-fg-muted">{e.text}</span>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}
