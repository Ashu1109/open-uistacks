"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { animate, motion, useReducedMotion } from "motion/react";

/* Permission matrix: a table of roles or members against permissions with checkboxes per cell, plus select-all for every row and column that shows a mixed state. */

export type Grants = Readonly<Record<string, readonly string[]>>;
export type CheckState = "all" | "some" | "none";

export function toggleCell(grants: Grants, row: string, column: string): Grants {
  const current = grants[row] ?? [];
  return { ...grants, [row]: current.includes(column) ? current.filter((c) => c !== column) : [...current, column] };
}

export function setRow(grants: Grants, row: string, columns: readonly string[], on: boolean): Grants {
  return { ...grants, [row]: on ? [...columns] : [] };
}

export function setColumn(grants: Grants, column: string, rows: readonly string[], on: boolean): Grants {
  const next: Record<string, readonly string[]> = { ...grants };
  for (const row of rows) {
    const without = (grants[row] ?? []).filter((c) => c !== column);
    next[row] = on ? [...without, column] : without;
  }
  return next;
}

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const spring = { type: "spring", stiffness: 480, damping: 34 } as const;

function stateOf(count: number, total: number): CheckState {
  return count === 0 ? "none" : count === total ? "all" : "some";
}

export const rowState = (grants: Grants, row: string, columns: readonly string[]): CheckState => stateOf(columns.filter((c) => (grants[row] ?? []).includes(c)).length, columns.length);

export const columnState = (grants: Grants, column: string, rows: readonly string[]): CheckState => stateOf(rows.filter((r) => (grants[r] ?? []).includes(column)).length, rows.length);

function Check({ state, label, onChange, disabled }: { state: CheckState; label: string; onChange: (on: boolean) => void; disabled?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  const reduce = useReduce();
  const first = useRef(true);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = state === "some";
    if (first.current) {
      first.current = false;
      return;
    }
    if (!reduce && ref.current) animate(ref.current, { scale: [0.8, 1.2, 1] }, { duration: 0.25 });
  }, [state, reduce]);
  return (
    <motion.input
      whileTap={reduce || disabled ? undefined : { scale: 0.85 }}
      transition={spring}
      ref={ref}
      type="checkbox"
      aria-label={label}
      checked={state === "all"}
      disabled={disabled}
      onChange={() => onChange(state !== "all")}
      className="size-4 cursor-pointer accent-[var(--select)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--select)] disabled:cursor-not-allowed disabled:opacity-40"
    />
  );
}

export interface MatrixItem {
  id: string;
  label: string;
  description?: string;
}

export interface PermissionMatrixProps {
  /** Who: roles or members. */
  rows: MatrixItem[];
  /** What: permissions. */
  columns: MatrixItem[];
  value?: Grants;
  defaultValue?: Grants;
  onValueChange?: (grants: Grants) => void;
  /** Rows that cannot be edited, e.g. an owner role. */
  lockedRows?: string[];
  className?: string;
}

export function PermissionMatrix({ rows, columns, value: controlled, defaultValue = {}, onValueChange, lockedRows = [], className = "" }: PermissionMatrixProps) {
  const reduce = useReduce();
  const [inner, setInner] = useState<Grants>(defaultValue);
  const grants = controlled ?? inner;
  const editable = rows.filter((r) => !lockedRows.includes(r.id)).map((r) => r.id);
  const columnIds = columns.map((c) => c.id);

  const commit = (next: Grants) => {
    setInner(next);
    onValueChange?.(next);
  };

  return (
    <div className={`overflow-x-auto rounded-[18px] bg-surface shadow-[var(--shadow-card)] ${className}`}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-track">
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-fg-muted">Role</th>
            {columns.map((c) => (
              <th key={c.id} scope="col" className="px-3 py-3 text-center text-xs font-medium text-fg-muted">
                <div className="flex flex-col items-center gap-1.5">
                  {c.label}
                  <Check state={columnState(grants, c.id, editable)} label={`Grant ${c.label} to all`} onChange={(on) => commit(setColumn(grants, c.id, editable, on))} disabled={editable.length === 0} />
                </div>
              </th>
            ))}
            <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-fg-muted">All</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const locked = lockedRows.includes(r.id);
            return (
              <motion.tr key={r.id} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: i * 0.04 }} className="border-b border-track transition-colors duration-150 last:border-0 hover:bg-[color-mix(in_srgb,var(--fg)_3%,transparent)]">
                <th scope="row" className="px-4 py-3 text-left font-normal">
                  <span className="block font-medium text-fg">{r.label}</span>
                  {r.description && <span className="block text-xs text-fg-muted">{r.description}</span>}
                </th>
                {columns.map((c) => (
                  <td key={c.id} className="px-3 py-3 text-center">
                    <Check state={(grants[r.id] ?? []).includes(c.id) ? "all" : "none"} label={`${r.label}: ${c.label}`} onChange={() => commit(toggleCell(grants, r.id, c.id))} disabled={locked} />
                  </td>
                ))}
                <td className="px-3 py-3 text-center">
                  <Check state={rowState(grants, r.id, columnIds)} label={`${r.label}: all permissions`} onChange={(on) => commit(setRow(grants, r.id, columnIds, on))} disabled={locked} />
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
