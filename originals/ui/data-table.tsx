"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown, Search } from "lucide-react";

/* DataTable: a sortable, filterable, paginated table with row selection and an indeterminate header checkbox; sort, filter and paging are pure functions. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface DataColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  align?: "left" | "right";
  /** Custom cell content; defaults to the row's `key` field. */
  cell?: (row: T) => ReactNode;
  /** Value used to sort and filter; defaults to the row's `key` field. */
  value?: (row: T) => string | number;
}

export interface SortState {
  key: string;
  direction: "asc" | "desc";
}

function valueOf<T extends object>(row: T, column: DataColumn<T>): string | number {
  if (column.value) return column.value(row);
  const raw = (row as Record<string, unknown>)[column.key];
  return typeof raw === "number" ? raw : String(raw ?? "");
}

export function compareValues(a: string | number, b: string | number): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
}

/** none -> ascending -> descending -> none. */
export function nextSort(current: SortState | null, key: string): SortState | null {
  if (current?.key !== key) return { key, direction: "asc" };
  return current.direction === "asc" ? { key, direction: "desc" } : null;
}

export function sortRows<T extends object>(rows: readonly T[], columns: readonly DataColumn<T>[], sort: SortState | null): T[] {
  const column = sort && columns.find((c) => c.key === sort.key);
  if (!sort || !column) return [...rows];
  const sign = sort.direction === "asc" ? 1 : -1;
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => sign * compareValues(valueOf(a.row, column), valueOf(b.row, column)) || a.index - b.index)
    .map(({ row }) => row);
}

export function filterRows<T extends object>(rows: readonly T[], columns: readonly DataColumn<T>[], query: string): T[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...rows];
  return rows.filter((row) => columns.some((c) => String(valueOf(row, c)).toLowerCase().includes(needle)));
}

export function paginate<T>(rows: readonly T[], page: number, pageSize: number) {
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(Math.max(page, 0), pageCount - 1);
  return { rows: rows.slice(current * pageSize, (current + 1) * pageSize), page: current, pageCount };
}

export interface DataTableProps<T extends object> {
  columns: readonly DataColumn<T>[];
  rows: readonly T[];
  getRowId: (row: T) => string;
  /** Accessible name for the table. */
  label: string;
  selectable?: boolean;
  selected?: readonly string[];
  defaultSelected?: readonly string[];
  onSelectedChange?: (ids: string[]) => void;
  pageSize?: number;
  searchable?: boolean;
  className?: string;
}

