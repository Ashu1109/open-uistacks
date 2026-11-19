"use client";

import { useState } from "react";
import { RotateCw, TriangleAlert } from "lucide-react";
import { Button } from "../../registry/ui/button";

/* Data pipelines failed sync: a card (1/2 width) of syncs that need attention, each with its error and a retry button that shows a retrying state until the host reports the outcome. */

export interface FailedSync {
  id: string;
  connector: string;
  /** Display text, e.g. "Today 1:02 AM". */
  failedAt: string;
  error: string;
  /** Attempts so far. */
  attempts: number;
}

export interface DataPipelinesFailedSyncProps {
  syncs?: FailedSync[];
  /** Called on Retry. Resolve when the retry has been queued; the row then reads Retrying and stays so until the sync leaves `syncs`. */
  onRetry?: (sync: FailedSync) => void | Promise<void>;
  className?: string;
}

export const DEMO_FAILED_SYNCS: FailedSync[] = [
  { id: "f1", connector: "Support desk", failedAt: "Today 1:02 AM", error: "401 Unauthorized: the API token was revoked.", attempts: 3 },
  { id: "f2", connector: "Billing", failedAt: "Today 2:20 AM", error: "Rate limit exceeded, retry after 15 minutes.", attempts: 1 },
  { id: "f3", connector: "Ad spend", failedAt: "Yesterday 11:48 PM", error: "Schema drift: column `campaign_group` was removed.", attempts: 2 },
];

export function pendingAfterRetry(pending: readonly string[], id: string): string[] {
  return pending.includes(id) ? [...pending] : [...pending, id];
}

export function DataPipelinesFailedSync({ syncs = DEMO_FAILED_SYNCS, onRetry, className = "" }: DataPipelinesFailedSyncProps) {
  const [pending, setPending] = useState<string[]>([]);
  const retry = async (s: FailedSync) => {
    setPending((p) => pendingAfterRetry(p, s.id));
    try {
      await onRetry?.(s);
    } catch {
      setPending((p) => p.filter((id) => id !== s.id));
    }
  };
  const retryAll = () => syncs.filter((s) => !pending.includes(s.id)).forEach((s) => void retry(s));
  const idle = syncs.filter((s) => !pending.includes(s.id)).length;
  return (
    <section aria-label="Failed syncs" className={`@container grid content-start gap-3 rounded-[20px] bg-surface p-5 shadow-[var(--shadow-card)] ${className}`}>
      <header className="flex items-center justify-between gap-2">
        <h2 className="text-[15px] font-semibold text-fg">
          Failed syncs <span className="ml-1 text-fg-muted tabular-nums">{syncs.length}</span>
        </h2>
        {syncs.length > 1 && (
          <Button size="xs" variant="secondary" disabled={idle === 0} onClick={retryAll}>
            Retry all
          </Button>
        )}
      </header>
      {syncs.length === 0 ? (
        <p className="py-6 text-center text-sm text-fg-muted">No failed syncs. Everything ran clean.</p>
      ) : (
        <ul className="grid gap-2" aria-live="polite">
          {syncs.map((s) => {
            const busy = pending.includes(s.id);
            return (
              <li key={s.id} className="flex flex-col gap-2 rounded-[14px] bg-danger-soft p-3 @[420px]:flex-row @[420px]:items-center">
                <TriangleAlert size={16} className="mt-0.5 shrink-0 text-danger-text @[420px]:mt-0" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-fg">
                    {s.connector} <span className="font-normal text-fg-muted">· {s.failedAt}</span>
                  </p>
                  <p className="text-[13px] text-danger-text">{s.error}</p>
                  <p className="text-[12px] text-fg-muted">
                    {s.attempts} {s.attempts === 1 ? "attempt" : "attempts"}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  loading={busy}
                  disabled={busy}
                  leadingIcon={<RotateCw size={14} aria-hidden />}
                  aria-label={`${busy ? "Retrying" : "Retry"} ${s.connector}`}
                  onClick={() => void retry(s)}
                >
                  {busy ? "Retrying" : "Retry"}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
