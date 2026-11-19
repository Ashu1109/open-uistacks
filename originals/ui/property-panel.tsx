"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Leaving, gone } from "./chart-utils";

/* Property panel: a labelled list of record fields where text fields edit in place (Enter saves, Escape cancels) and option fields use a native select. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const SPRING = { type: "spring", stiffness: 480, damping: 36 } as const;

/** Entrance props: rise and fade in, staggered by index; reduced motion only fades. */
const enter = (i: number, reduce: boolean) =>
  reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.15 } }
    : { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, transition: { ...SPRING, delay: Math.min(i, 10) * 0.04 } };

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface PropertyOption {
  value: string;
  label: string;
}

export interface Property {
  id: string;
  label: string;
  value: string;
  /** When given the field is a select over these options. */
  options?: PropertyOption[];
  readOnly?: boolean;
}

export interface PropertyPanelProps {
  title?: string;
  properties: Property[];
  onChange?: (id: string, value: string) => void;
  className?: string;
}

/** The display text for a property: the matching option label, else the raw value, else an em dash. */
export function displayValue(p: Property): string {
  return p.options?.find((o) => o.value === p.value)?.label ?? (p.value || "—");
}

function TextField({ property, onChange }: { property: Property; onChange?: (id: string, value: string) => void }) {
  const reduce = useReduce();
  const fade = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0, scale: 0.97 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.97 } };
  const [draft, setDraft] = useState<string | null>(null);
  const latest = useRef(draft);
  latest.current = draft;
  const save = () => {
    const value = latest.current;
    if (value !== null && value !== property.value) onChange?.(property.id, value.trim());
    setDraft(null);
  };
  return (
    <div className="grid [&>*]:col-start-1 [&>*]:row-start-1">
      <AnimatePresence initial={false}>
        {draft === null ? (
          <Leaving key="view">{(out) => (
      <motion.button {...gone(out)} {...fade} transition={{ duration: 0.16 }} whileTap={reduce || property.readOnly ? undefined : { scale: 0.98 }} type="button" disabled={property.readOnly} aria-label={`Edit ${property.label}`} onClick={() => setDraft(property.value)} className={`w-full truncate rounded-[8px] px-2 py-1 text-left text-sm text-fg transition-colors enabled:hover:bg-subtle ${ring}`}>
        {displayValue(property)}
      </motion.button>
          )}</Leaving>
        ) : (
          <Leaving key="edit">{(out) => (
    <motion.input
      {...gone(out)}
      {...fade}
      transition={{ duration: 0.16 }}
      autoFocus
      aria-label={property.label}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => {
        if (e.key === "Enter") save();
        if (e.key === "Escape") setDraft(null);
      }}
      className={`w-full rounded-[8px] bg-surface px-2 py-1 text-sm text-fg shadow-[var(--shadow-card)] ${ring}`}
    />
          )}</Leaving>
        )}
      </AnimatePresence>
    </div>
  );
}

export function PropertyPanel({ title = "Properties", properties, onChange, className = "" }: PropertyPanelProps) {
  const reduce = useReduce();
  return (
    <section aria-label={title} className={`rounded-[18px] bg-surface p-3 shadow-[var(--shadow-card)] dark:bg-raised ${className}`}>
      <h4 className="px-2 pb-2 text-xs font-medium uppercase tracking-wide text-fg-subtle">{title}</h4>
      <dl className="grid gap-0.5">
        {properties.map((p, i) => (
          <motion.div key={p.id} {...enter(i, reduce)} className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-2">
            <dt className="px-2 text-sm text-fg-muted">{p.label}</dt>
            <dd>
              {p.options ? (
                <select aria-label={p.label} value={p.value} disabled={p.readOnly} onChange={(e) => onChange?.(p.id, e.target.value)} className={`w-full rounded-[8px] bg-transparent px-1.5 py-1 text-sm text-fg transition-colors enabled:hover:bg-subtle ${ring}`}>
                  {p.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                <TextField property={p} onChange={onChange} />
              )}
            </dd>
          </motion.div>
        ))}
      </dl>
    </section>
  );
}
