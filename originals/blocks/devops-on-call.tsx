"use client";

import { BellRing } from "lucide-react";
import { Avatar } from "../../registry/ui/avatar";
import { Button } from "../../registry/ui/button";

/* Devops on-call: who is on call right now for each rotation, with when the shift ends and who is next. A card, 1/3 or 1/2 width. */

export interface Rotation {
  id: string;
  team: string;
  current: string;
  next: string;
  /** Minutes until the current shift ends. */
  endsInMinutes: number;
}

export interface DevopsOnCallProps {
  rotations?: Rotation[];
  /** Called with the rotation to page its current engineer. */
  onPage?: (rotation: Rotation) => void;
  className?: string;
}

export function formatShiftEnd(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
}

const DEMO: Rotation[] = [
  { id: "platform", team: "Platform primary", current: "Priya Nair", next: "Tomas Berg", endsInMinutes: 190 },
  { id: "data", team: "Data pipeline", current: "Wen Zhao", next: "Amara Okafor", endsInMinutes: 1560 },
  { id: "payments", team: "Payments", current: "Luis Ortega", next: "Priya Nair", endsInMinutes: 45 },
];

export function DevopsOnCall({ rotations = DEMO, onPage, className = "" }: DevopsOnCallProps) {
  return (
    <section aria-labelledby="devops-oncall-title" className={`@container rounded-[20px] bg-surface p-5 shadow-[var(--shadow-card)] ${className}`}>
      <h3 id="devops-oncall-title" className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-fg"><BellRing className="size-4 text-fg-muted" aria-hidden /> On call</h3>
      <ul className="m-0 grid list-none gap-3 p-0">
        {rotations.map((r) => (
          <li key={r.id} className="flex items-center gap-3">
            <Avatar name={r.current} size="md" status="online" />
            <div className="min-w-0 flex-1">
              <p className="m-0 truncate text-[14px] font-medium text-fg">{r.current}</p>
              <p className="m-0 truncate text-xs text-fg-muted">{r.team} · ends in {formatShiftEnd(r.endsInMinutes)}</p>
              <p className="m-0 truncate text-xs text-fg-subtle">Next: {r.next}</p>
            </div>
            <Button size="xs" variant="outline" aria-label={`Page ${r.current}`} onClick={() => onPage?.(r)}>Page</Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
