"use client";

import type { ReactNode } from "react";
import { Lock, MousePointer2 } from "lucide-react";

/* Browser frame: a window chrome with address bar around a page preview, marking when an agent is driving the browser and which action it is taking. */

export interface BrowserFrameProps {
  url: string;
  title?: string;
  loading?: boolean;
  /** When set, shows the agent's current action as a floating label. */
  agentAction?: string;
  children?: ReactNode;
  className?: string;
}

/** Host and path without protocol, for the address bar. */
export function displayUrl(url: string): { secure: boolean; text: string } {
  return { secure: url.startsWith("https://"), text: url.replace(/^https?:\/\//, "").replace(/\/$/, "") };
}

export function BrowserFrame({ url, title, loading = false, agentAction, children, className = "" }: BrowserFrameProps) {
  const { secure, text } = displayUrl(url);
  return (
    <figure aria-label={title ?? `Browser: ${text}`} className={`overflow-hidden rounded-[16px] bg-surface shadow-[var(--shadow-card)] dark:bg-raised ${className}`}>
      <figcaption className="flex items-center gap-3 border-b border-track bg-subtle px-3 py-2">
        <span aria-hidden className="flex gap-1.5">
          {[0, 1, 2].map((i) => <span key={i} className="size-2.5 rounded-full bg-track-strong" />)}
        </span>
        <span className="flex h-7 min-w-0 flex-1 items-center gap-1.5 rounded-full bg-surface px-3 text-xs text-fg-muted dark:bg-raised">
          <Lock size={11} aria-hidden className={secure ? "text-success" : "text-fg-subtle"} />
          <span className="truncate" aria-label="Address">{text}</span>
        </span>
      </figcaption>
      <div className="relative">
        {loading && (
          <div role="progressbar" aria-label="Loading page" className="absolute inset-x-0 top-0 h-0.5 overflow-hidden bg-track">
            <div className="h-full w-1/3 animate-pulse bg-select motion-reduce:animate-none" />
          </div>
        )}
        <div className="min-h-40 p-4">{children}</div>
        {agentAction && (
          <span role="status" className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-select px-3 py-1.5 text-xs text-[var(--inverse-fg)] shadow-[var(--shadow-overlay)]">
            <MousePointer2 size={12} aria-hidden />
            {agentAction}
          </span>
        )}
      </div>
    </figure>
  );
}
