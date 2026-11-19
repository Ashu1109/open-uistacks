"use client";

import { useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Ban, CircleCheck, Flag } from "lucide-react";

/* Policy block: a guardrail notice showing which policy fired, the matched text highlighted in context, a severity, and override or dismiss actions. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}
const spring = { type: "spring", stiffness: 480, damping: 36 } as const;

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export type PolicyOutcome = "blocked" | "flagged" | "passed";

export interface PolicyBlockProps {
  policy: string;
  rule: string;
  outcome: PolicyOutcome;
  /** Text the policy inspected. */
  excerpt?: string;
  /** Substring of `excerpt` that triggered the rule. */
  match?: string;
  onOverride?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export interface ExcerptPart {
  text: string;
  hit: boolean;
}

/** Splits `text` around every case-insensitive occurrence of `match`; parts concatenate back to `text`. */
export function splitMatch(text: string, match?: string): ExcerptPart[] {
  if (!match) return [{ text, hit: false }];
  const parts: ExcerptPart[] = [];
  const lower = text.toLowerCase();
  const needle = match.toLowerCase();
  let from = 0;
  for (let at = lower.indexOf(needle); at !== -1; at = lower.indexOf(needle, from)) {
    if (at > from) parts.push({ text: text.slice(from, at), hit: false });
    parts.push({ text: text.slice(at, at + needle.length), hit: true });
    from = at + needle.length;
  }
  if (from < text.length) parts.push({ text: text.slice(from), hit: false });
  return parts;
}

const OUTCOME = {
  blocked: { icon: Ban, label: "Blocked", box: "bg-danger-soft", tone: "text-danger-text" },
  flagged: { icon: Flag, label: "Flagged", box: "bg-warning-soft", tone: "text-warning-text" },
  passed: { icon: CircleCheck, label: "Passed", box: "bg-success-soft", tone: "text-success-text" },
} as const;

export function PolicyBlock({ policy, rule, outcome, excerpt, match, onOverride, onDismiss, className = "" }: PolicyBlockProps) {
  const { icon: Icon, label, box, tone } = OUTCOME[outcome];
  const reduce = useReduce();
  return (
    <motion.article aria-label={`${policy}: ${label}`} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={spring} className={`w-full max-w-lg rounded-[16px] p-4 ${box} ${className}`}>
      <div className="flex items-start gap-3">
        <motion.span key={outcome} initial={reduce ? false : { scale: 0.4, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ ...spring, stiffness: 520, damping: 22, delay: 0.1 }} className="mt-0.5 shrink-0"><Icon size={18} aria-hidden className={tone} /></motion.span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-fg"><span className={tone}>{label}</span> by {policy}</p>
          <p className="mt-0.5 text-xs text-fg-muted">{rule}</p>
          {excerpt && (
            <blockquote className="mt-3 rounded-[10px] bg-surface/70 px-3 py-2 text-sm text-fg-muted dark:bg-bg/40">
              {splitMatch(excerpt, match).map((p, i) => (p.hit ? <motion.mark key={i} initial={reduce ? false : { boxShadow: "0 0 0 5px rgba(239,68,68,0.35)" }} animate={{ boxShadow: "0 0 0 0 rgba(239,68,68,0)" }} transition={{ duration: 0.7, delay: 0.3 }} className="rounded bg-danger/20 px-0.5 text-fg">{p.text}</motion.mark> : <span key={i}>{p.text}</span>))}
            </blockquote>
          )}
          {outcome !== "passed" && (onOverride || onDismiss) && (
            <div className="mt-3 flex gap-2">
              {onOverride && <motion.button type="button" whileTap={reduce ? undefined : { scale: 0.97 }} onClick={onOverride} className={`h-8 rounded-[10px] bg-surface px-3 text-[13px] font-medium text-fg shadow-[var(--shadow-btn-secondary)] transition-colors hover:brightness-95 dark:bg-raised ${ring}`}>Override once</motion.button>}
              {onDismiss && <motion.button type="button" whileTap={reduce ? undefined : { scale: 0.97 }} onClick={onDismiss} className={`h-8 rounded-[10px] px-3 text-[13px] text-fg-muted transition-colors hover:bg-surface/60 ${ring}`}>Dismiss</motion.button>}
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
}
