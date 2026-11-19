"use client";

import { useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Tabs } from "../../registry/ui/tabs";
import { CountUp } from "../ui/chart-utils";

/* Data pipelines data tests: a card (1/2 width) summarising the latest dbt-style test run, with a pass-rate headline and a status-filtered list of tests grouped by the model they guard. */

export type TestResult = "pass" | "warn" | "fail";

export interface DataTest {
  id: string;
  /** The model under test, e.g. "orders". */
  model: string;
  /** e.g. "not_null(customer_id)". */
  name: string;
  result: TestResult;
  /** Rows that broke the rule, for warn and fail. */
  failingRows?: number;
}

export interface DataPipelinesDataTestsProps {
  tests?: DataTest[];
  /** Shown under the headline, e.g. "Run 2:14 AM". */
  runLabel?: string;
  className?: string;
}

export const DEMO_TESTS: DataTest[] = [
  { id: "t1", model: "orders", name: "unique(order_id)", result: "pass" },
  { id: "t2", model: "orders", name: "not_null(customer_id)", result: "fail", failingRows: 37 },
  { id: "t3", model: "orders", name: "accepted_values(status)", result: "pass" },
  { id: "t4", model: "customers", name: "unique(email)", result: "warn", failingRows: 4 },
  { id: "t5", model: "customers", name: "not_null(created_at)", result: "pass" },
  { id: "t6", model: "payments", name: "relationships(order_id)", result: "pass" },
  { id: "t7", model: "payments", name: "amount >= 0", result: "pass" },
  { id: "t8", model: "sessions", name: "recency(event_at, 1 day)", result: "pass" },
];

export function testSummary(tests: readonly DataTest[]) {
  const pass = tests.filter((t) => t.result === "pass").length;
  const warn = tests.filter((t) => t.result === "warn").length;
  const fail = tests.filter((t) => t.result === "fail").length;
  const rate = tests.length === 0 ? null : Math.round((pass / tests.length) * 1000) / 10;
  return { pass, warn, fail, total: tests.length, rate };
}

const ICON = {
  pass: <CheckCircle2 size={16} className="text-success-text" aria-hidden />,
  warn: <AlertTriangle size={16} className="text-warning-text" aria-hidden />,
  fail: <XCircle size={16} className="text-danger-text" aria-hidden />,
};
const NAME = { pass: "Passed", warn: "Warning", fail: "Failed" };

export function DataPipelinesDataTests({ tests = DEMO_TESTS, runLabel = "Last run 2:14 AM", className = "" }: DataPipelinesDataTestsProps) {
  const [filter, setFilter] = useState("all");
  const s = testSummary(tests);
  const shown = filter === "all" ? tests : tests.filter((t) => t.result === filter);
  const models = [...new Set(shown.map((t) => t.model))];
  const items = [
    { value: "all", label: "All", count: s.total },
    { value: "fail", label: "Failed", count: s.fail },
    { value: "warn", label: "Warnings", count: s.warn },
    { value: "pass", label: "Passed", count: s.pass },
  ];
  return (
    <section aria-label="Data tests" className={`@container grid content-start gap-4 rounded-[20px] bg-surface p-5 shadow-[var(--shadow-card)] ${className}`}>
      <header className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-fg">Data tests</h2>
          <p className="text-[13px] text-fg-muted">{runLabel}</p>
        </div>
        <p className="text-right">
          <span className="block text-2xl font-semibold tabular-nums text-fg"><CountUp text={s.rate === null ? "n/a" : `${s.rate}%`} /></span>
          <span className="block text-[13px] text-fg-muted">
            {s.pass} of {s.total} passing
          </span>
        </p>
      </header>
      <div className="flex h-1.5 overflow-hidden rounded-full bg-track" role="img" aria-label={`${s.pass} passed, ${s.warn} warnings, ${s.fail} failed`}>
        <span style={{ width: `${(s.pass / (s.total || 1)) * 100}%`, background: "var(--success)" }} />
        <span style={{ width: `${(s.warn / (s.total || 1)) * 100}%`, background: "var(--warning)" }} />
        <span style={{ width: `${(s.fail / (s.total || 1)) * 100}%`, background: "var(--danger)" }} />
      </div>
      <div className="-mx-1 overflow-x-auto px-1">
        <Tabs items={items} value={filter} onValueChange={setFilter} variant="pill" size="sm" label="Filter tests by result" />
      </div>
      {models.length === 0 ? (
        <p className="py-6 text-center text-sm text-fg-muted">No tests with this result.</p>
      ) : (
        <div className="grid gap-3">
          {models.map((m) => (
            <div key={m}>
              <h3 className="px-2 pb-1 font-mono text-[12px] font-medium uppercase tracking-wide text-fg-subtle">{m}</h3>
              <ul>
                {shown
                  .filter((t) => t.model === m)
                  .map((t) => (
                    <li key={t.id} className="flex items-center gap-2.5 rounded-[10px] px-2 py-1.5">
                      <span title={NAME[t.result]}>{ICON[t.result]}</span>
                      <span className="sr-only">{NAME[t.result]}:</span>
                      <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-fg">{t.name}</span>
                      {t.failingRows ? <span className="text-[13px] tabular-nums text-fg-muted">{t.failingRows} rows</span> : null}
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
