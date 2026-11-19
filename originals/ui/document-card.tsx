"use client";

import type { ReactNode } from "react";
import { FileText } from "lucide-react";
import { formatRelativeTime } from "./activity-feed";
import { initials } from "./board-card";

/* Document card: a file tile with a text preview, owner, relative edit time and an avatar stack of collaborators; becomes a link or button when given href or onOpen. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface DocumentCardProps {
  title: string;
  /** First lines of the document. */
  preview?: string;
  owner?: string;
  editedAt?: Date | number;
  collaborators?: string[];
  icon?: ReactNode;
  href?: string;
  onOpen?: () => void;
  now?: Date | number;
  className?: string;
}

const MAX_AVATARS = 3;

export function DocumentCard({ title, preview, owner, editedAt, collaborators = [], icon, href, onOpen, now, className = "" }: DocumentCardProps) {
  const shown = collaborators.slice(0, MAX_AVATARS);
  const extra = collaborators.length - shown.length;
  const name = <span className="line-clamp-1 text-sm font-medium text-fg">{title}</span>;
  const heading = href ? (
    <a href={href} className={`rounded after:absolute after:inset-0 after:rounded-[18px] ${ring}`}>{name}</a>
  ) : onOpen ? (
    <button type="button" onClick={onOpen} className={`rounded text-left after:absolute after:inset-0 after:rounded-[18px] ${ring}`}>{name}</button>
  ) : name;
  const interactive = Boolean(href || onOpen);

  return (
    <article className={`relative grid gap-3 rounded-[18px] bg-surface p-4 shadow-[var(--shadow-card)] dark:bg-raised ${interactive ? "transition-transform hover:-translate-y-0.5" : ""} ${className}`}>
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-select-soft text-select-text">{icon ?? <FileText size={16} aria-hidden />}</span>
        <h4 className="min-w-0">{heading}</h4>
      </div>
      {preview && <p className="line-clamp-3 rounded-[12px] bg-subtle px-3 py-2 text-xs leading-5 text-fg-muted">{preview}</p>}
      <div className="flex items-center justify-between gap-2 text-xs text-fg-muted">
        <span className="truncate">
          {owner}{owner && editedAt !== undefined && " · "}
          {editedAt !== undefined && <>Edited <time dateTime={new Date(editedAt).toISOString()}>{formatRelativeTime(editedAt, now)}</time></>}
        </span>
        {collaborators.length > 0 && (
          <ul aria-label={`${collaborators.length} collaborators`} className="flex shrink-0 -space-x-1.5">
            {shown.map((c) => (
              <li key={c} title={c} className="grid size-6 place-items-center rounded-full bg-select-soft text-[10px] font-medium text-select-text ring-2 ring-[var(--surface)]">
                <span aria-hidden>{initials(c)}</span><span className="sr-only">{c}</span>
              </li>
            ))}
            {extra > 0 && <li className="grid h-6 min-w-6 place-items-center rounded-full bg-subtle px-1 text-[10px] font-medium text-fg-muted ring-2 ring-[var(--surface)]">+{extra}</li>}
          </ul>
        )}
      </div>
    </article>
  );
}
