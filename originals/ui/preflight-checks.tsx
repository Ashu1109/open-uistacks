"use client";

import { Check, CircleAlert, Loader2, TriangleAlert } from "lucide-react";

/* Preflight checks: the conditions verified before an agent run starts; the Start button stays disabled while any check fails or is still pending. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export type PreflightStatus = "pending" | "pass" | "warn" | "fail";
export interface PreflightCheck {
  id: string;
  label: string;
  status: PreflightStatus;
  note?: string;
}

export function summarizeChecks(checks: PreflightCheck[]): { passed: number; total: number; canStart: boolean } {
  const passed = checks.filter((c) => c.status === "pass" || c.status === "warn").length;
  return { passed, total: checks.length, canStart: passed === checks.length };
}

const ICON = {
  pass: <Check size={14} aria-hidden className="text-success" />,
  warn: <TriangleAlert size={14} aria-hidden className="text-warning" />,
  fail: <CircleAlert size={14} aria-hidden className="text-danger" />,
  pending: <Loader2 size={14} aria-hidden className="animate-spin text-fg-subtle motion-reduce:animate-none" />,
};
const WORD: Record<PreflightStatus, string> = { pass: "Passed", warn: "Warning", fail: "Failed", pending: "Checking" };

export interface PreflightChecksProps {
  checks: PreflightCheck[];
  onStart?: () => void;
  className?: string;
}

export function PreflightChecks({ checks, onStart, className = "" }: PreflightChecksProps) {
  const { passed, total, canStart } = summarizeChecks(checks);
  return (
    <section aria-label="Preflight checks" className={`rounded-[16px] bg-surface p-4 shadow-[var(--shadow-card)] dark:bg-raised ${className}`}>
      <div className="flex items-baseline justify-between">
        <h4 className="text-sm font-medium text-fg">Preflight checks</h4>
        <span aria-live="polite" className="text-xs tabular-nums text-fg-muted">{passed} of {total} ready</span>
      </div>
      <ul className="mt-3 space-y-2.5">
        {checks.map((c) => (
          <li key={c.id} className="flex items-start gap-2.5">
            <span className="mt-0.5">{ICON[c.status]}</span>
            <div>
              <p className="text-[13px] text-fg">{c.label}<span className="sr-only"> — {WORD[c.status]}</span></p>
              {c.note && <p className="text-xs text-fg-subtle">{c.note}</p>}
            </div>
          </li>
        ))}
      </ul>
      {onStart && (
        <button
          type="button"
          disabled={!canStart}
          onClick={onStart}
          className={`mt-4 h-9 w-full rounded-[10px] bg-[image:var(--grad-primary)] text-[13px] text-[var(--inverse-fg)] shadow-[var(--shadow-btn-primary)] disabled:opacity-40 ${ring}`}
        >
          Start run
        </button>
      )}
    </section>
  );
}
