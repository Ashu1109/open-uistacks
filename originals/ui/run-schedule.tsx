"use client";

import { useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "motion/react";
import { CalendarClock } from "lucide-react";

/* Run schedule: a plain-English summary of a five-field cron expression with the next few run times; unusual expressions fall back to the raw string. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}
const spring = { type: "spring", stiffness: 480, damping: 36 } as const;

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function parseField(field: string, min: number, max: number): number[] | null {
  const out = new Set<number>();
  for (const part of field.split(",")) {
    const [range, stepText] = part.split("/");
    const step = stepText === undefined ? 1 : Number(stepText);
    let lo: number;
    let hi: number;
    if (range === "*") [lo, hi] = [min, max];
    else if (/^\d+-\d+$/.test(range)) [lo, hi] = range.split("-").map(Number);
    else if (/^\d+$/.test(range)) [lo, hi] = stepText === undefined ? [Number(range), Number(range)] : [Number(range), max];
    else return null;
    if (!Number.isInteger(step) || step < 1 || lo < min || hi > max || lo > hi) return null;
    for (let v = lo; v <= hi; v += step) out.add(v);
  }
  return [...out].sort((a, b) => a - b);
}

interface ParsedCron {
  minutes: number[];
  hours: number[];
  days: number[];
  months: number[];
  weekdays: number[];
}

export function parseCron(expr: string): ParsedCron | null {
  const f = expr.trim().split(/\s+/);
  if (f.length !== 5) return null;
  const [minutes, hours, days, months, weekdays] = [parseField(f[0], 0, 59), parseField(f[1], 0, 23), parseField(f[2], 1, 31), parseField(f[3], 1, 12), parseField(f[4], 0, 6)];
  return minutes && hours && days && months && weekdays ? { minutes, hours, days, months, weekdays } : null;
}

const clock = (h: number, m: number) => `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

export function describeCron(expr: string): string {
  const f = expr.trim().split(/\s+/);
  if (!parseCron(expr)) return "Custom schedule";
  const [min, hour, dom, mon, dow] = f;
  const rest = dom === "*" && mon === "*";
  if (rest && dow === "*" && hour === "*") {
    if (min === "*") return "Every minute";
    if (min.startsWith("*/")) return `Every ${min.slice(2)} minutes`;
    if (/^\d+$/.test(min)) return `Every hour at :${min.padStart(2, "0")}`;
  }
  if (rest && /^\d+$/.test(min) && /^\d+$/.test(hour)) {
    const at = clock(Number(hour), Number(min));
    if (dow === "*") return `Every day at ${at}`;
    if (dow === "1-5") return `Weekdays at ${at}`;
    if (/^\d$/.test(dow)) return `Every ${DAYS[Number(dow)]} at ${at}`;
  }
  return "Custom schedule";
}

/** Next run times strictly after `from`, scanning minute by minute for up to a year. */
export function nextRuns(expr: string, from: Date, count = 3): Date[] {
  const p = parseCron(expr);
  if (!p) return [];
  const runs: Date[] = [];
  const t = new Date(from);
  t.setSeconds(0, 0);
  for (let i = 0; i < 527_040 && runs.length < count; i++) {
    t.setMinutes(t.getMinutes() + 1);
    const dayOk = p.days.includes(t.getDate()) && p.weekdays.includes(t.getDay());
    const domStar = expr.trim().split(/\s+/)[2] === "*";
    const dowStar = expr.trim().split(/\s+/)[4] === "*";
    const dayMatch = domStar || dowStar ? dayOk : p.days.includes(t.getDate()) || p.weekdays.includes(t.getDay());
    if (p.minutes.includes(t.getMinutes()) && p.hours.includes(t.getHours()) && p.months.includes(t.getMonth() + 1) && dayMatch) runs.push(new Date(t));
  }
  return runs;
}

const formatRun = (d: Date) => d.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });

export interface RunScheduleProps {
  cron: string;
  /** Reference time for "next runs"; defaults to now. */
  from?: Date;
  count?: number;
  className?: string;
}

export function RunSchedule({ cron, from, count = 3, className = "" }: RunScheduleProps) {
  const runs = nextRuns(cron, from ?? new Date(), count);
  const reduce = useReduce();
  return (
    <motion.section aria-label="Run schedule" initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={spring} className={`rounded-[16px] bg-surface p-4 shadow-[var(--shadow-card)] dark:bg-raised ${className}`}>
      <div className="flex items-center gap-2.5">
        <CalendarClock size={16} aria-hidden className="text-fg-subtle" />
        <motion.div key={cron} initial={reduce ? false : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <p className="text-sm font-medium text-fg">{describeCron(cron)}</p>
          <code className="text-xs text-fg-subtle">{cron}</code>
        </motion.div>
      </div>
      {runs.length > 0 ? (
        <ul className="mt-3 space-y-1 border-t border-track pt-3">
          <li className="text-[11px] font-medium uppercase tracking-wide text-fg-subtle">Next runs</li>
          {runs.map((r, i) => <motion.li key={r.getTime()} initial={reduce ? false : { opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ ...spring, delay: 0.1 + i * 0.06 }} className="text-[13px] tabular-nums text-fg-muted"><time dateTime={r.toISOString()}>{formatRun(r)}</time></motion.li>)}
        </ul>
      ) : (
        <p className="mt-3 border-t border-track pt-3 text-xs text-danger-text">This expression is not valid.</p>
      )}
    </motion.section>
  );
}
