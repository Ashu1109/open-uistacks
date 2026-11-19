"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useControlled } from "./dialog";

/* Coachmark: a guided tour that dims the page around a target element picked by CSS selector and shows a callout beside it with step count, Back, Next and Skip; it repositions on scroll and resize, flips to fit, and Escape skips. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export type Side = "top" | "bottom" | "left" | "right";

export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

const OPPOSITE: Record<Side, Side> = { top: "bottom", bottom: "top", left: "right", right: "left" };

/** Where to put a callout of `size` around `target`: the preferred side if it fits, else the opposite or any that does, clamped inside the viewport. */
export function placeCallout(target: Box, size: { width: number; height: number }, viewport: { width: number; height: number }, preferred: Side = "bottom", gap = 12, margin = 8) {
  const fits: Record<Side, boolean> = {
    top: target.top - gap - size.height >= margin,
    bottom: target.top + target.height + gap + size.height <= viewport.height - margin,
    left: target.left - gap - size.width >= margin,
    right: target.left + target.width + gap + size.width <= viewport.width - margin,
  };
  const side = [preferred, OPPOSITE[preferred], "bottom", "top", "right", "left"].find((s) => fits[s as Side]) as Side | undefined ?? preferred;
  const centerX = target.left + target.width / 2 - size.width / 2;
  const centerY = target.top + target.height / 2 - size.height / 2;
  const raw = {
    top: { left: centerX, top: target.top - gap - size.height },
    bottom: { left: centerX, top: target.top + target.height + gap },
    left: { left: target.left - gap - size.width, top: centerY },
    right: { left: target.left + target.width + gap, top: centerY },
  }[side];
  const clamp = (v: number, max: number) => Math.max(margin, Math.min(v, max - margin));
  return { side, left: clamp(raw.left, viewport.width - size.width + margin), top: clamp(raw.top, viewport.height - size.height + margin) };
}

export interface CoachStep {
  /** CSS selector of the element to spotlight; a missing match centres the callout instead. */
  target: string;
  title: ReactNode;
  body?: ReactNode;
  placement?: Side;
}

export interface CoachmarkProps {
  steps: CoachStep[];
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  step?: number;
  defaultStep?: number;
  onStepChange?: (step: number) => void;
  /** Runs when the last step's Done is pressed. */
  onFinish?: () => void;
  /** Runs when the tour is dismissed early with Skip or Escape. */
  onSkip?: () => void;
}

const findTarget = (selector: string): Element | null => {
  try {
    return document.querySelector(selector);
  } catch {
    return null;
  }
};

export function Coachmark({ steps, open, defaultOpen, onOpenChange, step: stepProp, defaultStep = 0, onStepChange, onFinish, onSkip }: CoachmarkProps) {
  const id = useId();
  const reduce = useReduce();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  const [isOpen, setOpen] = useControlled(open, defaultOpen ?? false, onOpenChange);
  const [raw, setStep] = useControlled(stepProp, defaultStep, onStepChange);
  const step = Math.min(Math.max(raw, 0), steps.length - 1);
  const current = steps[step];
  const [box, setBox] = useState<Box | null>(null);
  const [place, setPlace] = useState({ left: 0, top: 0 });
  const card = useRef<HTMLDivElement>(null);
  const next = useRef<HTMLButtonElement>(null);
  const last = step === steps.length - 1;

  useLayoutEffect(() => {
    if (!isOpen || !current) return;
    const measure = () => {
      const el = findTarget(current.target);
      const r = el?.getBoundingClientRect();
      const found = r ? { left: r.left, top: r.top, width: r.width, height: r.height } : null;
      setBox(found);
      const size = { width: card.current?.offsetWidth || 320, height: card.current?.offsetHeight || 160 };
      const viewport = { width: window.innerWidth, height: window.innerHeight };
      const anchor = found ?? { left: viewport.width / 2, top: viewport.height / 3, width: 0, height: 0 };
      const placed = placeCallout(anchor, size, viewport, current.placement);
      setPlace({ left: found ? placed.left : (viewport.width - size.width) / 2, top: found ? placed.top : placed.top - size.height / 2 });
    };
    findTarget(current.target)?.scrollIntoView?.({ block: "nearest" });
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [isOpen, current, step]);

  useEffect(() => {
    if (!isOpen) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    return () => opener?.focus?.();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) next.current?.focus();
  }, [isOpen, step]);

  const skip = () => {
    setOpen(false);
    onSkip?.();
  };
  const advance = () => {
    if (!last) return setStep(step + 1);
    setOpen(false);
    onFinish?.();
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Escape") return;
    e.stopPropagation();
    skip();
  };

  if (!hydrated || !current) return null;
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div key="tour" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }} className="pointer-events-none fixed inset-0 z-[75]">
          {box ? (
            <div
              aria-hidden
              style={{ left: box.left - 6, top: box.top - 6, width: box.width + 12, height: box.height + 12, boxShadow: "0 0 0 9999px rgb(0 0 0 / 0.45)" }}
              className="absolute rounded-[14px] ring-2 ring-white/70 transition-[left,top,width,height] duration-200"
            />
          ) : (
            <div aria-hidden className="absolute inset-0 bg-black/45" />
          )}
          <motion.div
            ref={card}
            role="dialog"
            aria-labelledby={`${id}-title`}
            aria-describedby={current.body ? `${id}-body` : undefined}
            onKeyDown={onKeyDown}
            initial={reduce ? false : { y: 6 }}
            animate={{ y: 0 }}
            style={{ left: place.left, top: place.top }}
            className="pointer-events-auto absolute w-80 max-w-[calc(100vw-16px)] rounded-[16px] bg-surface p-4 shadow-[var(--shadow-overlay)] dark:bg-raised"
          >
            <h2 id={`${id}-title`} className="text-sm font-semibold text-fg">{current.title}</h2>
            {current.body && <p id={`${id}-body`} className="mt-1 text-sm leading-5 text-fg-muted">{current.body}</p>}
            <div className="mt-4 flex items-center gap-2">
              <span className="mr-auto text-xs tabular-nums text-fg-subtle" aria-live="polite">Step {step + 1} of {steps.length}</span>
              {!last && <button type="button" onClick={skip} className={`h-8 rounded-full px-3 text-sm text-fg-muted hover:text-fg ${ring}`}>Skip</button>}
              {step > 0 && <button type="button" onClick={() => setStep(step - 1)} className={`h-8 rounded-full px-3 text-sm font-medium text-fg shadow-[var(--shadow-btn-secondary)] ${ring}`}>Back</button>}
              <button ref={next} type="button" onClick={advance} className={`h-8 rounded-full bg-[image:var(--grad-primary)] px-3.5 text-sm font-medium text-[var(--inverse-fg)] shadow-[var(--shadow-btn-primary)] ${ring}`}>{last ? "Done" : "Next"}</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
