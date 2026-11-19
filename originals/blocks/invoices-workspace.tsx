"use client";

import { useState } from "react";
import { Send, CircleCheck } from "lucide-react";
import { Badge, type BadgeTone } from "../../registry/ui/badge";
import { SegmentedControl } from "../ui/segmented-control";
import { computeTotals, formatMoney, TotalsList, type MoneyLine } from "../ui/cart-summary";

/* Invoices workspace: a full-width list-and-detail section; filter invoices by status, select one to read its line items and totals, and send or mark it paid through callbacks. Stacks the detail under the list below 900px of container width. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export type InvoiceStatus = "draft" | "sent" | "overdue" | "paid";

export interface InvoiceLine extends MoneyLine {
  description: string;
}

export interface Invoice {
  id: string;
  number: string;
  customer: string;
  /** ISO date. */
  issued: string;
  /** ISO date. */
  due: string;
  status: InvoiceStatus;
  lines: InvoiceLine[];
  /** Fraction, 0.08 for 8%. */
  taxRate?: number;
}

const FILTERS = ["all", "draft", "sent", "overdue", "paid"] as const;
export type InvoiceFilter = (typeof FILTERS)[number];

const TONE: Record<InvoiceStatus, BadgeTone> = { draft: "neutral", sent: "accent", overdue: "danger", paid: "success" };

export const invoiceTotal = (invoice: Invoice) => computeTotals({ lines: invoice.lines, taxRate: invoice.taxRate }).total;

export function filterInvoices(invoices: Invoice[], filter: InvoiceFilter): Invoice[] {
  return filter === "all" ? invoices : invoices.filter((i) => i.status === filter);
}

/** Sum of invoices still owed: sent plus overdue, in minor units. */
export const outstanding = (invoices: Invoice[]) => invoices.filter((i) => i.status === "sent" || i.status === "overdue").reduce((s, i) => s + invoiceTotal(i), 0);

const date = (iso: string, locale: string) => new Date(`${iso}T00:00:00`).toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" });

const DEMO: Invoice[] = [
  { id: "i1", number: "INV-1042", customer: "Harbor & Pine Studio", issued: "2026-10-28", due: "2026-11-27", status: "sent", taxRate: 0.08, lines: [{ description: "Brand identity sprint", unitPrice: 240000, quantity: 1 }, { description: "Revision rounds", unitPrice: 18000, quantity: 3 }] },
  { id: "i2", number: "INV-1041", customer: "Marlow Cycles", issued: "2026-10-02", due: "2026-11-01", status: "overdue", taxRate: 0.08, lines: [{ description: "Monthly bookkeeping", unitPrice: 45000, quantity: 1 }, { description: "Sales tax filing", unitPrice: 12000, quantity: 1 }] },
  { id: "i3", number: "INV-1040", customer: "Quill Print Co.", issued: "2026-09-30", due: "2026-10-30", status: "paid", taxRate: 0.08, lines: [{ description: "Poster run, 250 units", unitPrice: 640, quantity: 250 }] },
  { id: "i4", number: "INV-1043", customer: "Northfield Dental", issued: "2026-11-12", due: "2026-12-12", status: "draft", lines: [{ description: "Website maintenance", unitPrice: 32000, quantity: 1 }] },
  { id: "i5", number: "INV-1039", customer: "Juniper Bakehouse", issued: "2026-09-14", due: "2026-10-14", status: "paid", taxRate: 0.08, lines: [{ description: "Menu photography", unitPrice: 85000, quantity: 1 }] },
];

export interface InvoicesWorkspaceProps {
  invoices?: Invoice[];
  currency?: string;
  locale?: string;
  /** Called with the invoice when Send is pressed on a draft. */
  onSend?: (invoice: Invoice) => void;
  /** Called with the invoice when Mark paid is pressed on a sent or overdue invoice. */
  onMarkPaid?: (invoice: Invoice) => void;
  className?: string;
}

