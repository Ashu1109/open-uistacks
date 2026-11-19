"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Eye, EyeOff, RefreshCw } from "lucide-react";

/* ApiKeyRow: a named API key shown masked, with reveal, copy and regenerate buttons; copying confirms for two seconds in a live region. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

/** Keeps the prefix up to the second underscore and the last `tail` characters: sk_test_••••••••9f2a. */
export function maskKey(key: string, tail = 4): string {
  if (key.length <= tail + 4) return "•".repeat(key.length);
  const prefixEnd = key.indexOf("_", key.indexOf("_") + 1);
  const prefix = prefixEnd > 0 && prefixEnd < key.length - tail ? key.slice(0, prefixEnd + 1) : "";
  return `${prefix}${"•".repeat(8)}${key.slice(-tail)}`;
}

export interface ApiKeyRowProps {
  name: string;
  value: string;
  createdLabel?: string;
  onReveal?: (revealed: boolean) => void;
  onCopy?: (value: string) => void;
  onRegenerate?: () => void;
  className?: string;
}

const iconButton = `grid size-8 place-items-center rounded-[10px] text-fg-muted transition-colors hover:bg-[color-mix(in_srgb,var(--fg)_6%,var(--surface))] hover:text-fg ${ring}`;

export function ApiKeyRow({ name, value, createdLabel, onReveal, onCopy, onRegenerate, className = "" }: ApiKeyRowProps) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard?.writeText(value);
    } catch {
      return;
    }
    setCopied(true);
    onCopy?.(value);
  };

  return (
    <div className={`flex items-center gap-3 rounded-[16px] bg-surface px-4 py-3 shadow-[var(--shadow-card)] ${className}`}>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-fg">{name}</p>
        <code aria-label={`${name} key`} className="mt-0.5 block truncate font-mono text-[13px] text-fg-muted">{revealed ? value : maskKey(value)}</code>
        {createdLabel && <p className="mt-0.5 text-xs text-fg-subtle">{createdLabel}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <button type="button" aria-pressed={revealed} aria-label={revealed ? `Hide ${name}` : `Reveal ${name}`} onClick={() => { setRevealed(!revealed); onReveal?.(!revealed); }} className={iconButton}>
          {revealed ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
        </button>
        <button type="button" aria-label={`Copy ${name}`} onClick={copy} className={iconButton}>
          {copied ? <Check size={16} className="text-success-text" aria-hidden /> : <Copy size={16} aria-hidden />}
        </button>
        <button type="button" aria-label={`Regenerate ${name}`} onClick={onRegenerate} className={iconButton}>
          <RefreshCw size={16} aria-hidden />
        </button>
      </div>
      <span role="status" className="sr-only">{copied ? "Copied to clipboard" : ""}</span>
    </div>
  );
}
