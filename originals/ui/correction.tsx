"use client";

import { Check, Pencil, Undo2 } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "motion/react";


/* Correction: shows an assistant statement with the user's fix beside it (original struck through), and lets the user edit the fix or undo it. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}
const spring = { type: "spring", stiffness: 480, damping: 34 } as const;

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface CorrectionProps {
  original: string;
  corrected: string;
  onCorrect?: (text: string) => void;
  onUndo?: () => void;
  className?: string;
}

export function Correction({ original, corrected, onCorrect, onUndo, className = "" }: CorrectionProps) {
  const reduce = useReduce();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(corrected);
  const save = () => {
    const text = draft.trim();
    if (!text) return;
    onCorrect?.(text);
    setEditing(false);
  };
  return (
    <motion.div initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={spring} className={`w-full max-w-lg rounded-[18px] bg-surface p-4 shadow-[var(--shadow-card)] ${className}`}>
      <motion.p initial={reduce ? false : { textDecorationColor: "rgba(128,128,128,0)", opacity: 1 }} animate={{ textDecorationColor: "rgba(128,128,128,0.9)", opacity: 1 }} transition={{ duration: 0.4, delay: 0.15 }} className="text-[13px] leading-5 text-fg-muted line-through decoration-[1px]"><span className="sr-only">Original: </span>{original}</motion.p>
      {editing ? (
        <motion.div initial={reduce ? false : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="mt-2">
          <textarea aria-label="Corrected text" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Escape") setEditing(false); if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save(); }} rows={2} className={`w-full resize-none rounded-[12px] bg-subtle px-3 py-2 text-[14px] text-fg ${ring}`} />
          <div className="mt-2 flex justify-end gap-2">
            <motion.button type="button" whileTap={reduce ? undefined : { scale: 0.97 }} onClick={() => setEditing(false)} className={`rounded-full px-3 py-1 text-xs text-fg-muted transition-colors hover:bg-subtle ${ring}`}>Cancel</motion.button>
            <motion.button type="button" whileTap={reduce ? undefined : { scale: 0.97 }} onClick={save} className={`inline-flex items-center gap-1 rounded-full bg-select px-3 py-1 text-xs font-medium text-[var(--on-feature)] ${ring}`}><Check size={12} aria-hidden /> Save</motion.button>
          </div>
        </motion.div>
      ) : (
        <motion.p key={corrected} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: reduce ? 0 : 0.1 }} className="mt-1.5 text-[14px] leading-5 text-fg"><span className="sr-only">Corrected: </span>{corrected}</motion.p>
      )}
      {!editing && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          <motion.span initial={reduce ? false : { opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ ...spring, delay: reduce ? 0 : 0.25 }} className="rounded-full bg-success-soft px-2 py-0.5 font-medium text-success-text">Corrected by you</motion.span>
          <motion.button type="button" whileTap={reduce ? undefined : { scale: 0.95 }} onClick={() => { setDraft(corrected); setEditing(true); }} className={`ml-auto inline-flex items-center gap-1 rounded-full px-2 py-1 text-fg-muted transition-colors hover:bg-subtle ${ring}`}><Pencil size={12} aria-hidden /> Edit</motion.button>
          {onUndo && <motion.button type="button" whileTap={reduce ? undefined : { scale: 0.95 }} onClick={onUndo} className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-fg-muted transition-colors hover:bg-subtle ${ring}`}><Undo2 size={12} aria-hidden /> Undo</motion.button>}
        </div>
      )}
    </motion.div>
  );
}
