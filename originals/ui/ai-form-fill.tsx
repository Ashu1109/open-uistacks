"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";

/* AI form fill: a form whose "Fill with AI" button types a suggestion into each empty field in turn, with a highlight on the active field and a status line; people can still edit everything. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface FillField {
  id: string;
  label: string;
  suggestion: string;
  placeholder?: string;
  multiline?: boolean;
}

export interface AiFormFillProps {
  fields: FillField[];
  onChange?: (values: Record<string, string>) => void;
  /** Characters typed per 20ms tick. */
  charsPerTick?: number;
  className?: string;
}

/** Fields that have no value yet, in order. */
export function emptyFieldIds(fields: FillField[], values: Record<string, string>): string[] {
  return fields.filter((f) => !values[f.id]?.trim()).map((f) => f.id);
}

export function AiFormFill({ fields, onChange, charsPerTick = 2, className = "" }: AiFormFillProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [queue, setQueue] = useState<string[]>([]);
  const active = queue[0];
  const activeField = fields.find((f) => f.id === active);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!activeField) return;
    const typed = values[activeField.id] ?? "";
    if (typed.length >= activeField.suggestion.length) {
      setQueue((q) => q.slice(1));
      return;
    }
    const timer = setTimeout(() => setValues((prev) => ({ ...prev, [activeField.id]: activeField.suggestion.slice(0, typed.length + charsPerTick) })), 20);
    return () => clearTimeout(timer);
  }, [values, activeField, charsPerTick]);

  useEffect(() => {
    onChangeRef.current?.(values);
  }, [values]);

  const start = () => setQueue(emptyFieldIds(fields, values));
  const edit = (id: string, text: string) => setValues((prev) => ({ ...prev, [id]: text }));
  const filling = queue.length > 0;
  const field = "w-full rounded-[10px] bg-subtle px-3 py-2 text-sm text-fg outline-none transition-shadow placeholder:text-fg-subtle focus:shadow-[0_0_0_2px_var(--select)]";

  return (
    <form onSubmit={(e) => e.preventDefault()} aria-label="Form" className={`grid w-full max-w-md gap-4 rounded-[18px] bg-surface p-5 shadow-[var(--shadow-card)] dark:bg-raised ${className}`}>
      {fields.map((f) => (
        <div key={f.id} className="grid gap-1.5">
          <label htmlFor={`fill-${f.id}`} className="flex items-center gap-1.5 text-xs font-medium text-fg-muted">
            {f.label}
            {active === f.id && <Sparkles size={12} aria-hidden className="text-select-text" />}
          </label>
          {f.multiline ? (
            <textarea id={`fill-${f.id}`} rows={3} value={values[f.id] ?? ""} placeholder={f.placeholder} onChange={(e) => edit(f.id, e.target.value)} className={`${field} resize-none ${active === f.id ? "shadow-[0_0_0_2px_var(--select)]" : ""}`} />
          ) : (
            <input id={`fill-${f.id}`} value={values[f.id] ?? ""} placeholder={f.placeholder} onChange={(e) => edit(f.id, e.target.value)} className={`${field} ${active === f.id ? "shadow-[0_0_0_2px_var(--select)]" : ""}`} />
          )}
        </div>
      ))}
      <div className="flex items-center justify-between gap-3">
        <p role="status" aria-live="polite" className="text-xs text-fg-subtle">{filling ? `Filling ${activeField?.label.toLowerCase()}…` : ""}</p>
        <button type="button" onClick={start} disabled={filling} className={`inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-[image:var(--grad-primary)] px-3.5 text-[13px] font-medium text-[var(--inverse-fg)] shadow-[var(--shadow-btn-primary)] disabled:opacity-60 ${ring}`}>
          <Sparkles size={14} aria-hidden /> Fill with AI
        </button>
      </div>
    </form>
  );
}
