"use client";

import { CalendarClock } from "lucide-react";
import { UptimeBars, uptimePercent, type UptimeDay, type UptimeStatus } from "../ui/uptime-bars";

/* Devops uptime history: 90-day uptime bars per service with each service's overall percentage. A full-width section, or 1/2 width. */

export interface ServiceUptime {
  name: string;
  days: UptimeDay[];
}

export interface DevopsUptimeHistoryProps {
  services?: ServiceUptime[];
  className?: string;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Build `count` days ending at `end`, with the given day offsets (0 = today) marked degraded or down. */
export function buildDays(count: number, end: Date, marks: Record<number, UptimeStatus> = {}): UptimeDay[] {
  return Array.from({ length: count }, (_, i) => {
    const ago = count - 1 - i;
    const d = new Date(end.getFullYear(), end.getMonth(), end.getDate() - ago);
    return { date: `${MONTHS[d.getMonth()]} ${d.getDate()}`, status: marks[ago] ?? "up" };
  });
}

/** Lowest overall uptime among the services, or null when none have data. */
export function worstUptime(services: ServiceUptime[]): number | null {
  const all = services.map((s) => uptimePercent(s.days)).filter((n): n is number => n !== null);
  return all.length ? Math.min(...all) : null;
}

const END = new Date(2026, 10, 18);
const DEMO: ServiceUptime[] = [
  { name: "API gateway", days: buildDays(90, END, { 4: "degraded", 33: "degraded", 61: "down" }) },
  { name: "Payments API", days: buildDays(90, END, { 0: "down", 2: "degraded", 19: "degraded", 47: "degraded", 48: "degraded", 70: "down" }) },
  { name: "Search", days: buildDays(90, END, { 1: "degraded", 12: "degraded", 55: "degraded" }) },
  { name: "Media workers", days: buildDays(90, END, { 8: "degraded", 9: "degraded", 28: "down", 66: "degraded" }) },
];

export function DevopsUptimeHistory({ services = DEMO, className = "" }: DevopsUptimeHistoryProps) {
  const worst = worstUptime(services);
  return (
    <section aria-labelledby="devops-uptime-title" className={`@container rounded-[20px] bg-surface p-5 shadow-[var(--shadow-card)] ${className}`}>
      <header className="mb-4 flex items-center justify-between gap-3">
        <h3 id="devops-uptime-title" className="flex items-center gap-2 text-[15px] font-semibold text-fg"><CalendarClock className="size-4 text-fg-muted" aria-hidden /> Uptime, last 90 days</h3>
        {worst !== null && <span className="text-xs tabular-nums text-fg-muted">Lowest {worst.toFixed(2)}%</span>}
      </header>
      <div className="grid gap-5 @[900px]:grid-cols-2">
        {services.map((s) => <UptimeBars key={s.name} name={s.name} days={s.days} />)}
      </div>
    </section>
  );
}
