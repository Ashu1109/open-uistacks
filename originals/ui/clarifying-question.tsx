"use client";

import { useId, useState, useSyncExternalStore, type FormEvent } from "react";
import { motion, useReducedMotion } from "motion/react";

import { MessageCircleQuestion } from "lucide-react";

/* Clarifying question: the assistant asks before it answers; pick one option or type your own, then send or skip. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}
const spring = { type: "spring", stiffness: 480, damping: 34 } as const;

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface ClarifyingQuestionProps {
  question: string;
  options: string[];
  /** Offer a free-text "Something else" row. */
  allowOther?: boolean;
  onAnswer?: (answer: string) => void;
  onSkip?: () => void;
  className?: string;
}

export function ClarifyingQuestion({ question, options, allowOther = true, onAnswer, onSkip, className = "" }: ClarifyingQuestionProps) {
  const name = useId();
  const [choice, setChoice] = useState<string | null>(null);
  const [other, setOther] = useState("");
  const reduce = useReduce();
  const answer = choice === "__other" ? other.trim() : (choice ?? "");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (answer) onAnswer?.(answer);
  };

  return (
    <motion.form initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={spring} onSubmit={submit} className={`w-full max-w-md rounded-[20px] bg-surface p-4 shadow-[var(--shadow-card)] ${className}`}>
      <fieldset className="min-w-0">
        <legend className="flex items-start gap-2 pb-3 text-sm font-medium text-fg">
          <MessageCircleQuestion size={16} className="mt-0.5 shrink-0 text-select-text" aria-hidden />
          {question}
        </legend>
        <div className="grid gap-1.5">
          {[...options, ...(allowOther ? ["__other"] : [])].map((o, i) => (
            <motion.label key={o} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: reduce ? 0 : 0.05 + i * 0.04 }} whileTap={reduce ? undefined : { scale: 0.98 }} className={`relative isolate flex cursor-pointer items-center gap-2.5 rounded-[12px] px-3 py-2 text-[13px] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--select)] transition-colors ${choice === o ? "text-select-text" : "bg-subtle text-fg hover:bg-track"}`}>
              {choice === o && <motion.span layoutId={`${name}-sel`} transition={reduce ? { duration: 0 } : spring} className="absolute inset-0 -z-10 rounded-[12px] bg-select-soft" />}
              <input type="radio" name={name} value={o} checked={choice === o} onChange={() => setChoice(o)} className="size-3.5 accent-[var(--select)] focus:outline-none" />
              {o === "__other" ? (
                <input type="text" value={other} onChange={(e) => { setOther(e.target.value); setChoice("__other"); }} placeholder="Something else" aria-label="Something else" className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-fg-subtle" />
              ) : o}
            </motion.label>
          ))}
        </div>
      </fieldset>
      <div className="mt-3 flex justify-end gap-2">
        {onSkip && <motion.button type="button" whileTap={reduce ? undefined : { scale: 0.97 }} onClick={onSkip} className={`rounded-full px-3 py-1.5 text-[13px] text-fg-muted transition-colors hover:bg-subtle ${ring}`}>Skip</motion.button>}
        <motion.button type="submit" disabled={!answer} whileTap={reduce ? undefined : { scale: 0.97 }} className={`rounded-full bg-[image:var(--grad-primary)] px-4 py-1.5 text-[13px] font-medium text-[var(--inverse-fg)] shadow-[var(--shadow-btn-primary)] transition-opacity disabled:opacity-40 ${ring}`}>Send</motion.button>
      </div>
    </motion.form>
  );
}