export function InvoicesWorkspace({ invoices = DEMO, currency = "USD", locale = "en-US", onSend, onMarkPaid, className = "" }: InvoicesWorkspaceProps) {
  const [filter, setFilter] = useState<InvoiceFilter>("all");
  const [selectedId, setSelectedId] = useState<string>();
  const visible = filterInvoices(invoices, filter);
  const selected = visible.find((i) => i.id === selectedId) ?? visible[0];
  const owed = outstanding(invoices);

  return (
    <section aria-label="Invoices" className={`@container rounded-[20px] bg-surface p-4 shadow-[var(--shadow-card)] @[640px]:p-5 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-fg">Invoices</h2>
          <p className="text-[13px] text-fg-muted">Outstanding <span className="font-medium tabular-nums text-fg">{formatMoney(owed, currency, locale)}</span></p>
        </div>
        <SegmentedControl label="Filter invoices by status" size="sm" value={filter} onValueChange={(v) => setFilter(v as InvoiceFilter)} options={FILTERS.map((f) => ({ value: f, label: f[0].toUpperCase() + f.slice(1) }))} />
      </div>
      <div className="mt-4 grid gap-4 @[900px]:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <ul aria-label="Invoice list" className="grid content-start gap-1">
          {visible.length === 0 && <li className="rounded-[14px] bg-subtle px-4 py-8 text-center text-sm text-fg-muted">No {filter} invoices</li>}
          {visible.map((i) => (
            <li key={i.id}>
              <button type="button" aria-pressed={selected?.id === i.id} onClick={() => setSelectedId(i.id)} className={`flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left hover:bg-[color-mix(in_srgb,var(--fg)_4%,var(--surface))] aria-pressed:bg-select-soft ${ring}`}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-fg">{i.customer}</span>
                  <span className="block text-xs text-fg-muted">{i.number} · due {date(i.due, locale)}</span>
                </span>
                <span className="grid justify-items-end gap-1">
                  <span className="text-sm font-medium tabular-nums text-fg">{formatMoney(invoiceTotal(i), currency, locale)}</span>
                  <Badge tone={TONE[i.status]} size="sm">{i.status}</Badge>
                </span>
              </button>
            </li>
          ))}
        </ul>
        {selected && (
          <article aria-label={`Invoice ${selected.number}`} className="rounded-[16px] bg-subtle/60 p-4 @[640px]:p-5">
            <header className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-fg">{selected.number}</h3>
                <p className="text-[13px] text-fg-muted">{selected.customer}</p>
                <p className="text-xs text-fg-subtle">Issued {date(selected.issued, locale)} · Due {date(selected.due, locale)}</p>
              </div>
              <Badge tone={TONE[selected.status]}>{selected.status}</Badge>
            </header>
            <table className="mt-4 w-full text-sm">
              <caption className="sr-only">Line items</caption>
              <thead className="text-left text-xs text-fg-subtle"><tr><th className="pb-2 font-normal">Item</th><th className="pb-2 text-right font-normal">Qty</th><th className="pb-2 text-right font-normal">Amount</th></tr></thead>
              <tbody>
                {selected.lines.map((l) => (
                  <tr key={l.description} className="border-t border-track"><td className="py-2 text-fg">{l.description}</td><td className="py-2 text-right tabular-nums text-fg-muted">{l.quantity}</td><td className="py-2 text-right tabular-nums text-fg">{formatMoney(l.unitPrice * l.quantity, currency, locale)}</td></tr>
                ))}
              </tbody>
            </table>
            <TotalsList className="mt-4" currency={currency} totals={computeTotals({ lines: selected.lines, taxRate: selected.taxRate })} />
            <div className="mt-4 flex gap-2">
              {selected.status === "draft" && <button type="button" onClick={() => onSend?.(selected)} className={`inline-flex items-center gap-1.5 rounded-full bg-[image:var(--grad-primary)] px-4 py-2 text-sm font-medium text-[var(--inverse-fg)] shadow-[var(--shadow-btn-primary)] ${ring}`}><Send size={14} aria-hidden />Send invoice</button>}
              {(selected.status === "sent" || selected.status === "overdue") && <button type="button" onClick={() => onMarkPaid?.(selected)} className={`inline-flex items-center gap-1.5 rounded-full bg-[image:var(--grad-primary)] px-4 py-2 text-sm font-medium text-[var(--inverse-fg)] shadow-[var(--shadow-btn-primary)] ${ring}`}><CircleCheck size={14} aria-hidden />Mark paid</button>}
            </div>
          </article>
        )}
      </div>
    </section>
  );
}
