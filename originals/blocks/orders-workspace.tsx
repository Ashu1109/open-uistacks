"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Badge, type BadgeTone } from "../../registry/ui/badge";
import { SegmentedControl } from "../ui/segmented-control";
import { OrderTracker, type TrackerStep } from "../ui/order-tracker";
import { OrderSummary, type OrderLine } from "../ui/order-summary";
import { computeTotals, formatMoney } from "../ui/cart-summary";

/* Orders workspace: a full-width list + detail section; filter orders by fulfilment status or search, select one to see its items, totals and a fulfilment tracker, and advance it one step at a time. Stacks to one column when its container is narrower than 768px. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface WorkspaceOrder {
  id: string;
  number: string;
  customer: string;
  email?: string;
  placedAt: string;
  /** 0 unfulfilled, 1 packed, 2 shipped, 3 delivered. */
  stage: number;
  lines: OrderLine[];
  /** Minor units. */
  shipping?: number;
  /** Fraction, 0.08 for 8%. */
  taxRate?: number;
}

export interface OrdersWorkspaceProps {
  orders?: WorkspaceOrder[];
  currency?: string;
  defaultSelectedId?: string;
  /** Called with the order id and the new stage when a person advances an order. */
  onAdvance?: (orderId: string, stage: number) => void;
  onSelect?: (orderId: string) => void;
  className?: string;
}

