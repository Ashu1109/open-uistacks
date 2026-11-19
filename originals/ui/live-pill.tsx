"use client";

/* Live pill: a small status pill with a pulsing dot for live, working, idle or offline, an optional label and a trailing detail such as a viewer count. */

export type LiveState = "live" | "working" | "idle" | "offline";

export interface LivePillProps {
  state?: LiveState;
  /** Defaults to the state name. */
  label?: string;
  /** Trailing text, e.g. "1.2k watching". */
  detail?: string;
  className?: string;
}

export const DEFAULT_LABEL: Record<LiveState, string> = { live: "Live", working: "Working", idle: "Idle", offline: "Offline" };

const TONE: Record<LiveState, { pill: string; dot: string; pulse: boolean }> = {
  live: { pill: "bg-danger-soft text-danger-text", dot: "bg-danger", pulse: true },
  working: { pill: "bg-select-soft text-select-text", dot: "bg-select", pulse: true },
  idle: { pill: "bg-warning-soft text-warning-text", dot: "bg-warning", pulse: false },
  offline: { pill: "bg-subtle text-fg-subtle", dot: "bg-track-strong", pulse: false },
};

export function LivePill({ state = "live", label, detail, className = "" }: LivePillProps) {
  const tone = TONE[state];
  return (
    <span role="status" className={`inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium ${tone.pill} ${className}`}>
      <span aria-hidden className="relative flex size-2">
        {tone.pulse && <span className={`absolute inline-flex size-full animate-ping rounded-full opacity-60 motion-reduce:animate-none ${tone.dot}`} />}
        <span className={`relative inline-flex size-2 rounded-full ${tone.dot}`} />
      </span>
      {label ?? DEFAULT_LABEL[state]}
      {detail && <span className="font-normal opacity-80">· {detail}</span>}
    </span>
  );
}
