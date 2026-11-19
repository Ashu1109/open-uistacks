"use client";

import { CountUp } from "./chart-utils";

/* Cost estimate: a before-you-run price breakdown from token counts, per-million prices and run count, with an optional budget bar that turns amber then red. */

export interface TokenPrices {
  /** USD per million input tokens. */
  input: number;
  /** USD per million output tokens. */
  output: number;
}

export interface CostEstimateProps {
  model: string;
  inputTokens: number;
  outputTokens: number;
  prices: TokenPrices;
  /** How many times the task will run. */
  runs?: number;
  /** USD ceiling; shows a usage bar when set. */
  budget?: number;
  className?: string;
}

export interface CostBreakdown {
  input: number;
  output: number;
  total: number;
}

export function estimateCost(inputTokens: number, outputTokens: number, prices: TokenPrices, runs = 1): CostBreakdown {
  const input = (Math.max(inputTokens, 0) / 1_000_000) * prices.input * runs;
  const output = (Math.max(outputTokens, 0) / 1_000_000) * prices.output * runs;
  return { input, output, total: input + output };
}

/** $0.0042 below a cent, $0.42 below ten dollars, $12.40 above. */
export function formatUsd(n: number): string {
  if (n === 0) return "$0.00";
  if (n < 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(2)}`;
}

const compact = (n: number) => new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);

export function CostEstimate({ model, inputTokens, outputTokens, prices, runs = 1, budget, className = "" }: CostEstimateProps) {
  const cost = estimateCost(inputTokens, outputTokens, prices, runs);
  const ratio = budget && budget > 0 ? cost.total / budget : 0;
  const tone = ratio >= 1 ? "var(--danger)" : ratio >= 0.7 ? "var(--warning)" : "var(--select)";
  const rows = [
    { label: "Input", tokens: inputTokens * runs, cost: cost.input },
    { label: "Output", tokens: outputTokens * runs, cost: cost.output },
  ];

  return (
    <section aria-label="Cost estimate" className={`w-full max-w-sm rounded-[18px] bg-surface p-4 shadow-[var(--shadow-card)] dark:bg-raised ${className}`}>
      <p className="text-xs text-fg-subtle">Estimated cost · {model}{runs > 1 ? ` · ${runs} runs` : ""}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-fg"><CountUp text={formatUsd(cost.total)} /></p>
      <table className="mt-3 w-full text-xs">
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-t border-track">
              <th scope="row" className="py-1.5 text-left font-normal text-fg-muted">{r.label}</th>
              <td className="py-1.5 text-right tabular-nums text-fg-subtle">{compact(r.tokens)} tokens</td>
              <td className="w-16 py-1.5 text-right tabular-nums text-fg">{formatUsd(r.cost)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {budget !== undefined && (
        <div className="mt-3">
          <div role="meter" aria-label="Budget used" aria-valuemin={0} aria-valuemax={budget} aria-valuenow={Math.min(cost.total, budget)} className="h-1.5 overflow-hidden rounded-full bg-track">
            <div className="h-full rounded-full transition-[width]" style={{ width: `${Math.min(ratio, 1) * 100}%`, background: tone }} />
          </div>
          <p className={`mt-1.5 text-xs tabular-nums ${ratio >= 1 ? "text-danger-text" : "text-fg-subtle"}`}>
            {ratio >= 1 ? `Over the ${formatUsd(budget)} budget` : `${Math.round(ratio * 100)}% of the ${formatUsd(budget)} budget`}
          </p>
        </div>
      )}
    </section>
  );
}
