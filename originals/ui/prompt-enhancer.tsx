"use client";

import { Check, Sparkles, X } from "lucide-react";

/* Prompt enhancer: shows your draft prompt beside the assistant's improved rewrite with a shimmer while it works; accept to use the rewrite or discard to keep yours. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface PromptEnhancerProps {
  original: string;
  /** The rewrite; leave empty before enhancing. */
  enhanced?: string;
  loading?: boolean;
  onEnhance?: () => void;
  onAccept?: (enhanced: string) => void;
  onDiscard?: () => void;
  className?: string;
}

/** Words added by the rewrite, a rough "how much did it change" figure. */
export function wordDelta(original: string, enhanced: string): number {
  const count = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
  return count(enhanced) - count(original);
}

export function PromptEnhancer({ original, enhanced = "", loading = false, onEnhance, onAccept, onDiscard, className = "" }: PromptEnhancerProps) {
  const done = !loading && enhanced.length > 0;
  const delta = wordDelta(original, enhanced);
  return (
    <section aria-label="Prompt enhancer" className={`w-full max-w-lg rounded-[20px] bg-surface p-4 shadow-[var(--shadow-card)] ${className}`}>
      <h3 className="text-xs font-medium text-fg-subtle">Your prompt</h3>
      <p className="mt-1 text-[14px] leading-6 text-fg">{original}</p>
      {!done && (
        <button type="button" onClick={onEnhance} disabled={loading || !original.trim()} className={`mt-3 inline-flex items-center gap-1.5 rounded-full bg-[image:var(--grad-primary)] px-3.5 py-1.5 text-[13px] font-medium text-[var(--inverse-fg)] shadow-[var(--shadow-btn-primary)] disabled:opacity-50 ${ring}`}>
          <Sparkles size={14} aria-hidden /> {loading ? "Enhancing…" : "Enhance"}
        </button>
      )}
      {loading && (
        <div role="status" aria-label="Enhancing prompt" className="mt-3 grid gap-2">
          <span className="h-3 w-full animate-pulse rounded-full bg-track" />
          <span className="h-3 w-4/5 animate-pulse rounded-full bg-track" />
        </div>
      )}
      {done && (
        <div className="mt-3 rounded-[14px] bg-select-soft p-3">
          <h3 className="flex items-center gap-1.5 text-xs font-medium text-select-text"><Sparkles size={12} aria-hidden /> Enhanced <span className="font-normal text-fg-muted">({delta >= 0 ? "+" : ""}{delta} words)</span></h3>
          <p className="mt-1 text-[14px] leading-6 text-fg">{enhanced}</p>
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={onDiscard} className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-fg-muted hover:bg-surface ${ring}`}><X size={12} aria-hidden /> Discard</button>
            <button type="button" onClick={() => onAccept?.(enhanced)} className={`inline-flex items-center gap-1 rounded-full bg-select px-3 py-1.5 text-xs font-medium text-[var(--on-feature)] ${ring}`}><Check size={12} aria-hidden /> Use this</button>
          </div>
        </div>
      )}
    </section>
  );
}
