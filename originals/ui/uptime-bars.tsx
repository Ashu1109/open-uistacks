"use client";

import { ChartTip, Live, focusRing, useActiveIndex } from "./chart-utils";

/* Uptime bars: one thin bar per day coloured by service status, with an overall uptime figure; hover or arrow keys read any day. */

export type UptimeStatus = "up" | "degraded" | "down" | "none";

export interface UptimeDay {
  /** Any display date, e.g. "Mar 4". */
  date: string;
  status: UptimeStatus;
  /** Uptime that day, 0 to 100; defaults from the status. */
  uptime?: number;
  note?: string;
}

export interface UptimeBarsProps {
  days: UptimeDay[];
  name?: string;
  label?: string;
  className?: string;
}

const STATUS_COLOR: Record<UptimeStatus, string> = { up: "var(--success)", degraded: "var(--warning)", down: "var(--danger)", none: "var(--track)" };
const STATUS_TEXT: Record<UptimeStatus, string> = { up: "Operational", degraded: "Degraded", down: "Outage", none: "No data" };
const DEFAULT_UPTIME = { up: 100, degraded: 99, down: 0, none: 0 } as const;

export const dayUptime = (d: UptimeDay) => d.uptime ?? DEFAULT_UPTIME[d.status];

/** Mean uptime over days that have data, as a percentage; null when none do. */
export function uptimePercent(days: UptimeDay[]): number | null {
  const counted = days.filter((d) => d.status !== "none");
  return counted.length === 0 ? null : counted.reduce((s, d) => s + dayUptime(d), 0) / counted.length;
}

export function UptimeBars({ days, name = "Service", label, className = "" }: UptimeBarsProps) {
  const { active, setActive, focusProps } = useActiveIndex(days.length);
  const overall = uptimePercent(days);
  const overallText = overall === null ? "no data" : `${overall.toFixed(2)}% uptime`;
  const d = active === null ? null : days[active];
  const describe = (day: UptimeDay) => `${day.date}: ${STATUS_TEXT[day.status]}${day.status === "none" ? "" : `, ${dayUptime(day).toFixed(2)}% uptime`}${day.note ? `. ${day.note}` : ""}`;

  return (
    <figure className={`m-0 ${className}`}>
      <div className="mb-2 flex items-baseline justify-between text-[13px]">
        <span className="font-medium text-fg">{name}</span>
        <span className="tabular-nums text-fg-muted">{overall === null ? "No data" : `${overall.toFixed(2)}%`}</span>
      </div>
      <div className="relative">
        <div
          role="img"
          aria-label={label ?? `${name}, last ${days.length} days: ${overallText}.`}
          className={`flex h-9 items-stretch gap-[2px] rounded-[6px] ${focusRing}`}
          onPointerLeave={() => setActive(null)}
          {...focusProps}
        >
          {days.map((day, i) => (
            <div key={`${day.date}-${i}`} onPointerEnter={() => setActive(i)} className="min-w-0 flex-1 rounded-[3px] transition-opacity" style={{ background: STATUS_COLOR[day.status], opacity: active === null || active === i ? 1 : 0.5 }} />
          ))}
        </div>
        {d && active !== null && (
          <ChartTip x={active + 0.5} y={-0.4} w={days.length} h={1}>
            <div className="text-fg-muted">{d.date}</div>
            <div className="font-medium">{STATUS_TEXT[d.status]}{d.status !== "none" && <span className="ml-2 tabular-nums font-normal text-fg-muted">{dayUptime(d).toFixed(2)}%</span>}</div>
            {d.note && <div className="text-fg-muted">{d.note}</div>}
          </ChartTip>
        )}
      </div>
      <div className="mt-1.5 flex justify-between text-xs text-fg-subtle"><span>{days[0]?.date}</span><span>{days[days.length - 1]?.date}</span></div>
      <Live>{d ? describe(d) : ""}</Live>
    </figure>
  );
}
