"use client";

import { ChevronDown, X } from "lucide-react";
import { DropdownMenu, type MenuEntry } from "./dropdown-menu";
import { useControlled } from "./dialog";

/* Filter bar: a row of filter chips, each opening a checkbox menu of options, with removable chips for every selected value and a Clear all button; selection is a map of filter id to chosen values. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterDefinition {
  id: string;
  label: string;
  options: FilterOption[];
}

/** Chosen option values keyed by filter id. */
export type FilterValue = Record<string, string[]>;

/** Adds `value` to `selected`, or removes it when already there. */
export function toggleValue(selected: string[], value: string): string[] {
  return selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value];
}

/** Total number of selected values across every filter. */
export function countActive(value: FilterValue): number {
  return Object.values(value).reduce((sum, list) => sum + list.length, 0);
}

export interface FilterBarProps {
  filters: FilterDefinition[];
  value?: FilterValue;
  defaultValue?: FilterValue;
  onValueChange?: (value: FilterValue) => void;
  /** Names the toolbar for screen readers. */
  label?: string;
  className?: string;
}

export function FilterBar({ filters, value: valueProp, defaultValue = {}, onValueChange, label = "Filters", className = "" }: FilterBarProps) {
  const [value, setValue] = useControlled(valueProp, defaultValue, onValueChange);
  const active = countActive(value);
  const selectedIn = (id: string) => value[id] ?? [];
  const change = (id: string, option: string) => setValue({ ...value, [id]: toggleValue(selectedIn(id), option) });

  const chips = filters.flatMap((f) =>
    selectedIn(f.id).flatMap((v) => {
      const option = f.options.find((o) => o.value === v);
      return option ? [{ filter: f, option }] : [];
    }),
  );

  return (
    <div role="group" aria-label={label} className={`flex flex-wrap items-center gap-2 ${className}`}>
      {filters.map((f) => {
        const count = selectedIn(f.id).length;
        const items: MenuEntry[] = f.options.map((o) => ({
          id: o.value,
          label: o.label,
          checked: selectedIn(f.id).includes(o.value),
          keepOpen: true,
          onSelect: () => change(f.id, o.value),
        }));
        return (
          <DropdownMenu
            key={f.id}
            label={f.label}
            items={items}
            trigger={
              <button
                type="button"
                className={`inline-flex h-8 items-center gap-1.5 rounded-full pl-3 pr-2 text-sm font-medium transition-colors ${ring} ${count ? "bg-select-soft text-select-text" : "bg-subtle text-fg hover:bg-track"}`}
              >
                {f.label}
                {count > 0 && <span className="grid min-w-5 place-items-center rounded-full bg-select px-1 text-[11px] leading-5 text-white">{count}</span>}
                <ChevronDown size={14} strokeWidth={2} aria-hidden className="text-current opacity-70" />
              </button>
            }
          />
        );
      })}
      {chips.map(({ filter, option }) => (
        <span key={`${filter.id}:${option.value}`} className="inline-flex h-8 items-center gap-1 rounded-full bg-surface pl-3 pr-1 text-sm text-fg shadow-[var(--shadow-hairline)] dark:bg-raised">
          <span className="text-fg-muted">{filter.label}:</span> {option.label}
          <button type="button" aria-label={`Remove ${filter.label}: ${option.label}`} onClick={() => change(filter.id, option.value)} className={`grid size-6 place-items-center rounded-full text-fg-muted hover:bg-subtle hover:text-fg ${ring}`}>
            <X size={12} strokeWidth={2.25} aria-hidden />
          </button>
        </span>
      ))}
      {active > 0 && (
        <button type="button" onClick={() => setValue({})} className={`h-8 rounded-full px-3 text-sm text-fg-muted transition-colors hover:text-fg ${ring}`}>
          Clear all
        </button>
      )}
      <span role="status" className="sr-only">{active === 0 ? "No filters applied" : `${active} filter${active === 1 ? "" : "s"} applied`}</span>
    </div>
  );
}
