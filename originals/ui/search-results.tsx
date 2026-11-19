"use client";

import { Search } from "lucide-react";

/* Search results: the web results an assistant found for a query, each with a domain badge, title link and snippet; shows a searching state and an empty state. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface SearchResult {
  id: string;
  title: string;
  url: string;
  snippet: string;
}

/** example.com for https://www.example.com/a/b; the input back when it is not a URL. */
export function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export interface SearchResultsProps {
  query: string;
  results: SearchResult[];
  loading?: boolean;
  className?: string;
}

export function SearchResults({ query, results, loading = false, className = "" }: SearchResultsProps) {
  return (
    <section aria-label="Search results" className={`w-full max-w-xl ${className}`}>
      <p role="status" className="mb-2 flex items-center gap-2 text-[13px] text-fg-muted">
        <Search size={14} className={loading ? "animate-pulse" : ""} aria-hidden />
        {loading ? `Searching for "${query}"…` : `${results.length} ${results.length === 1 ? "result" : "results"} for "${query}"`}
      </p>
      {loading ? (
        <ul aria-hidden className="grid gap-2">
          {[0, 1, 2].map((i) => <li key={i} className="h-20 animate-pulse rounded-[14px] bg-subtle" />)}
        </ul>
      ) : (
        <ol className="grid gap-2">
          {results.map((r) => (
            <li key={r.id} className="rounded-[14px] bg-surface p-3 shadow-[var(--shadow-card)]">
              <p className="flex items-center gap-2 text-xs text-fg-subtle">
                <span aria-hidden className="grid size-4 place-items-center rounded-full bg-select-soft text-[10px] font-semibold uppercase text-select-text">{hostname(r.url).charAt(0)}</span>
                {hostname(r.url)}
              </p>
              <a href={r.url} target="_blank" rel="noreferrer" className={`mt-1 block rounded text-[14px] font-medium text-select-text hover:underline ${ring}`}>{r.title}</a>
              <p className="mt-0.5 line-clamp-2 text-[13px] leading-5 text-fg-muted">{r.snippet}</p>
            </li>
          ))}
        </ol>
      )}
      {!loading && results.length === 0 && <p className="rounded-[14px] bg-subtle p-4 text-center text-[13px] text-fg-muted">Nothing found</p>}
    </section>
  );
}
