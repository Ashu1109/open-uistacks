"use client";

import { useState } from "react";
import { AlertTriangle, Truck } from "lucide-react";
import { Badge } from "../../registry/ui/badge";
import { OrderTracker, type TrackerStep } from "../ui/order-tracker";

/* Shipment tracking: a full-width or 1/2-width section listing shipments with carrier, ETA and an exceptions filter; the selected shipment shows its carrier scan steps and any delivery exception with an action. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface Shipment {
  id: string;
  orderNumber: string;
  carrier: string;
  trackingNumber: string;
  /** Display text such as "Nov 19". */
  eta: string;
  steps: TrackerStep[];
  /** Index of the step in progress; steps.length means delivered. */
  current: number;
  /** A problem with the delivery, such as "Address needs confirmation". */
  exception?: string;
}

export interface ShipmentTrackingProps {
  shipments?: Shipment[];
  defaultSelectedId?: string;
  /** Called when someone acts on a shipment's exception. */
  onResolve?: (shipment: Shipment) => void;
  className?: string;
}

const scans = (names: string[]): TrackerStep[] => names.map((label) => ({ id: label.toLowerCase().replace(/\s+/g, "-"), label }));
const STEPS = ["Label created", "Picked up", "In transit", "Out for delivery", "Delivered"];

export const DEMO_SHIPMENTS: Shipment[] = [
  { id: "s1", orderNumber: "#4817", carrier: "Northwind Freight", trackingNumber: "NW 4821 9930", eta: "Nov 19", current: 2, steps: scans(STEPS).map((s, i) => (i < 3 ? { ...s, at: `Nov ${15 + i}, ${9 + i}:30 AM` } : s)) },
  { id: "s2", orderNumber: "#4812", carrier: "Parcelo", trackingNumber: "PC 7710 2284", eta: "Nov 18", current: 3, steps: scans(STEPS).map((s, i) => (i < 4 ? { ...s, at: `Nov ${14 + i}, ${8 + i}:10 AM` } : s)) },
  { id: "s3", orderNumber: "#4808", carrier: "Northwind Freight", trackingNumber: "NW 4790 1127", eta: "Delayed", current: 2, exception: "Address needs confirmation", steps: scans(STEPS).map((s, i) => (i < 2 ? { ...s, at: `Nov ${13 + i}, 10:00 AM` } : i === 2 ? { ...s, detail: "Held at Denver hub" } : s)) },
  { id: "s4", orderNumber: "#4801", carrier: "Parcelo", trackingNumber: "PC 7698 0041", eta: "Delivered", current: 5, steps: scans(STEPS) },
];

export function exceptionCount(shipments: Shipment[]): number {
  return shipments.filter((s) => s.exception).length;
}

export function ShipmentTracking({ shipments = DEMO_SHIPMENTS, defaultSelectedId, onResolve, className = "" }: ShipmentTrackingProps) {
  const [onlyExceptions, setOnlyExceptions] = useState(false);
  const [selectedId, setSelectedId] = useState(defaultSelectedId ?? shipments[0]?.id);
  const visible = onlyExceptions ? shipments.filter((s) => s.exception) : shipments;
  const selected = shipments.find((s) => s.id === selectedId);
  const problems = exceptionCount(shipments);
  return (
    <section aria-label="Shipment tracking" className={`@container grid gap-4 rounded-[20px] bg-surface p-4 shadow-[var(--shadow-card)] dark:bg-raised ${className}`}>
      <header className="flex items-center justify-between gap-3">
        <h3 className="text-[15px] font-semibold text-fg">Shipments</h3>
        <button type="button" aria-pressed={onlyExceptions} onClick={() => setOnlyExceptions((v) => !v)} className={`flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium aria-pressed:bg-warning-soft aria-pressed:text-warning-text bg-subtle text-fg-muted ${ring}`}>
          <AlertTriangle size={14} aria-hidden />
          Exceptions <span className="tabular-nums">{problems}</span>
        </button>
      </header>
      <div className="grid gap-4 @[640px]:grid-cols-2">
        <ul aria-label="Shipment list" className="grid content-start gap-1">
          {visible.length === 0 && <li role="status" className="py-6 text-center text-sm text-fg-muted">No exceptions.</li>}
          {visible.map((s) => (
            <li key={s.id}>
              <button type="button" aria-current={s.id === selectedId ? "true" : undefined} onClick={() => setSelectedId(s.id)} className={`flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left hover:bg-[color-mix(in_srgb,var(--fg)_4%,var(--surface))] aria-[current=true]:bg-select-soft ${ring}`}>
                <Truck size={16} className="shrink-0 text-fg-muted" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-fg">{s.orderNumber} · {s.carrier}</span>
                  <span className="block text-xs text-fg-subtle">{s.trackingNumber}</span>
                </span>
                {s.exception ? <Badge size="sm" tone="warning">Exception</Badge> : <span className="text-xs tabular-nums text-fg-muted">{s.current >= s.steps.length ? "Delivered" : `ETA ${s.eta}`}</span>}
              </button>
            </li>
          ))}
        </ul>
        <div className="grid content-start gap-3" aria-live="polite">
          {selected ? (
            <>
              <div>
                <h4 className="text-sm font-medium text-fg">{selected.carrier}</h4>
                <p className="text-xs text-fg-muted">{selected.trackingNumber} · {selected.current >= selected.steps.length ? "Delivered" : `ETA ${selected.eta}`}</p>
              </div>
              {selected.exception && (
                <div role="alert" className="flex items-center gap-3 rounded-[14px] bg-warning-soft p-3 text-warning-text">
                  <AlertTriangle size={16} className="shrink-0" aria-hidden />
                  <p className="flex-1 text-[13px] font-medium">{selected.exception}</p>
                  <button type="button" onClick={() => onResolve?.(selected)} className={`h-8 rounded-full bg-surface px-3 text-[13px] font-medium text-fg shadow-[var(--shadow-card)] ${ring}`}>Resolve</button>
                </div>
              )}
              <OrderTracker steps={selected.steps} current={selected.current} />
            </>
          ) : (
            <p className="py-8 text-center text-sm text-fg-muted">Select a shipment.</p>
          )}
        </div>
      </div>
    </section>
  );
}
