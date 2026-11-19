"use client";

/* LLM ops cost by feature: a card (1/2 or 1/3 width of 12 columns) ranking product features by LLM spend with share-of-total bars and a month-over-month change. */

export interface FeatureCost {
  feature: string;
  costUsd: number;
  /** Change against the previous period, in percent. */
  changePct: number;
}

export const DEMO_FEATURE_COSTS: FeatureCost[] = [
  { feature: "Smart replies", costUsd: 4820, changePct: 12.4 },
  { feature: "Document search", costUsd: 3110, changePct: -4.2 },
  { feature: "Meeting recaps", costUsd: 2475, changePct: 31.8 },
  { feature: "Code suggestions", costUsd: 1960, changePct: 2.1 },
  { feature: "Onboarding guide", costUsd: 640, changePct: -18.5 },
];

export function rankFeatures(items: FeatureCost[]): (FeatureCost & { share: number })[] {
  const total = items.reduce((s, i) => s + i.costUsd, 0);
  return [...items].sort((a, b) => b.costUsd - a.costUsd).map((i) => ({ ...i, share: total > 0 ? i.costUsd / total : 0 }));
}

export const formatMoney = (usd: number) => `$${Math.round(usd).toLocaleString("en-US")}`;

export interface LlmOpsCostByFeatureProps {
  items?: FeatureCost[];
  period?: string;
  className?: string;
}

export function LlmOpsCostByFeature({ items = DEMO_FEATURE_COSTS, period = "November", className = "" }: LlmOpsCostByFeatureProps) {
  const ranked = rankFeatures(items);
  const total = items.reduce((s, i) => s + i.costUsd, 0);
  return (
    <section aria-label="Cost by feature" className={`@container rounded-[20px] bg-surface p-5 shadow-[var(--shadow-card)] dark:bg-raised ${className}`}>
      <h3 className="text-[15px] font-semibold text-fg">Cost by feature</h3>
      <p className="text-[13px] text-fg-muted">
        {period} · <span className="tabular-nums">{formatMoney(total)}</span> total
      </p>
      {ranked.length === 0 ? (
        <p className="py-8 text-center text-[13px] text-fg-muted">No spend recorded yet.</p>
      ) : (
        <ol className="mt-4 grid gap-3.5">
          {ranked.map((r) => (
            <li key={r.feature}>
              <div className="flex items-baseline justify-between gap-3 text-[13px]">
                <span className="min-w-0 truncate font-medium text-fg">{r.feature}</span>
                <span className="flex shrink-0 items-baseline gap-2 tabular-nums">
                  <span className={`text-[12px] ${r.changePct > 0 ? "text-danger-text" : "text-success-text"}`}>
                    {r.changePct > 0 ? "+" : ""}
                    {r.changePct.toFixed(1)}%
                  </span>
                  <span className="text-fg">{formatMoney(r.costUsd)}</span>
                </span>
              </div>
              <div role="meter" aria-label={`${r.feature} share of spend`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(r.share * 100)} className="mt-1.5 h-1.5 rounded-full bg-track">
                <div className="h-full rounded-full bg-[var(--series-1)]" style={{ width: `${r.share * 100}%` }} />
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