export const STAGE_STEPS: TrackerStep[] = [
  { id: "packed", label: "Packed" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
];
export const STAGE_LABELS = ["Unfulfilled", "Packed", "Shipped", "Delivered"] as const;
const STAGE_TONE: BadgeTone[] = ["warning", "accent", "accent", "success"];

export const DEMO_ORDERS: WorkspaceOrder[] = [
  { id: "o1", number: "#4821", customer: "Maya Okafor", email: "maya@example.com", placedAt: "Nov 17, 9:12 AM", stage: 0, shipping: 599, taxRate: 0.08, lines: [{ id: "l1", name: "Linen throw", variant: "Sand", unitPrice: 8900, quantity: 1 }, { id: "l2", name: "Ceramic mug", variant: "Set of 2", unitPrice: 3400, quantity: 2 }] },
  { id: "o2", number: "#4820", customer: "Luca Bianchi", email: "luca@example.com", placedAt: "Nov 17, 8:03 AM", stage: 1, shipping: 0, taxRate: 0.08, lines: [{ id: "l3", name: "Desk lamp", variant: "Matte black", unitPrice: 12900, quantity: 1 }] },
  { id: "o3", number: "#4817", customer: "Priya Nair", email: "priya@example.com", placedAt: "Nov 16, 4:48 PM", stage: 2, shipping: 799, taxRate: 0.08, lines: [{ id: "l4", name: "Walnut tray", unitPrice: 5400, quantity: 3 }, { id: "l5", name: "Beeswax candle", variant: "Cedar", unitPrice: 2200, quantity: 4 }] },
  { id: "o4", number: "#4809", customer: "Tomas Berg", email: "tomas@example.com", placedAt: "Nov 14, 11:20 AM", stage: 3, shipping: 599, taxRate: 0.08, lines: [{ id: "l6", name: "Wool blanket", variant: "Charcoal", unitPrice: 15900, quantity: 1 }] },
  { id: "o5", number: "#4806", customer: "Hana Sato", email: "hana@example.com", placedAt: "Nov 13, 2:05 PM", stage: 3, shipping: 0, taxRate: 0.08, lines: [{ id: "l7", name: "Ceramic mug", variant: "Single", unitPrice: 1900, quantity: 1 }] },
];

export function orderTotal(order: WorkspaceOrder): number {
  return computeTotals({ lines: order.lines, taxRate: order.taxRate, shipping: order.shipping }).total;
}

export function filterOrders(orders: WorkspaceOrder[], status: string, query: string): WorkspaceOrder[] {
  const q = query.trim().toLowerCase();
  return orders.filter((o) => (status === "all" || String(o.stage) === status) && (!q || `${o.number} ${o.customer}`.toLowerCase().includes(q)));
}

export function OrdersWorkspace({ orders: initial = DEMO_ORDERS, currency = "USD", defaultSelectedId, onAdvance, onSelect, className = "" }: OrdersWorkspaceProps) {
  const [orders, setOrders] = useState(initial);
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(defaultSelectedId ?? initial[0]?.id);
  const visible = useMemo(() => filterOrders(orders, status, query), [orders, status, query]);
  const selected = orders.find((o) => o.id === selectedId);

  const advance = (order: WorkspaceOrder) => {
    const stage = Math.min(order.stage + 1, STAGE_STEPS.length);
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, stage } : o)));
    onAdvance?.(order.id, stage);
  };
  const select = (id: string) => {
    setSelectedId(id);
    onSelect?.(id);
  };

  return (
    <section aria-label="Orders" className={`@container ${className}`}>
      <div className="grid gap-4 @[768px]:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="grid content-start gap-3 rounded-[20px] bg-surface p-4 shadow-[var(--shadow-card)] dark:bg-raised">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-fg">Orders</h3>
            <span className="text-xs tabular-nums text-fg-muted">{visible.length} of {orders.length}</span>
          </div>
          <label className="flex h-9 items-center gap-2 rounded-[14px] bg-subtle px-3 text-fg-muted focus-within:ring-2 focus-within:ring-[var(--select)]">
            <Search size={16} aria-hidden />
            <input value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search orders" placeholder="Search number or customer" className="min-w-0 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-fg-subtle" />
          </label>
          <SegmentedControl
            label="Filter by status"
            size="sm"
            value={status}
            onValueChange={setStatus}
            options={[{ value: "all", label: "All" }, { value: "0", label: "New" }, { value: "1", label: "Packed" }, { value: "2", label: "Shipped" }, { value: "3", label: "Done" }]}
          />
          {visible.length === 0 ? (
            <p role="status" className="py-8 text-center text-sm text-fg-muted">No orders match.</p>
          ) : (
            <ul aria-label="Order list" className="grid gap-1">
              {visible.map((o) => (
                <li key={o.id}>
                  <button type="button" aria-current={o.id === selectedId ? "true" : undefined} onClick={() => select(o.id)} className={`flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left hover:bg-[color-mix(in_srgb,var(--fg)_4%,var(--surface))] aria-[current=true]:bg-select-soft ${ring}`}>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-sm font-medium text-fg">{o.number}<span className="truncate font-normal text-fg-muted">{o.customer}</span></span>
                      <span className="text-xs text-fg-subtle">{o.placedAt}</span>
                    </span>
                    <span className="grid justify-items-end gap-1">
                      <span className="text-sm font-medium tabular-nums text-fg">{formatMoney(orderTotal(o), currency)}</span>
                      <Badge size="sm" tone={STAGE_TONE[o.stage]}>{STAGE_LABELS[o.stage]}</Badge>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="grid content-start gap-4 rounded-[20px] bg-surface p-4 shadow-[var(--shadow-card)] dark:bg-raised" aria-live="polite">
          {selected ? (
            <>
              <header className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-[15px] font-semibold text-fg">Order {selected.number}</h3>
                  <p className="text-[13px] text-fg-muted">{selected.customer}{selected.email ? ` · ${selected.email}` : ""} · {selected.placedAt}</p>
                </div>
                {selected.stage < STAGE_STEPS.length && (
                  <button type="button" onClick={() => advance(selected)} className={`h-9 rounded-full bg-[image:var(--grad-primary)] px-4 text-sm font-medium text-[var(--inverse-fg)] shadow-[var(--shadow-btn-primary)] ${ring}`}>
                    Mark as {STAGE_STEPS[selected.stage].label.toLowerCase()}
                  </button>
                )}
              </header>
              <div className="grid gap-4 @[1024px]:grid-cols-2">
                <OrderSummary title="Items" lines={selected.lines} currency={currency} taxRate={selected.taxRate} shipping={selected.shipping} />
                <div className="grid content-start gap-2">
                  <h4 className="text-sm font-medium text-fg">Fulfilment</h4>
                  <OrderTracker steps={STAGE_STEPS} current={selected.stage} />
                </div>
              </div>
            </>
          ) : (
            <p className="py-12 text-center text-sm text-fg-muted">Select an order to see its details.</p>
          )}
        </div>
      </div>
    </section>
  );
}
