"use client";

import { useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "motion/react";

/* Diff block: unified line diff of two strings with added and removed lines tinted, old and new line numbers, and a +/- summary. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}
const spring = { type: "spring", stiffness: 480, damping: 36 } as const;

export type DiffKind = "same" | "add" | "del";
export interface DiffLine {
  kind: DiffKind;
  text: string;
  oldNo?: number;
  newNo?: number;
}

/** Line diff via longest common subsequence. */
export function diffLines(before: string, after: string): DiffLine[] {
  const a = before === "" ? [] : before.split("\n");
  const b = after === "" ? [] : after.split("\n");
  const lcs = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--) lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) out.push({ kind: "same", text: a[i], oldNo: ++i, newNo: ++j });
    else if (j < b.length && (i === a.length || lcs[i][j + 1] > lcs[i + 1][j])) out.push({ kind: "add", text: b[j], newNo: ++j });
    else out.push({ kind: "del", text: a[i], oldNo: ++i });
  }
  return out;
}

export function diffStats(lines: DiffLine[]): { added: number; removed: number } {
  return { added: lines.filter((l) => l.kind === "add").length, removed: lines.filter((l) => l.kind === "del").length };
}

const ROW: Record<DiffKind, string> = {
  same: "text-fg-muted",
  add: "bg-success-soft text-success-text",
  del: "bg-danger-soft text-danger-text",
};
const MARK: Record<DiffKind, string> = { same: " ", add: "+", del: "-" };

export interface DiffBlockProps {
  before: string;
  after: string;
  filename?: string;
  className?: string;
}

export function DiffBlock({ before, after, filename, className = "" }: DiffBlockProps) {
  const lines = diffLines(before, after);
  const { added, removed } = diffStats(lines);
  const reduce = useReduce();
  return (
    <figure aria-label={`Diff${filename ? ` of ${filename}` : ""}`} className={`overflow-hidden rounded-[14px] bg-surface shadow-[var(--shadow-card)] dark:bg-raised ${className}`}>
      <figcaption className="flex items-center justify-between border-b border-track px-3 py-2 text-xs">
        <span className="font-mono text-fg">{filename ?? "Changes"}</span>
        <span className="tabular-nums">
          <span className="text-success-text">+{added}</span> <span className="text-danger-text">-{removed}</span>
        </span>
      </figcaption>
      <div className="overflow-x-auto py-1 font-mono text-xs leading-5">
        {lines.length === 0 && <p className="px-3 py-2 text-fg-subtle">No changes</p>}
        {lines.map((l, k) => (
          <motion.div key={k} data-kind={l.kind} initial={reduce ? false : { opacity: 0, x: l.kind === "same" ? 0 : -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25, delay: Math.min(k, 14) * 0.03 }} className={`flex min-w-max ${ROW[l.kind]}`}>
            <span aria-hidden className="w-9 shrink-0 select-none pr-2 text-right text-fg-subtle">{l.oldNo ?? ""}</span>
            <span aria-hidden className="w-9 shrink-0 select-none pr-2 text-right text-fg-subtle">{l.newNo ?? ""}</span>
            <span aria-hidden className="w-4 shrink-0 select-none">{MARK[l.kind]}</span>
            <span className="whitespace-pre pr-3">{l.text}</span>
            <span className="sr-only">{l.kind === "add" ? "added" : l.kind === "del" ? "removed" : ""}</span>
          </motion.div>
        ))}
      </div>
    </figure>
  );
}
