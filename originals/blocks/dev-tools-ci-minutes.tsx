"use client";

import { Progress } from "../../registry/ui/progress";
import { CountUp } from "../ui/chart-utils";

/* Dev tools CI minutes: minutes used against the monthly quota with a month-end projection and the heaviest workflows. A card, 1/3 width of a 12-column grid (4 columns), responsive to its container. */

export interface WorkflowUsage {
  name: string;
  minutes: number;
}

export interface DevToolsCiMinutesProps {
  used?: number;
  quota?: number;
  /** Day of the month today is, 1-based. */
  day?: number;
  daysInMonth?: number;
  workflows?: WorkflowUsage[];
  className?: string;
}

const DEMO_WORKFLOWS: WorkflowUsage[] = [
  { name: "web-e2e", minutes: 4120 },
  { name: "build-and-test", minutes: 3380 },
  { name: "docker-images", minutes: 1760 },
  { name: "nightly-audit", minutes: 640 },
];

export function projectMonthEnd(used: number, day: number, daysInMonth: number): number {
  return day <= 0 ? used : Math.round((used / day) * daysInMonth);
}

export const formatMinutes = (n: number) => new Intl.NumberFormat("en-US").format(Math.round(n));

export function DevToolsCiMinutes({ used = 9900, quota = 15000, day = 17, daysInMonth = 30, workflows = DEMO_WORKFLOWS, className = "" }: DevToolsCiMinutesProps) {
  const projected = projectMonthEnd(used, day, daysInMonth);
  const over = projected > quota;
  const top = Math.max(...workflows.map((w) => w.minutes), 1);
  return (
    <section aria-label="CI minutes" className={`@container rounded-[20px] bg-surface p-4 shadow-[var(--shadow-card)] @[480px]:p-5 ${className}`}>
      <h2 className="text-[15px] font-semibold text-fg">CI minutes</h2>
      <p className="mt-2 text-[28px] font-semibold leading-8 tabular-nums text-fg">
        <CountUp text={formatMinutes(used)} />
        <span className="ml-1.5 text-[14px] font-normal text-fg-muted">of {formatMinutes(quota)}</span>
      </p>
      <Progress className="mt-3" value={used} max={quota} showValue={false} tone={used / quota > 0.85 ? "danger" : "accent"} aria-label="Minutes used this month" valueText={`${formatMinutes(used)} of ${formatMinutes(quota)} minutes`} />
      <p className={`mt-2 text-[13px] ${over ? "text-danger-text" : "text-fg-muted"}`}>
        {over ? `On pace for ${formatMinutes(projected)}, ${formatMinutes(projected - quota)} over quota` : `On pace for ${formatMinutes(projected)}, within quota`}
      </p>
      <ul className="mt-4 grid gap-2.5" aria-label="Minutes by workflow">
        {workflows.map((w) => (
          <li key={w.name} className="grid gap-1">
            <div className="flex justify-between text-[13px]">
              <span className="truncate font-medium text-fg">{w.name}</span>
              <span className="tabular-nums text-fg-muted">{formatMinutes(w.minutes)}</span>
            </div>
            <div aria-hidden className="h-1.5 overflow-hidden rounded-full bg-track">
              <div className="h-full rounded-full" style={{ width: `${(w.minutes / top) * 100}%`, background: "var(--series-1)" }} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
