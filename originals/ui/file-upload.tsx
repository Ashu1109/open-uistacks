"use client";

import { useId, useRef, useState, type DragEvent, type KeyboardEvent } from "react";
import { CircleAlert, FileText, UploadCloud, X } from "lucide-react";
import { formatBytes } from "./attachment";

/* File upload: a drop zone that also opens the file picker from the keyboard, validates type, size and count, and lists the files you added with remove buttons. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface FileLike {
  name: string;
  size: number;
  type: string;
}

export interface FileRejection<T extends FileLike> {
  file: T;
  reason: string;
}

export function matchesAccept(file: FileLike, accept: string): boolean {
  const rules = accept.split(",").map((r) => r.trim().toLowerCase()).filter(Boolean);
  if (rules.length === 0) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return rules.some((rule) => (rule.startsWith(".") ? name.endsWith(rule) : rule.endsWith("/*") ? type.startsWith(rule.slice(0, -1)) : type === rule));
}

export function validateFiles<T extends FileLike>(incoming: T[], rules: { accept?: string; maxSize?: number; maxFiles?: number; existing?: number }): { accepted: T[]; rejected: FileRejection<T>[] } {
  const accepted: T[] = [];
  const rejected: FileRejection<T>[] = [];
  const room = rules.maxFiles === undefined ? Infinity : rules.maxFiles - (rules.existing ?? 0);
  for (const file of incoming) {
    if (rules.accept && !matchesAccept(file, rules.accept)) rejected.push({ file, reason: "Unsupported file type" });
    else if (rules.maxSize !== undefined && file.size > rules.maxSize) rejected.push({ file, reason: `Larger than ${formatBytes(rules.maxSize)}` });
    else if (accepted.length >= room) rejected.push({ file, reason: "Too many files" });
    else accepted.push(file);
  }
  return { accepted, rejected };
}

export interface FileUploadProps {
  /** Same syntax as the input's accept attribute. */
  accept?: string;
  /** Largest allowed file in bytes. */
  maxSize?: number;
  maxFiles?: number;
  multiple?: boolean;
  files?: File[];
  defaultFiles?: File[];
  onFilesChange?: (files: File[]) => void;
  className?: string;
}

export function FileUpload({ accept, maxSize, maxFiles, multiple = true, files: controlled, defaultFiles = [], onFilesChange, className = "" }: FileUploadProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [inner, setInner] = useState<File[]>(defaultFiles);
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const files = controlled ?? inner;

  const commit = (next: File[]) => {
    setInner(next);
    onFilesChange?.(next);
  };

  const add = (list: FileList | null) => {
    if (!list) return;
    const incoming = Array.from(list);
    const { accepted, rejected } = validateFiles(incoming, { accept, maxSize, maxFiles: multiple ? maxFiles : 1, existing: multiple ? files.length : 0 });
    setErrors(rejected.map((r) => `${r.file.name}: ${r.reason}`));
    if (accepted.length) commit(multiple ? [...files, ...accepted] : accepted.slice(0, 1));
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    add(e.dataTransfer.files);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      input.current?.click();
    }
  };

  return (
    <div className={`w-96 ${className}`}>
      <div
        role="button"
        tabIndex={0}
        aria-describedby={`${id}-hint`}
        onClick={() => input.current?.click()}
        onKeyDown={onKeyDown}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-[20px] border-[1.5px] border-dashed px-6 py-8 text-center transition-colors ${dragging ? "border-[var(--select)] bg-select-soft" : "border-track-strong bg-surface hover:bg-subtle"} ${ring}`}
      >
        <UploadCloud className={`size-6 ${dragging ? "text-select-text" : "text-fg-muted"}`} aria-hidden />
        <span className="text-sm font-medium text-fg">Drop files here or browse</span>
        <span id={`${id}-hint`} className="text-xs text-fg-muted">
          {[accept && `Accepts ${accept}`, maxSize !== undefined && `up to ${formatBytes(maxSize)} each`, maxFiles !== undefined && multiple && `max ${maxFiles} files`].filter(Boolean).join(", ") || "Any file type"}
        </span>
        <input ref={input} type="file" hidden accept={accept} multiple={multiple} aria-label="Choose files" onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
      </div>
      <div role="alert" className="mt-2 space-y-1">
        {errors.map((e) => (
          <p key={e} className="flex items-center gap-1.5 text-xs text-danger-text"><CircleAlert className="size-3.5" aria-hidden />{e}</p>
        ))}
      </div>
      {files.length > 0 && (
        <ul aria-label="Selected files" className="mt-2 space-y-1.5">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center gap-3 rounded-[12px] bg-subtle px-3 py-2">
              <FileText className="size-4 shrink-0 text-fg-muted" aria-hidden />
              <span className="min-w-0 flex-1 truncate text-sm text-fg">{f.name}</span>
              <span className="text-xs tabular-nums text-fg-muted">{formatBytes(f.size)}</span>
              <button type="button" aria-label={`Remove ${f.name}`} onClick={() => commit(files.filter((_, j) => j !== i))} className={`inline-flex size-6 items-center justify-center rounded-full text-fg-muted hover:bg-track ${ring}`}>
                <X className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