function Checkbox({ checked, indeterminate = false, label, onChange }: { checked: boolean; indeterminate?: boolean; label: string; onChange: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return <input ref={ref} type="checkbox" aria-label={label} checked={checked} onChange={onChange} className={`size-4 cursor-pointer rounded accent-[var(--select)] ${ring}`} />;
}

const pagerButton = `grid size-8 place-items-center rounded-[10px] text-fg-muted transition-colors enabled:hover:bg-[color-mix(in_srgb,var(--fg)_6%,var(--surface))] disabled:opacity-40 ${ring}`;

export function DataTable<T extends object>({
  columns, rows, getRowId, label, selectable = false, selected, defaultSelected = [], onSelectedChange, pageSize = 5, searchable = true, className = "",
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [inner, setInner] = useState<readonly string[]>(defaultSelected);
  const chosen = new Set(selected ?? inner);

  const visible = useMemo(() => sortRows(filterRows(rows, columns, query), columns, sort), [rows, columns, query, sort]);
  const view = paginate(visible, page, pageSize);
  const pageIds = view.rows.map(getRowId);
  const pickedOnPage = pageIds.filter((id) => chosen.has(id)).length;

  const commit = (next: Set<string>) => {
    const ids = [...next];
    if (selected === undefined) setInner(ids);
    onSelectedChange?.(ids);
  };
  const toggle = (id: string) => commit(new Set(chosen.has(id) ? [...chosen].filter((x) => x !== id) : [...chosen, id]));
  const togglePage = () => {
    const all = pickedOnPage === pageIds.length;
    commit(new Set(all ? [...chosen].filter((id) => !pageIds.includes(id)) : [...chosen, ...pageIds]));
  };

  const first = visible.length === 0 ? 0 : view.page * pageSize + 1;
  const last = view.page * pageSize + view.rows.length;

  return (
    <div className={`overflow-hidden rounded-[20px] bg-surface shadow-[var(--shadow-card)] ${className}`}>
      {searchable && (
        <div className="flex items-center gap-2 border-b border-track px-4 py-3">
          <Search size={15} className="text-fg-subtle" aria-hidden />
          <input
            type="search"
            aria-label={`Filter ${label}`}
            placeholder="Filter"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(0); }}
            className={`h-8 w-full bg-transparent text-sm text-fg placeholder:text-fg-subtle ${ring} rounded-[8px]`}
          />
          {selectable && chosen.size > 0 && <span className="shrink-0 text-xs tabular-nums text-select-text">{chosen.size} selected</span>}
        </div>
      )}
      <div className="overflow-x-auto">
        <table aria-label={label} className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-track text-left text-xs text-fg-muted">
              {selectable && (
                <th scope="col" className="w-10 py-2.5 pl-4">
                  <Checkbox label="Select all rows on this page" checked={view.rows.length > 0 && pickedOnPage === pageIds.length} indeterminate={pickedOnPage > 0 && pickedOnPage < pageIds.length} onChange={togglePage} />
                </th>
              )}
              {columns.map((c) => {
                const active = sort?.key === c.key ? sort.direction : null;
                const Icon = active === "asc" ? ArrowUp : active === "desc" ? ArrowDown : ChevronsUpDown;
                return (
                  <th key={c.key} scope="col" aria-sort={c.sortable ? (active === "asc" ? "ascending" : active === "desc" ? "descending" : "none") : undefined} className={`px-4 py-2.5 font-medium ${c.align === "right" ? "text-right" : ""}`}>
                    {c.sortable ? (
                      <button type="button" onClick={() => { setSort(nextSort(sort, c.key)); setPage(0); }} className={`inline-flex items-center gap-1 rounded-[6px] hover:text-fg ${ring}`}>
                        {c.header}
                        <Icon size={13} aria-hidden className={active ? "text-fg" : "text-fg-subtle"} />
                      </button>
                    ) : c.header}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {view.rows.map((row) => {
              const id = getRowId(row);
              return (
                <tr key={id} aria-selected={selectable ? chosen.has(id) : undefined} className={`border-b border-track last:border-0 ${chosen.has(id) ? "bg-select-soft" : "hover:bg-[color-mix(in_srgb,var(--fg)_3%,var(--surface))]"}`}>
                  {selectable && (
                    <td className="py-2.5 pl-4"><Checkbox label={`Select row ${id}`} checked={chosen.has(id)} onChange={() => toggle(id)} /></td>
                  )}
                  {columns.map((c) => (
                    <td key={c.key} className={`px-4 py-2.5 text-fg ${c.align === "right" ? "text-right tabular-nums" : ""}`}>{c.cell ? c.cell(row) : String(valueOf(row, c))}</td>
                  ))}
                </tr>
              );
            })}
            {view.rows.length === 0 && (
              <tr><td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-8 text-center text-fg-muted">No matching rows</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-track px-4 py-2 text-xs text-fg-muted">
        <span aria-live="polite" className="tabular-nums">{first}–{last} of {visible.length}</span>
        <div className="flex items-center gap-1">
          <button type="button" aria-label="Previous page" disabled={view.page === 0} onClick={() => setPage(view.page - 1)} className={pagerButton}><ChevronLeft size={16} aria-hidden /></button>
          <span className="tabular-nums">Page {view.page + 1} of {view.pageCount}</span>
          <button type="button" aria-label="Next page" disabled={view.page >= view.pageCount - 1} onClick={() => setPage(view.page + 1)} className={pagerButton}><ChevronRight size={16} aria-hidden /></button>
        </div>
      </div>
    </div>
  );
}
