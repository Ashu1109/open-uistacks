"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { useReducedMotion } from "motion/react";

/* Text scramble: letters resolve left to right out of random glyphs on mount, on text change and on hover; the real text stays in a visually hidden copy and the scrambled one is hidden from screen readers. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

export const DEFAULT_CHARSET = "!<>-_\\/[]{}=+*^?#abcdefghijklmnopqrstuvwxyz";

/** The text at `progress` 0..1: the first share of characters are final, the rest random; whitespace is kept. */
export function scrambleFrame(text: string, progress: number, charset = DEFAULT_CHARSET, random: () => number = Math.random): string {
  const chars = [...text];
  const settled = Math.floor(Math.min(Math.max(progress, 0), 1) * chars.length);
  return chars.map((ch, i) => (i < settled || /\s/.test(ch) ? ch : (charset[Math.floor(random() * charset.length)] ?? ch))).join("");
}

export interface TextScrambleProps {
  text: string;
  /** Milliseconds from fully scrambled to settled. */
  duration?: number;
  /** Play when the element mounts or the text changes. */
  playOnMount?: boolean;
  /** Replay when hovered. */
  playOnHover?: boolean;
  charset?: string;
  className?: string;
}

export function TextScramble({ text, duration = 900, playOnMount = true, playOnHover = true, charset = DEFAULT_CHARSET, className = "" }: TextScrambleProps) {
  const reduce = useReduce();
  const visible = useRef<HTMLSpanElement>(null);
  const raf = useRef(0);

  const play = () => {
    cancelAnimationFrame(raf.current);
    if (reduce || typeof requestAnimationFrame === "undefined") {
      if (visible.current) visible.current.textContent = text;
      return;
    }
    const start = performance.now();
    const step = (now: number) => {
      const progress = (now - start) / duration;
      if (visible.current) visible.current.textContent = scrambleFrame(text, progress, charset);
      if (progress < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    if (playOnMount) play();
    else if (visible.current) visible.current.textContent = text;
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, duration, playOnMount, reduce]);

  return (
    <span className={className} onPointerEnter={playOnHover ? play : undefined}>
      <span className="sr-only">{text}</span>
      <span ref={visible} aria-hidden>{text}</span>
    </span>
  );
}
