"use client";

import { useState } from "react";
import { Badge } from "../../registry/ui/badge";

/* Dev tools flaky tests: tests ranked by failure rate over recent runs, with a quarantine toggle per test. A card, 1/2 width of a 12-column grid (6 columns), responsive to its container. */

export interface FlakyTest {
  id: string;
  name: string;
  suite: string;
  failures: number;
  runs: number;
  quarantined?: boolean;
}

export interface DevToolsFlakyTestsProps {
  tests?: FlakyTest[];
  onQuarantineChange?: (id: string, quarantined: boolean) => void;
  className?: string;
}

export const DEMO_FLAKY: FlakyTest[] = [
  { id: "t1", name: "checkout applies coupon after retry", suite: "web-e2e", failures: 41, runs: 210 },
  { id: "t2", name: "websocket reconnects within 5s", suite: "realtime", failures: 27, runs: 198 },
  { id: "t3", name: "invoice PDF matches snapshot", suite: "billing", failures: 19, runs: 240, quarantined: true },
  { id: "t4", name: "search results paginate", suite: "web-e2e", failures: 11, runs: 205 },
  { id: "t5", name: "queue drains on shutdown", suite: "worker", failures: 6, runs: 230 },
];

export function failureRate(t: Pick<FlakyTest, "failures" | "runs">): number {
  return t.runs === 0 ? 0 : (t.failures / t.runs) * 100;
}

export function rankByFailureRate(tests: FlakyTest[]): FlakyTest[] {
  return [...tests].sort((a, b) => failureRate(b) - failureRate(a));
}

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export function DevToolsFlakyTests({ tests = DEMO_FLAKY, onQuarantineChange, className = "" }: DevToolsFlakyTestsProps) {
  const [quarantined, setQuarantined] = useState<Record<string, boolean>>(() => Object.fromEntries(tests.map((t) => [t.id, Boolean(t.quarantined)])));
  const ranked = rankByFailureRate(tests);
  const top = Math.max(...ranked.map(failureRate), 1);
  const toggle = (id: string) => {
    const next = !quarantined[id];
    setQuarantined((q) => ({ ...q, [id]: next }));
    onQuarantineChange?.(id, next);
  };
  return (
    <section aria-label="Flaky tests" className={`@container rounded-[20px] bg-surface p-4 shadow-[var(--shadow-card)] @[480px]:p-5 ${className}`}>
      <header className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-[15px] font-semibold text-fg">Flaky tests</h2>
        <Badge tone="warning">{ranked.length - Object.values(quarantined).filter(Boolean).length} active</Badge>
      </header>
      <ol className="grid gap-3">
        {ranked.map((t) => {
          const rate = failureRate(t);
          const q = quarantined[t.id];
          return (
            <li key={t.id} className={`grid gap-1.5 ${q ? "opacity-60" : ""}`}>
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-fg">{t.name}</p>
                  <p className="text-[12px] text-fg-muted">{t.suite} · {t.failures} of {t.runs} runs failed</p>
                </div>
                <span className="text-[14px] font-semibold tabular-nums text-fg">{rate.toFixed(1)}%</span>
                <button type="button" aria-pressed={q} aria-label={`${q ? "Release" : "Quarantine"} ${t.name}`} onClick={() => toggle(t.id)} className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${q ? "bg-warning-soft text-warning-text" : "bg-subtle text-fg-muted hover:text-fg"} ${ring}`}>
                  {q ? "Quarantined" : "Quarantine"}
                </button>
              </div>
              <div aria-hidden className="h-1.5 overflow-hidden rounded-full bg-track">
                <div className="h-full rounded-full" style={{ width: `${(rate / top) * 100}%`, background: rate > 15 ? "var(--danger)" : "var(--warning)" }} />
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
