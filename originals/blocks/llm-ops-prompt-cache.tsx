"use client";

import { CountUp } from "../ui/chart-utils";

/* LLM ops prompt cache: a card (1/3 width of 12 columns) with the overall cache hit rate, tokens served from cache and dollars saved, plus hit rate per prompt template. */

export interface PromptCacheRow {
  prompt: string;
  hits: number;
  requests: number;
}

export interface PromptCacheProps {
  rows?: PromptCacheRow[];
  /** Price of one million input tokens that miss the cache. */
  usdPerMillionTokens?: number;
  /** Fraction of that price a cached token costs. */
  cachedPriceRatio?: number;
  tokensPerRequest?: number;
  className?: string;
}

const DEMO_ROWS: PromptCacheRow[] = [
  { prompt: "support-system", hits: 18_420, requests: 20_100 },
  { prompt: "doc-search-context", hits: 9_860, requests: 14_300 },
  { prompt: "recap-instructions", hits: 3_120, requests: 7_900 },
  { prompt: "code-style-guide", hits: 5_410, requests: 6_050 },
];

export const hitRate = (hits: number, requests: number) => (requests > 0 ? hits / requests : 0);

export interface CacheSavings {
  rate: number;
  cachedTokens: number;
  savedUsd: number;
}

export function cacheSavings(rows: PromptCacheRow[], usdPerMillionTokens: number, cachedPriceRatio: number, tokensPerRequest: number): CacheSavings {
  const hits = rows.reduce((s, r) => s + r.hits, 0);
  const requests = rows.reduce((s, r) => s + r.requests, 0);
  const cachedTokens = hits * tokensPerRequest;
  return { rate: hitRate(hits, requests), cachedTokens, savedUsd: (cachedTokens / 1e6) * usdPerMillionTokens * (1 - cachedPriceRatio) };
}

const compact = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : String(n));

export function LlmOpsPromptCache({ rows = DEMO_ROWS, usdPerMillionTokens = 3, cachedPriceRatio = 0.1, tokensPerRequest = 2400, className = "" }: PromptCacheProps) {
  const sav = cacheSavings(rows, usdPerMillionTokens, cachedPriceRatio, tokensPerRequest);
  return (
    <section aria-label="Prompt cache" className={`@container rounded-[20px] bg-surface p-5 shadow-[var(--shadow-card)] dark:bg-raised ${className}`}>
      <h3 className="text-[15px] font-semibold text-fg">Prompt cache</h3>
      <div className="mt-3 flex items-end gap-4">
        <p className="text-[34px] font-semibold leading-none tabular-nums text-fg"><CountUp text={`${(sav.rate * 100).toFixed(1)}%`} /></p>
        <p className="pb-1 text-[13px] text-fg-muted">hit rate</p>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-[13px]">
        <div>
          <dt className="text-fg-subtle">Tokens from cache</dt>
          <dd className="tabular-nums text-fg">{compact(sav.cachedTokens)}</dd>
        </div>
        <div>
          <dt className="text-fg-subtle">Saved</dt>
          <dd className="tabular-nums text-success-text">${sav.savedUsd.toFixed(2)}</dd>
        </div>
      </dl>
      <ul aria-label="Hit rate by prompt" className="mt-4 grid gap-2.5">
        {rows.map((r) => {
          const rate = hitRate(r.hits, r.requests);
          return (
            <li key={r.prompt}>
              <div className="flex justify-between text-[12px]">
                <span className="truncate font-mono text-fg-muted">{r.prompt}</span>
                <span className="tabular-nums text-fg">{Math.round(rate * 100)}%</span>
              </div>
              <div role="meter" aria-label={`${r.prompt} hit rate`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(rate * 100)} className="mt-1 h-1.5 rounded-full bg-track">
                <div className="h-full rounded-full" style={{ width: `${rate * 100}%`, background: rate < 0.6 ? "var(--warning)" : "var(--success)" }} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
