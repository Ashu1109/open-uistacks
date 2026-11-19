"use client";

import { useState, type ReactNode } from "react";
import { Check, LoaderCircle } from "lucide-react";

/* IntegrationCard: a connectable service tile with icon, name, description and a connect/disconnect button that shows a pending state while the async handler runs. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface IntegrationCardProps {
  name: string;
  description: string;
  icon: ReactNode;
  connected?: boolean;
  defaultConnected?: boolean;
  /** May return a promise; the button stays pending until it settles. */
  onConnect?: () => void | Promise<void>;
  onDisconnect?: () => void | Promise<void>;
  className?: string;
}

export function IntegrationCard({ name, description, icon, connected, defaultConnected = false, onConnect, onDisconnect, className = "" }: IntegrationCardProps) {
  const [inner, setInner] = useState(defaultConnected);
  const [pending, setPending] = useState(false);
  const on = connected ?? inner;

  const toggle = async () => {
    setPending(true);
    try {
      await (on ? onDisconnect : onConnect)?.();
      if (connected === undefined) setInner(!on);
    } finally {
      setPending(false);
    }
  };

  return (
    <article aria-label={name} className={`flex w-full max-w-xs flex-col gap-3 rounded-[20px] bg-surface p-5 shadow-[var(--shadow-card)] ${className}`}>
      <div className="flex items-center justify-between">
        <span className="grid size-10 place-items-center rounded-[12px] bg-subtle text-fg" aria-hidden>{icon}</span>
        {on && <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-xs font-medium text-success-text"><Check size={12} aria-hidden />Connected</span>}
      </div>
      <div>
        <h4 className="text-[15px] font-semibold text-fg">{name}</h4>
        <p className="mt-1 text-[13px] leading-[18px] text-fg-muted">{description}</p>
      </div>
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-busy={pending}
        aria-label={`${on ? "Disconnect" : "Connect"} ${name}`}
        className={`mt-1 inline-flex h-9 items-center justify-center gap-2 rounded-[12px] text-sm font-medium disabled:opacity-70 ${ring} ${on ? "bg-subtle text-fg hover:bg-track" : "bg-[image:var(--grad-primary)] text-[var(--inverse-fg)] shadow-[var(--shadow-btn-primary)]"}`}
      >
        {pending && <LoaderCircle size={14} className="animate-spin" aria-hidden />}
        {on ? "Disconnect" : "Connect"}
      </button>
    </article>
  );
}
