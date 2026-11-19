"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check } from "lucide-react";
import { useControlled } from "./dialog";

/* Form wizard: a multi-step flow with a numbered stepper, animated step content, Back/Next/Finish buttons and per-step validation that blocks moving forward with an announced error. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

/** Keeps a step index inside 0..count-1. */
export function clampStep(index: number, count: number): number {
  return Math.min(Math.max(index, 0), Math.max(count - 1, 0));
}

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  content: ReactNode;
  /** Runs before moving forward; return a message to stay on this step. */
  validate?: () => string | null | undefined;
}

export interface FormWizardProps {
  steps: WizardStep[];
  step?: number;
  defaultStep?: number;
  onStepChange?: (step: number) => void;
  /** Runs when Finish passes validation on the last step. */
  onComplete?: () => void;
  finishLabel?: string;
  className?: string;
}

export function FormWizard({ steps, step: stepProp, defaultStep = 0, onStepChange, onComplete, finishLabel = "Finish", className = "" }: FormWizardProps) {
  const reduce = useReduce();
  const [raw, setStep] = useControlled(stepProp, defaultStep, onStepChange);
  const step = clampStep(raw, steps.length);
  const current = steps[step];
  const [error, setError] = useState<string | null>(null);
  const direction = useRef(1);
  const heading = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);
  const last = step === steps.length - 1;

  useEffect(() => {
    if (moved.current) heading.current?.focus();
    moved.current = true;
  }, [step]);

  const goTo = (next: number) => {
    direction.current = next > step ? 1 : -1;
    setError(null);
    setStep(clampStep(next, steps.length));
  };

  const advance = () => {
    const problem = current?.validate?.();
    if (problem) return setError(problem);
    if (last) return onComplete?.();
    goTo(step + 1);
  };

  const shift = reduce ? 0 : 24 * direction.current;
  return (
    <div className={`grid gap-6 ${className}`}>
      <ol aria-label="Progress" className="flex items-start gap-2">
        {steps.map((s, i) => {
          const done = i < step;
          const body = (
            <>
              <span className={`grid size-7 shrink-0 place-items-center rounded-full text-[13px] font-semibold transition-colors ${done ? "bg-success text-white" : i === step ? "bg-select text-white" : "bg-subtle text-fg-muted"}`}>
                {done ? <Check size={14} strokeWidth={3} aria-hidden /> : i + 1}
              </span>
              <span className="hidden min-w-0 text-left sm:block">
                <span className={`block truncate text-sm font-medium ${i === step ? "text-fg" : "text-fg-muted"}`}>{s.title}</span>
              </span>
            </>
          );
          return (
            <li key={s.id} aria-current={i === step ? "step" : undefined} className="flex min-w-0 flex-1 items-center gap-2">
              {done ? (
                <button type="button" aria-label={`Go back to step ${i + 1}: ${s.title}`} onClick={() => goTo(i)} className={`flex min-w-0 items-center gap-2 rounded-full ${ring}`}>{body}</button>
              ) : (
                <span className="flex min-w-0 items-center gap-2">{body}</span>
              )}
              {i < steps.length - 1 && <span aria-hidden className={`h-px flex-1 ${done ? "bg-success" : "bg-track"}`} />}
            </li>
          );
        })}
      </ol>
      <div className="min-h-[8rem] overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          {current && (
            <motion.div
              key={current.id}
              role="group"
              aria-labelledby={`wizard-${current.id}`}
              initial={{ opacity: 0, x: shift }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -shift }}
              transition={{ type: "spring", stiffness: 500, damping: 34 }}
            >
              <h3 id={`wizard-${current.id}`} ref={heading} tabIndex={-1} className="text-base font-semibold text-fg outline-none">{current.title}</h3>
              {current.description && <p className="mt-1 text-sm text-fg-muted">{current.description}</p>}
              <div className="mt-4">{current.content}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <p role="alert" className="min-h-5 text-sm text-danger-text">{error}</p>
      <div className="flex items-center justify-between gap-3 border-t border-track pt-4">
        <span aria-live="polite" className="text-sm text-fg-muted">Step {step + 1} of {steps.length}</span>
        <div className="flex gap-2">
          <button type="button" disabled={step === 0} onClick={() => goTo(step - 1)} className={`h-9 rounded-full px-4 text-sm font-medium text-fg shadow-[var(--shadow-btn-secondary)] disabled:opacity-40 ${ring}`}>Back</button>
          <button type="button" onClick={advance} className={`h-9 rounded-full bg-[image:var(--grad-primary)] px-4 text-sm font-medium text-[var(--inverse-fg)] shadow-[var(--shadow-btn-primary)] ${ring}`}>{last ? finishLabel : "Next"}</button>
        </div>
      </div>
    </div>
  );
}
