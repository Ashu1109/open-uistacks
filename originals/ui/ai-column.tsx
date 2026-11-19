"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

/* AI column: a table with a computed column whose cells are generated per row by an async function, with a shimmer while loading, a per-cell error and a "Run column" header action. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface AiColumnRow {
  id: string;
  [key: string]: string;
}

export interface AiColumnProps {
  columns: { key: string; label: string }[];
  rows: AiColumnRow[];
  /** Header of the AI column. */
  label: string;
  /** Shown under the header so people can see what the column does. */
  prompt: string;
  generate: (row: AiColumnRow) => Promise<string>;
  className?: string;
}

type Cell = { state: "loading" } | { state: "done"; text: string } | { state: "error" };

export function AiColumn({ columns, rows, label, prompt, generate, className = "" }: AiColumnProps) {
  const [cells, setCells] = useState<Record<string, Cell>>({});
  const running = Object.values(cells).some((c) => c.state === "loading");
  const setCell = (id: string, cell: Cell) => setCells((prev) => ({ ...prev, [id]: cell }));

  const runRow = async (row: AiColumnRow) => {
    setCell(row.id, { state: "loading" });
    try {
      setCell(row.id, { state: "done", text: await generate(row) });
    } catch {
      setCell(row.id, { state: "error" });
    }
  };
  const runAll = () => void Promise.all(rows.filter((r) => cells[r.id]?.state !== "done").map(runRow));

  return (
    <div className={`overflow-x-auto rounded-[18px] bg-surface shadow-[var(--shadow-card)] dark:bg-raised ${className}`}>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-track">
            {columns.map((c) => (
              <th key={c.key} scope="col" className="px-4 py-3 text-xs font-medium text-fg-subtle">{c.label}</th>
            ))}
            <th scope="col" className="bg-select-soft/60 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-xs font-medium text-select-text"><Sparkles size={12} aria-hidden />{label}</span>
                <button type="button" onClick={runAll} disabled={running} className={`h-7 rounded-lg bg-surface px-2.5 text-xs font-medium text-fg shadow-[var(--shadow-btn-secondary)] disabled:opacity-60 dark:bg-raised ${ring}`}>{running ? "Running…" : "Run column"}</button>
              </div>
              <p className="mt-0.5 text-[11px] font-normal text-fg-subtle">{prompt}</p>
            </th>
          </tr>
        </thead>
        <tbody aria-live="polite">
          {rows.map((r) => {
            const cell = cells[r.id];
            return (
              <tr key={r.id} className="border-b border-track last:border-0">
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3 text-fg-muted">{r[c.key]}</td>
                ))}
                <td className="bg-select-soft/30 px-4 py-3">
                  {cell?.state === "loading" ? (
                    <span role="status" aria-label={`Generating for ${r.id}`} className="block h-3 w-24 animate-pulse rounded-full bg-track motion-reduce:animate-none" />
                  ) : cell?.state === "done" ? (
                    <span className="text-fg">{cell.text}</span>
                  ) : cell?.state === "error" ? (
                    <button type="button" onClick={() => void runRow(r)} className={`text-xs text-danger-text underline ${ring}`}>Failed, retry</button>
                  ) : (
                    <button type="button" aria-label={`Generate for ${r.id}`} onClick={() => void runRow(r)} className={`text-xs text-fg-subtle hover:text-fg ${ring}`}>Generate</button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
