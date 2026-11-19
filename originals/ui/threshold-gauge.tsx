"use client";

import { CountUp, arcPath, formatNumber, polar } from "./chart-utils";

/* Threshold gauge: a half-circle dial split into success, warning and danger zones with a needle at the current value and a large readout; exposed as a meter. */

export type GaugeTone = "success" | "warning" | "danger";

export interface GaugeZone {
  /** Upper edge of the zone, on the gauge's own scale. */
  to: number;
  tone: GaugeTone;
}

export interface ThresholdGaugeProps {
  value: number;
  min?: number;
  max?: number;
  zones?: GaugeZone[];
  label: string;
  unit?: string;
  format?: (n: number) => string;
  className?: string;
}

const DEFAULT_ZONES: GaugeZone[] = [{ to: 60, tone: "success" }, { to: 85, tone: "warning" }, { to: 100, tone: "danger" }];
const TONE_COLOR: Record<GaugeTone, string> = { success: "var(--success)", warning: "var(--warning)", danger: "var(--danger)" };
const TONE_TEXT: Record<GaugeTone, string> = { success: "text-success-text", warning: "text-warning-text", danger: "text-danger-text" };
const TONE_NAME: Record<GaugeTone, string> = { success: "healthy", warning: "warning", danger: "critical" };

export function zoneFor(value: number, zones: GaugeZone[]): GaugeZone {
  return zones.find((z) => value <= z.to) ?? zones[zones.length - 1];
}

export const gaugeAngle = (value: number, min: number, max: number) => -90 + Math.min(Math.max((value - min) / (max - min || 1), 0), 1) * 180;

const CX = 110;
const CY = 105;
const R = 86;
const STROKE = 14;

export function ThresholdGauge({ value, min = 0, max = 100, zones = DEFAULT_ZONES, label, unit = "", format = formatNumber, className = "" }: ThresholdGaugeProps) {
  const zone = zoneFor(value, zones);
  const angle = gaugeAngle(value, min, max);
  const tip = polar(CX, CY, R - 14, 0);
  const text = `${format(value)}${unit}`;

  return (
    <div role="meter" aria-label={label} aria-valuemin={min} aria-valuemax={max} aria-valuenow={Math.min(Math.max(value, min), max)} aria-valuetext={`${text}, ${TONE_NAME[zone.tone]}`} className={`inline-flex w-full max-w-[220px] flex-col items-center ${className}`}>
      <svg viewBox="0 0 220 128" aria-hidden className="block h-auto w-full">
        <path d={arcPath(CX, CY, R, -90, 90)} fill="none" stroke="var(--track)" strokeWidth={STROKE} />
        {zones.map((z, i) => {
          const from = i === 0 ? min : zones[i - 1].to;
          return <path key={i} d={arcPath(CX, CY, R, gaugeAngle(from, min, max) + (i === 0 ? 0 : 1), gaugeAngle(z.to, min, max) - (i === zones.length - 1 ? 0 : 1))} fill="none" stroke={TONE_COLOR[z.tone]} strokeWidth={STROKE} opacity={zone === z ? 1 : 0.35} />;
        })}
        <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: `${CX}px ${CY}px` }} className="transition-transform duration-700 ease-out motion-reduce:transition-none">
          <line x1={CX} y1={CY} x2={tip.x} y2={tip.y} stroke="var(--fg)" strokeWidth={3} strokeLinecap="round" />
        </g>
        <circle cx={CX} cy={CY} r={6} fill="var(--fg)" />
        <circle cx={CX} cy={CY} r={2.5} fill="var(--surface)" />
        <text x={14} y={124} fontSize={10} fill="var(--fg-subtle)">{format(min)}</text>
        <text x={206} y={124} fontSize={10} fill="var(--fg-subtle)" textAnchor="end">{format(max)}</text>
      </svg>
      <div className="-mt-2 text-center">
        <div className={`text-2xl font-semibold tabular-nums ${TONE_TEXT[zone.tone]}`}><CountUp text={text} /></div>
        <div className="text-xs text-fg-muted">{label}</div>
      </div>
    </div>
  );
}
