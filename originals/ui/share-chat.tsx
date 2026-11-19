"use client";

import { Check, Copy, Globe, Link2, Lock } from "lucide-react";
import { useId, useState, useSyncExternalStore, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";


/* Share chat: a share card with a visibility choice (private, anyone with the link, public), a read-only link field with copy, and a revoke action once shared. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}
const spring = { type: "spring", stiffness: 480, damping: 34 } as const;

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export type Visibility = "private" | "link" | "public";

const OPTIONS: { id: Visibility; label: string; hint: string; icon: ReactNode }[] = [
  { id: "private", label: "Only me", hint: "Nobody else can open this chat", icon: <Lock size={15} aria-hidden /> },
  { id: "link", label: "Anyone with the link", hint: "Viewers can read, not reply", icon: <Link2 size={15} aria-hidden /> },
  { id: "public", label: "Public", hint: "Listed and searchable", icon: <Globe size={15} aria-hidden /> },
];

/** The link only exists while the chat is shared. */
export const isShared = (v: Visibility) => v !== "private";

export interface ShareChatProps {
  url: string;
  visibility?: Visibility;
  defaultVisibility?: Visibility;
  onVisibilityChange?: (v: Visibility) => void;
  onCopy?: (url: string) => void;
  className?: string;
}

export function ShareChat({ url, visibility: visibilityProp, defaultVisibility = "private", onVisibilityChange, onCopy, className = "" }: ShareChatProps) {
  const reduce = useReduce();
  const sel = useId();
  const [inner, setInner] = useState(defaultVisibility);
  const [copied, setCopied] = useState(false);
  const visibility = visibilityProp ?? inner;

  const set = (v: Visibility) => {
    if (visibilityProp === undefined) setInner(v);
    onVisibilityChange?.(v);
  };
  const copy = () => {
    void navigator.clipboard?.writeText(url).catch(() => undefined);
    onCopy?.(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <motion.section aria-label="Share chat" initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={spring} className={`w-full max-w-sm rounded-[20px] bg-surface p-4 shadow-[var(--shadow-card)] ${className}`}>
      <h3 className="text-sm font-medium text-fg">Share chat</h3>
      <div role="radiogroup" aria-label="Who can view" className="mt-3 grid gap-1.5">
        {OPTIONS.map((o, i) => (
          <motion.label key={o.id} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: reduce ? 0 : 0.05 + i * 0.04 }} whileTap={reduce ? undefined : { scale: 0.98 }} className={`relative isolate flex cursor-pointer items-center gap-3 rounded-[12px] px-3 py-2 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--select)] ${visibility === o.id ? "text-select-text" : "bg-subtle text-fg hover:bg-track"}`}>
            {visibility === o.id && <motion.span layoutId={`${sel}-sel`} transition={reduce ? { duration: 0 } : spring} className="absolute inset-0 -z-10 rounded-[12px] bg-select-soft" />}
            <input type="radio" name="share-visibility" value={o.id} checked={visibility === o.id} onChange={() => set(o.id)} className="sr-only" />
            {o.icon}
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-medium">{o.label}</span>
              <span className="block text-xs text-fg-muted">{o.hint}</span>
            </span>
            {visibility === o.id && <motion.span initial={reduce ? false : { scale: 0 }} animate={{ scale: 1 }} transition={spring} className="grid"><Check size={14} aria-hidden /></motion.span>}
          </motion.label>
        ))}
      </div>
      <AnimatePresence initial={false}>
      {isShared(visibility) && (
        <motion.div key="link" initial={reduce ? false : { height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
        <div className="mt-3 flex items-center gap-2 rounded-full bg-subtle py-1 pl-3 pr-1">
          <input readOnly value={url} aria-label="Share link" onFocus={(e) => e.currentTarget.select()} className="min-w-0 flex-1 bg-transparent text-xs text-fg-muted outline-none" />
          <motion.button type="button" onClick={copy} whileTap={reduce ? undefined : { scale: 0.95 }} className={`inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1.5 text-xs font-medium text-fg shadow-[var(--shadow-btn-secondary)] ${ring}`}>
            <motion.span key={String(copied)} initial={reduce ? false : { scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={spring} className="grid">{copied ? <Check size={12} aria-hidden /> : <Copy size={12} aria-hidden />}</motion.span>
            {copied ? "Copied" : "Copy link"}
          </motion.button>
        </div>
        </motion.div>
      )}
      </AnimatePresence>
      <p role="status" className="sr-only">{isShared(visibility) ? "Link sharing is on" : "Link sharing is off"}</p>
    </motion.section>
  );
}
