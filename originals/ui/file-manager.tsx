"use client";

import { useId, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ChevronRight, File, FileArchive, FileAudio, FileCode, FileImage, FileText, FileVideo, Folder, type LucideIcon } from "lucide-react";
import { fileKind, formatBytes, type FileKind } from "./attachment";

/* FileManager: a folder browser with a breadcrumb trail, a keyboard-navigable listbox (arrows, Enter to open, Backspace to go up) and name, size and modified columns, folders first. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

export interface FileNode {
  id: string;
  name: string;
  /** Present on folders. */
  children?: readonly FileNode[];
  size?: number;
  modified?: Date;
}

export const isFolder = (node: FileNode) => node.children !== undefined;

/** Folders first, then alphabetical with natural number order. */
export function sortNodes(nodes: readonly FileNode[]): FileNode[] {
  return [...nodes].sort((a, b) => Number(isFolder(b)) - Number(isFolder(a)) || a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }));
}

/** Follows folder ids from the root; stops at the first id that is not a folder. */
export function resolvePath(root: readonly FileNode[], path: readonly string[]): { trail: FileNode[]; items: FileNode[] } {
  const trail: FileNode[] = [];
  let items = [...root];
  for (const id of path) {
    const next = items.find((n) => n.id === id && isFolder(n));
    if (!next) break;
    trail.push(next);
    items = [...(next.children ?? [])];
  }
  return { trail, items: sortNodes(items) };
}

const ICON: Record<FileKind, LucideIcon> = { image: FileImage, video: FileVideo, audio: FileAudio, archive: FileArchive, code: FileCode, text: FileText, file: File };

function KindIcon({ name }: { name: string }) {
  const Icon = ICON[fileKind(name)];
  return <Icon size={16} aria-hidden className="shrink-0 text-fg-muted" />;
}

const modifiedFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-inset";

export interface FileManagerProps {
  items: readonly FileNode[];
  rootLabel?: string;
  onOpenFile?: (file: FileNode) => void;
  onSelectionChange?: (node: FileNode | null) => void;
  className?: string;
}

export function FileManager({ items, rootLabel = "All files", onOpenFile, onSelectionChange, className = "" }: FileManagerProps) {
  const reduce = useReduce();
  const pillId = useId();
  const [path, setPath] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const { trail, items: listed } = resolvePath(items, path);

  const select = (node: FileNode | null) => {
    setSelected(node?.id ?? null);
    onSelectionChange?.(node);
  };
  const goTo = (depth: number) => {
    setPath(path.slice(0, depth));
    select(null);
  };
  const open = (node: FileNode) => {
    if (isFolder(node)) {
      setPath([...path, node.id]);
      select(null);
    } else onOpenFile?.(node);
  };
  const onKey = (e: KeyboardEvent<HTMLUListElement>) => {
    const index = listed.findIndex((n) => n.id === selected);
    const step = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
    if (step) {
      e.preventDefault();
      const next = listed[Math.min(Math.max(index + step, 0), listed.length - 1)];
      if (next) select(next);
    } else if (e.key === "Enter" && index >= 0) open(listed[index]);
    else if (e.key === "Backspace" && path.length > 0) goTo(path.length - 1);
    else if (e.key === "Home" && listed[0]) select(listed[0]);
    else if (e.key === "End" && listed.length) select(listed[listed.length - 1]);
    else return;
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") e.preventDefault();
  };

  return (
    <div className={`overflow-hidden rounded-[20px] bg-surface shadow-[var(--shadow-card)] ${className}`}>
      <nav aria-label="Breadcrumb" className="border-b border-track px-4 py-2.5">
        <ol className="flex flex-wrap items-center gap-1 text-[13px]">
          {[{ id: "", name: rootLabel }, ...trail].map((crumb, depth, all) => (
            <li key={crumb.id || "root"} className="flex items-center gap-1">
              {depth > 0 && <motion.span initial={reduce ? false : { opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} className="flex"><ChevronRight size={13} aria-hidden className="text-fg-subtle" /></motion.span>}
              <button type="button" aria-current={depth === all.length - 1 ? "page" : undefined} onClick={() => goTo(depth)} className={`rounded-[6px] px-1 transition-colors ${ring} ${depth === all.length - 1 ? "font-medium text-fg" : "text-fg-muted hover:text-fg"}`}>{crumb.name}</button>
            </li>
          ))}
        </ol>
      </nav>
      <div className="grid grid-cols-[1fr_88px_120px] gap-3 px-4 py-2 text-xs font-medium text-fg-muted" aria-hidden>
        <span>Name</span><span className="text-right">Size</span><span>Modified</span>
      </div>
      <ul role="listbox" aria-label={trail.at(-1)?.name ?? rootLabel} tabIndex={0} onKeyDown={onKey} aria-activedescendant={selected ? `fm-${selected}` : undefined} className={`max-h-72 overflow-auto pb-2 ${ring}`}>
        {listed.map((node, i) => {
          const folder = isFolder(node);
          return (
            <motion.li
              key={node.id}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 480, damping: 34, delay: Math.min(i * 0.03, 0.3) }}
              id={`fm-${node.id}`}
              role="option"
              aria-selected={selected === node.id}
              onClick={() => select(node)}
              onDoubleClick={() => open(node)}
              className={`relative grid cursor-default grid-cols-[1fr_88px_120px] items-center gap-3 px-4 py-2 text-[13px] transition-colors ${selected === node.id ? "text-select-text" : "text-fg hover:bg-[color-mix(in_srgb,var(--fg)_4%,var(--surface))]"}`}
            >
              {selected === node.id && <motion.span aria-hidden layoutId={reduce ? undefined : pillId} transition={{ type: "spring", stiffness: 520, damping: 38 }} className="absolute inset-0 bg-select-soft" />}
              <span className="relative flex min-w-0 items-center gap-2.5">
                {folder ? <Folder size={16} aria-hidden className="shrink-0 fill-[color-mix(in_srgb,var(--select)_25%,transparent)] text-select" /> : <KindIcon name={node.name} />}
                <span className="truncate">{node.name}</span>
              </span>
              <span className="relative text-right tabular-nums text-fg-muted">{folder ? `${node.children?.length ?? 0} items` : node.size === undefined ? "" : formatBytes(node.size)}</span>
              <span className="relative text-fg-muted">{node.modified ? modifiedFmt.format(node.modified) : ""}</span>
            </motion.li>
          );
        })}
        {listed.length === 0 && <li role="presentation" className="px-4 py-8 text-center text-sm text-fg-muted">This folder is empty</li>}
      </ul>
    </div>
  );
}
