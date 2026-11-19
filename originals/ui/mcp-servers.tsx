"use client";

import { RotateCw } from "lucide-react";

/* MCP servers: a list of Model Context Protocol servers with a live connection status, tool count, an error line with retry, and an on/off switch. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export type McpStatus = "connected" | "connecting" | "error" | "disconnected";

export interface McpServer {
  id: string;
  name: string;
  url: string;
  status: McpStatus;
  tools?: number;
  error?: string;
}

export interface McpServersProps {
  servers: McpServer[];
  /** Called with the next desired on/off state. */
  onToggle?: (id: string, enabled: boolean) => void;
  onRetry?: (id: string) => void;
  className?: string;
}

export const STATUS_TEXT: Record<McpStatus, string> = {
  connected: "Connected",
  connecting: "Connecting",
  error: "Error",
  disconnected: "Off",
};

const DOT: Record<McpStatus, string> = {
  connected: "bg-success",
  connecting: "bg-warning animate-pulse motion-reduce:animate-none",
  error: "bg-danger",
  disconnected: "bg-track-strong",
};

/** Hostname without protocol, or the raw string when it is not a URL. */
export function shortUrl(url: string): string {
  try {
    return new URL(url).host || url;
  } catch {
    return url;
  }
}

export function McpServers({ servers, onToggle, onRetry, className = "" }: McpServersProps) {
  return (
    <ul aria-label="MCP servers" className={`divide-y divide-track overflow-hidden rounded-[16px] bg-surface shadow-[var(--shadow-card)] dark:bg-raised ${className}`}>
      {servers.map((s) => {
        const on = s.status === "connected" || s.status === "connecting";
        return (
          <li key={s.id} className="flex items-center gap-3 px-4 py-3">
            <span aria-hidden className={`size-2 shrink-0 rounded-full ${DOT[s.status]}`} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-fg">{s.name}</p>
              <p className="truncate text-xs text-fg-subtle">
                {shortUrl(s.url)}
                {s.tools !== undefined && s.status === "connected" ? ` · ${s.tools} tools` : ""}
              </p>
              {s.status === "error" && s.error && <p className="mt-0.5 text-xs text-danger-text">{s.error}</p>}
            </div>
            <span className="text-xs text-fg-muted" role="status">
              <span className="sr-only">{s.name}: </span>
              {STATUS_TEXT[s.status]}
            </span>
            {s.status === "error" && onRetry && (
              <button type="button" aria-label={`Retry ${s.name}`} onClick={() => onRetry(s.id)} className={`grid size-8 place-items-center rounded-lg text-fg-muted hover:bg-subtle ${ring}`}>
                <RotateCw size={15} aria-hidden />
              </button>
            )}
            <button type="button" role="switch" aria-checked={on} aria-label={`Enable ${s.name}`} onClick={() => onToggle?.(s.id, !on)} className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${on ? "bg-select" : "bg-track-strong"} ${ring}`}>
              <span className={`absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow transition-transform ${on ? "translate-x-4" : ""}`} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
