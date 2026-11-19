"use client";

import { useId, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { currencyDigits, formatMoney, parseMinor } from "./balance-card";

/* Invoice editor: editable line items with quantity and unit price, a tax rate and live subtotal, tax and total computed in integer minor units. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface InvoiceLine {
  id: string;
  description: string;
  quantity: number;
  /** Minor units per unit. */
  unitPrice: number;
}

export interface InvoiceTotals {
  subtotal: number;
  tax: number;
  total: number;
}

export function lineTotal(line: Pick<InvoiceLine, "quantity" | "unitPrice">): number {
  return Math.round(Math.max(line.quantity, 0) * line.unitPrice);
}

export function invoiceTotals(lines: InvoiceLine[], taxPercent: number): InvoiceTotals {
  const subtotal = lines.reduce((sum, line) => sum + lineTotal(line), 0);
  const tax = Math.round((subtotal * Math.round(Math.max(taxPercent, 0) * 100)) / 10_000);
  return { subtotal, tax, total: subtotal + tax };
}

export interface InvoiceEditorProps {
  value?: InvoiceLine[];
  defaultValue?: InvoiceLine[];
  onValueChange?: (lines: InvoiceLine[]) => void;
  defaultTaxPercent?: number;
  onTotalsChange?: (totals: InvoiceTotals) => void;
  currency?: string;
  locale?: string;
  className?: string;
}

function PriceInput({ label, minor, digits, onChange }: { label: string; minor: number; digits: number; onChange: (minor: number) => void }) {
  const [text, setText] = useState((minor / 10 ** digits).toFixed(digits));
  return (
    <input
      aria-label={label}
      inputMode="decimal"
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        onChange(parseMinor(e.target.value, digits) ?? 0);
      }}
      onBlur={() => setText((minor / 10 ** digits).toFixed(digits))}
      className={`h-9 w-full rounded-[10px] bg-subtle px-2 text-right text-sm tabular-nums text-fg ${ring}`}
    />
  );
}

export function InvoiceEditor({ value, defaultValue = [], onValueChange, defaultTaxPercent = 0, onTotalsChange, currency = "USD", locale = "en-US", className = "" }: InvoiceEditorProps) {
  const uid = useId();
  const counter = useRef(0);
  const [inner, setInner] = useState(defaultValue);
  const [taxText, setTaxText] = useState(String(defaultTaxPercent));
  const lines = value ?? inner;
  const taxPercent = Number(taxText) || 0;
  const digits = currencyDigits(currency, locale);
  const totals = invoiceTotals(lines, taxPercent);

  const commit = (next: InvoiceLine[], nextTax = taxPercent) => {
    setInner(next);
    onValueChange?.(next);
    onTotalsChange?.(invoiceTotals(next, nextTax));
  };
  const patch = (id: string, change: Partial<InvoiceLine>) => commit(lines.map((l) => (l.id === id ? { ...l, ...change } : l)));
  const add = () => commit([...lines, { id: `${uid}-new-${counter.current++}`, description: "", quantity: 1, unitPrice: 0 }]);
  const money = (n: number) => formatMoney(n, currency, locale);

  return (
    <div className={`w-full max-w-2xl rounded-[20px] bg-surface p-5 shadow-[var(--shadow-card)] ${className}`}>
      <div className="hidden grid-cols-[1fr_72px_112px_96px_32px] gap-2 px-1 pb-2 text-xs font-medium text-fg-subtle sm:grid">
        <span>Description</span><span className="text-right">Qty</span><span className="text-right">Unit price</span><span className="text-right">Amount</span><span />
      </div>
      <ul className="grid gap-2">
        {lines.map((line, i) => (
          <li key={line.id} className="grid grid-cols-[1fr_72px] items-center gap-2 sm:grid-cols-[1fr_72px_112px_96px_32px]">
            <input aria-label={`Description, line ${i + 1}`} value={line.description} placeholder="Item description" onChange={(e) => patch(line.id, { description: e.target.value })} className={`h-9 rounded-[10px] bg-subtle px-3 text-sm text-fg placeholder:text-fg-subtle ${ring}`} />
            <input aria-label={`Quantity, line ${i + 1}`} type="number" min={0} step="any" value={line.quantity} onChange={(e) => patch(line.id, { quantity: Number(e.target.value) || 0 })} className={`h-9 rounded-[10px] bg-subtle px-2 text-right text-sm tabular-nums text-fg ${ring}`} />
            <PriceInput label={`Unit price, line ${i + 1}`} minor={line.unitPrice} digits={digits} onChange={(unitPrice) => patch(line.id, { unitPrice })} />
            <output aria-label={`Amount, line ${i + 1}`} className="text-right text-sm tabular-nums text-fg">{money(lineTotal(line))}</output>
            <button type="button" aria-label={`Remove line ${i + 1}`} onClick={() => commit(lines.filter((l) => l.id !== line.id))} className={`grid size-8 place-items-center rounded-full text-fg-subtle hover:bg-subtle hover:text-danger-text ${ring}`}>
              <Trash2 size={15} aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={add} className={`mt-3 inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm text-select-text transition-colors hover:bg-select-soft ${ring}`}>
        <Plus size={15} aria-hidden /> Add line
      </button>
      <dl className="mt-4 grid gap-1.5 border-t border-track pt-4 text-sm tabular-nums" aria-live="polite">
        <div className="flex justify-between"><dt className="text-fg-muted">Subtotal</dt><dd className="text-fg">{money(totals.subtotal)}</dd></div>
        <div className="flex items-center justify-between">
          <dt className="flex items-center gap-2 text-fg-muted">
            <label htmlFor={`${uid}-tax`}>Tax</label>
            <input id={`${uid}-tax`} type="number" min={0} max={100} step="0.5" value={taxText} onChange={(e) => { setTaxText(e.target.value); onTotalsChange?.(invoiceTotals(lines, Number(e.target.value) || 0)); }} className={`h-7 w-16 rounded-[8px] bg-subtle px-2 text-right text-xs text-fg ${ring}`} />
            <span aria-hidden>%</span>
          </dt>
          <dd className="text-fg">{money(totals.tax)}</dd>
        </div>
        <div className="flex justify-between text-base font-semibold"><dt className="text-fg">Total</dt><dd className="text-fg">{money(totals.total)}</dd></div>
      </dl>
    </div>
  );
}
