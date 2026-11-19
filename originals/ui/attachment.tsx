"use client";

import { Children, isValidElement, useSyncExternalStore, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CircleAlert, File, FileArchive, FileAudio, FileCode, FileImage, FileText, FileVideo, X, type LucideIcon } from "lucide-react";

/* Attachment: a file chip with an image thumbnail or a type icon, size, upload progress, an error line and a remove button; AttachmentList lays chips in a row that animates them in and out. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export type FileKind = "image" | "video" | "audio" | "archive" | "code" | "text" | "file";

const BY_EXTENSION: Record<string, FileKind> = {
  png: "image", jpg: "image", jpeg: "image", gif: "image", webp: "image", avif: "image", svg: "image", heic: "image",
  mp4: "video", mov: "video", webm: "video", mkv: "video",
  mp3: "audio", wav: "audio", m4a: "audio", ogg: "audio", flac: "audio",
  zip: "archive", gz: "archive", tar: "archive", rar: "archive", "7z": "archive",
  js: "code", jsx: "code", ts: "code", tsx: "code", py: "code", go: "code", rs: "code", json: "code", html: "code", css: "code", sql: "code",
  pdf: "text", txt: "text", md: "text", doc: "text", docx: "text", csv: "text", rtf: "text",
};

const ICON: Record<FileKind, LucideIcon> = {
  image: FileImage,
  video: FileVideo,
  audio: FileAudio,
  archive: FileArchive,
  code: FileCode,
  text: FileText,
  file: File,
};

const extension = (name: string) => (name.includes(".") ? (name.split(".").pop() ?? "") : "");

export function fileKind(name: string, type = ""): FileKind {
  const major = type.split("/")[0];
  if (major === "image" || major === "video" || major === "audio") return major;
  return BY_EXTENSION[extension(name).toLowerCase()] ?? (major === "text" ? "text" : "file");
}

const UNITS = ["B", "KB", "MB", "GB", "TB"];

/** 512 B, 1.5 KB, 2.4 MB, 18 MB. */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 1024) return `${Math.max(0, Math.round(bytes || 0))} B`;
  const exp = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), UNITS.length - 1);
  const v = bytes / 1024 ** exp;
  return `${v < 10 ? v.toFixed(1).replace(/\.0$/, "") : Math.round(v)} ${UNITS[exp]}`;
}

export interface AttachmentProps {
  name: string;
  /** Bytes. */
  size?: number;
  /** MIME type; with the extension it picks the icon. */
  type?: string;
  /** Thumbnail for images, such as an object URL. */
  previewUrl?: string;
  /** 0 to 1 while uploading; leave it out once the file is up. */
  progress?: number;
  error?: string;
  onRemove?: () => void;
  className?: string;
}

function metaLine({ name, size, progress, error }: Pick<AttachmentProps, "name" | "size" | "progress" | "error">): string {
  if (error) return error;
  if (progress !== undefined) return `Uploading ${Math.round(progress * 100)}%`;
  const ext = extension(name).toUpperCase().slice(0, 4);
  return [ext, size === undefined ? "" : formatBytes(size)].filter(Boolean).join(" · ");
}

function Thumb({ kind, previewUrl, error }: { kind: FileKind; previewUrl?: string; error?: string }) {
  if (error) return <CircleAlert size={18} strokeWidth={1.75} aria-hidden />;
  if (kind === "image" && previewUrl) return <img src={previewUrl} alt="" className="size-full object-cover" />;
  const Icon = ICON[kind];
  return <Icon size={18} strokeWidth={1.75} aria-hidden />;
}

export function Attachment({ name, size, type, previewUrl, progress, error, onRemove, className = "" }: AttachmentProps) {
  const reduce = useReduce();
  const uploading = progress !== undefined && !error;
  const pct = Math.round(Math.min(Math.max(progress ?? 0, 0), 1) * 100);

  return (
    <div title={name} className={`group relative flex h-14 w-[220px] max-w-full items-center gap-2.5 rounded-[14px] bg-surface p-2 pr-3 shadow-[var(--shadow-card)] ${className}`}>
      <span className={`grid size-10 shrink-0 place-items-center overflow-hidden rounded-[10px] ${error ? "bg-danger-soft text-danger-text" : "bg-subtle text-fg-muted"}`}>
        <Thumb kind={fileKind(name, type)} previewUrl={previewUrl} error={error} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium leading-[18px] text-fg">{name}</span>
        <span role={error ? "alert" : undefined} className={`block truncate text-xs leading-4 tabular-nums ${error ? "text-danger-text" : "text-fg-muted"}`}>
          {metaLine({ name, size, progress, error })}
        </span>
      </span>
      {uploading && (
        <span role="progressbar" aria-label={`Uploading ${name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="absolute inset-x-3 bottom-1 h-0.5 overflow-hidden rounded-full bg-track">
          <motion.span
            className="block h-full rounded-full bg-select"
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 200, damping: 30 }}
          />
        </span>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${name}`}
          className={`absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-[var(--inverse)] text-[var(--inverse-fg)] opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100 ${ring}`}
        >
          <X size={12} strokeWidth={2.5} aria-hidden />
        </button>
      )}
    </div>
  );
}

/** Give each Attachment a stable `key` so a removed chip animates out. */
export function AttachmentList({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reduce = useReduce();
  const items = Children.toArray(children).filter(isValidElement);
  return (
    <ul aria-label="Attachments" className={`flex gap-2 overflow-x-auto p-1.5 ${className}`}>
      <AnimatePresence initial={false} mode="popLayout">
        {items.map((child) => (
          <motion.li
            key={child.key}
            layout={!reduce}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 500, damping: 34 }}
            className="shrink-0"
          >
            {child}
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
