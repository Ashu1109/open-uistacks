"use client";

import { useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowDown, ArrowUp, ArrowUpDown, Star } from "lucide-react";
import { formatMoney } from "./cart-summary";

/* Supplier compare: a sortable table of supplier quotes (unit price, minimum order, lead time, rating) that highlights the best value in each column and lets you pick one. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const spring = { type: "spring", stiffness: 480, damping: 34 } as const;

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface Supplier {
  id: string;
  name: string;
  /** Minor units per unit. */
  unitPrice: number;
  /** Minimum order quantity. */
  moq: number;
  leadTimeDays: number;
  /** 0 to 5. */
  rating: number;
}

export type SupplierKey = "unitPrice" | "moq" | "leadTimeDays" | "rating";
export type SortDirection = "asc" | "desc";

const COLUMNS: Array<{ key: SupplierKey; label: string; higherIsBetter?: boolean }> = [
  { key: "unitPrice", label: "Unit price" },
  { key: "moq", label: "Min. order" },
  { key: "leadTimeDays", label: "Lead time" },
  { key: "rating", label: "Rating", higherIsBetter: true },
];

export interface SupplierCompareProps {
  suppliers: Supplier[];
  currency?: string;
  selectedId?: string;
  onSelect?: (id: string) => void;
  className?: string;
}

/** Id sets of the best supplier(s) per column: lowest for price, order size and lead time, highest for rating. */
export function bestValues(suppliers: Supplier[]): Record<SupplierKey, Set<string>> {
  const out = { unitPrice: new Set<string>(), moq: new Set<string>(), leadTimeDays: new Set<string>(), rating: new Set<string>() };
  for (const { key, higherIsBetter } of COLUMNS) {
    if (suppliers.length === 0) continue;
    const best = (higherIsBetter ? Math.max : Math.min)(...suppliers.map((s) => s[key]));
    suppliers.filter((s) => s[key] === best).forEach((s) => out[key].add(s.id));
  }
  return out;
}

export function sortSuppliers(suppliers: Supplier[], key: SupplierKey | null, direction: SortDirection): Supplier[] {
  if (!key) return suppliers;
  const sign = direction === "asc" ? 1 : -1;
  return [...suppliers].sort((a, b) => sign * (a[key] - b[key]));
}

export function SupplierCompare({ suppliers, currency = "USD", selectedId, onSelect, className = "" }: SupplierCompareProps) {
  const reduce = useReduce();
  const [sort, setSort] = useState<{ key: SupplierKey | null; direction: SortDirection }>({ key: null, direction: "asc" });
  const best = bestValues(suppliers);
  const rows = sortSuppliers(suppliers, sort.key, sort.direction);
  const toggle = (key: SupplierKey) => setSort((s) => ({ key, direction: s.key === key && s.direction === "asc" ? "desc" : "asc" }));
  const cell = (key: SupplierKey, s: Supplier) => {
    const text = key === "unitPrice" ? formatMoney(s.unitPrice, currency) : key === "leadTimeDays" ? `${s.leadTimeDays} days` : key === "rating" ? s.rating.toFixed(1) : s.moq.toLocaleString("en-US");
    const isBest = best[key].has(s.id);
    return (
      <td key={key} className={`px-3 py-3 text-sm tabular-nums ${isBest ? "font-medium text-success-text" : "text-fg"}`}>
        <span className="inline-flex items-center gap-1">{key === "rating" && <Star size={13} className="fill-warning text-warning" aria-hidden />}{text}{isBest && <span className="sr-only"> (best)</span>}</span>
      </td>
    );
  };
  return (
    <div className={`overflow-x-auto rounded-[18px] bg-surface shadow-[var(--shadow-card)] dark:bg-raised ${className}`}>
      <table className="w-full min-w-[560px] text-left">
        <caption className="sr-only">Supplier comparison</caption>
        <thead>
          <tr className="border-b border-track text-xs text-fg-muted">
            <th scope="col" className="px-3 py-2.5 font-medium">Supplier</th>
            {COLUMNS.map(({ key, label }) => {
              const active = sort.key === key;
              const Icon = !active ? ArrowUpDown : sort.direction === "asc" ? ArrowUp : ArrowDown;
              return (
                <th key={key} scope="col" aria-sort={active ? (sort.direction === "asc" ? "ascending" : "descending") : "none"} className="px-1 py-1 font-medium">
                  <button type="button" onClick={() => toggle(key)} className={`flex items-center gap-1 rounded-[8px] px-2 py-1.5 transition-colors hover:text-fg ${ring}`}>{label}<motion.span key={`${active}-${sort.direction}`} initial={reduce ? false : { opacity: 0, y: sort.direction === "asc" ? 4 : -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.16 }} className="grid"><Icon size={12} aria-hidden /></motion.span></button>
                </th>
              );
            })}
            <th scope="col" className="px-3 py-2.5"><span className="sr-only">Action</span></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s, i) => (
            <motion.tr key={s.id} layout={reduce ? false : "position"} initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: i * 0.04 }} aria-selected={s.id === selectedId} className={`border-b border-track transition-colors last:border-0 ${s.id === selectedId ? "bg-select-soft" : "hover:bg-subtle"}`}>
              <th scope="row" className="px-3 py-3 text-sm font-medium text-fg">{s.name}</th>
              {COLUMNS.map(({ key }) => cell(key, s))}
              <td className="px-3 py-3 text-right">
                <motion.button type="button" aria-pressed={s.id === selectedId} aria-label={`Select ${s.name}`} onClick={() => onSelect?.(s.id)} whileTap={reduce ? undefined : { scale: 0.96 }} className={`h-8 rounded-[10px] px-3 text-sm font-medium transition-colors ${s.id === selectedId ? "bg-select text-white" : "bg-subtle text-fg hover:bg-track"} ${ring}`}>
                  <AnimatePresence mode="popLayout" initial={false}><motion.span key={s.id === selectedId ? "on" : "off"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.14 }} className="block">{s.id === selectedId ? "Selected" : "Select"}</motion.span></AnimatePresence>
                </motion.button>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
