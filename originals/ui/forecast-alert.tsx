"use client";

import { type ReactNode } from "react";
import { CircleCheck, TrendingUp, TriangleAlert, X } from "lucide-react";

/* Forecast alert: projects a billing period's usage linearly from the burn so far and says in words whether you will stay under the limit, cut it close or run out early, with a bar that marks used, projected and limit; forecastUsage is the exported math. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";
const DAY = 86_400_000;

export type ForecastStatus = "on-track" | "watch" | "over";

export interface Forecast {
  /** Usage expected by the end of the period at the current rate. */
  projected: number;
  /** When the limit is reached, or null if it is not reached this period. */
  exhaustsAt: number | null;
  status: ForecastStatus;
}

export interface ForecastInput {
  used: number;
  limit: number;
  /** Period bounds and the current time, in epoch milliseconds. */
  periodStart: number;
  periodEnd: number;
  now: number;
}

/** Linear projection: over when the limit is already hit or projected to be, watch from 85% of the limit, otherwise on track. */
export function forecastUsage({ used, limit, periodStart, periodEnd, now }: ForecastInput): Forecast {
  const total = Math.max(periodEnd - periodStart, 1);
  const elapsed = Math.min(Math.max(now - periodStart, 1), total);
  const rate = used / elapsed;
  const projected = rate * total;
  if (used >= limit) return { projected, exhaustsAt: now, status: "over" };
  if (projected > limit) return { projected, exhaustsAt: periodStart + limit / rate, status: "over" };
  return { projected, exhaustsAt: null, status: projected >= limit * 0.85 ? "watch" : "on-track" };
}

const dateLabel = (ms: number) => new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

/** One sentence describing the forecast for a screen reader or a banner. */
export function forecastMessage(forecast: Forecast, input: ForecastInput, format: (n: number) => string = String): string {
  const { projected, exhaustsAt, status } = forecast;
  if (status === "on-track") return `You are on track to use about ${format(Math.round(projected))} of ${format(input.limit)} this period.`;
  if (status === "watch") return `You are projected to use ${format(Math.round(projected))} of ${format(input.limit)}, close to your limit.`;
  if (input.used >= input.limit) return "You have reached your limit for this period.";
  const early = Math.max(1, Math.round((input.periodEnd - (exhaustsAt ?? input.periodEnd)) / DAY));
  return `At this rate you will reach your limit around ${dateLabel(exhaustsAt ?? input.periodEnd)}, ${early} day${early === 1 ? "" : "s"} before the period ends.`;
}

const TONE = {
  "on-track": { box: "bg-success-soft text-success-text", Icon: CircleCheck },
  watch: { box: "bg-warning-soft text-warning-text", Icon: TrendingUp },
  over: { box: "bg-danger-soft text-danger-text", Icon: TriangleAlert },
};

export interface ForecastAlertProps {
  used: number;
  limit: number;
  periodStart: number | Date;
  periodEnd: number | Date;
  /** Defaults to the current time; pass it for stable demos and tests. */
  now?: number | Date;
  title?: string;
  format?: (value: number) => string;
  /** Slot for an upgrade button. */
  action?: ReactNode;
  onDismiss?: () => void;
  /** Render nothing while the forecast is comfortably on track. */
  hideWhenSafe?: boolean;
  className?: string;
}

const ms = (d: number | Date) => (typeof d === "number" ? d : d.getTime());

export function ForecastAlert({ used, limit, periodStart, periodEnd, now, title = "Usage forecast", format, action, onDismiss, hideWhenSafe = false, className = "" }: ForecastAlertProps) {
  const input: ForecastInput = { used, limit, periodStart: ms(periodStart), periodEnd: ms(periodEnd), now: now === undefined ? Date.now() : ms(now) };
  const forecast = forecastUsage(input);
  if (hideWhenSafe && forecast.status === "on-track") return null;

  const { box, Icon } = TONE[forecast.status];
  const scale = Math.max(limit, forecast.projected, used) || 1;
  const pct = (n: number) => `${Math.min((n / scale) * 100, 100)}%`;
  return (
    <div role={forecast.status === "over" ? "alert" : "status"} className={`relative grid gap-3 rounded-[16px] p-4 ${box} ${className}`}>
      <div className="flex items-start gap-3">
        <Icon size={18} strokeWidth={2} aria-hidden className="mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1 pr-6">
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-0.5 text-sm leading-5">{forecastMessage(forecast, input, format)}</p>
        </div>
        {onDismiss && (
          <button type="button" aria-label="Dismiss forecast" onClick={onDismiss} className={`absolute right-3 top-3 grid size-7 place-items-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10 ${ring}`}>
            <X size={14} strokeWidth={2} aria-hidden />
          </button>
        )}
      </div>
      <div aria-hidden className="relative h-2 rounded-full bg-black/10 dark:bg-white/15">
        <div className="absolute inset-y-0 left-0 rounded-full bg-current opacity-30" style={{ width: pct(forecast.projected) }} />
        <div className="absolute inset-y-0 left-0 rounded-full bg-current" style={{ width: pct(used) }} />
        <div className="absolute -inset-y-1 w-0.5 rounded-full bg-fg" style={{ left: pct(limit) }} />
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
