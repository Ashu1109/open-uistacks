"use client";

import { useId, useSyncExternalStore, type KeyboardEvent, type ReactElement } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { ModalFrame, cloneTrigger, useControlled } from "./dialog";

/* Lightbox: a full-screen modal image viewer with previous/next buttons, arrow-key paging, a counter and captions; it traps focus, closes on Escape or a backdrop click and returns focus to the trigger. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/60";
const chrome = "grid size-10 place-items-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/70";

/** Wraps `index` into 0..count-1 so paging past either end loops. */
export function wrapIndex(index: number, count: number): number {
  return count === 0 ? 0 : ((index % count) + count) % count;
}

export interface LightboxImage {
  src: string;
  alt: string;
  caption?: string;
}

export interface LightboxProps {
  images: LightboxImage[];
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  /** An element (usually a thumbnail button) that opens the viewer when clicked. */
  trigger?: ReactElement;
  label?: string;
}

export function Lightbox({ images, open, defaultOpen, onOpenChange, index: indexProp, defaultIndex = 0, onIndexChange, trigger, label = "Image viewer" }: LightboxProps) {
  const id = useId();
  const reduce = useReduce();
  const [isOpen, setOpen] = useControlled(open, defaultOpen ?? false, onOpenChange);
  const [rawIndex, setIndex] = useControlled(indexProp, defaultIndex, onIndexChange);
  const index = wrapIndex(rawIndex, images.length);
  const image = images[index];
  const many = images.length > 1;
  const go = (step: number) => setIndex(wrapIndex(index + step, images.length));

  const onKeyDown = (e: KeyboardEvent) => {
    if (!many) return;
    if (e.key === "ArrowRight") go(1);
    else if (e.key === "ArrowLeft") go(-1);
    else return;
    e.preventDefault();
  };

  return (
    <>
      {trigger && cloneTrigger(trigger, { onClick: () => setOpen(true), "aria-haspopup": "dialog", "aria-expanded": isOpen })}
      <ModalFrame open={isOpen} onClose={() => setOpen(false)} label={label} className="relative flex h-full w-full flex-col items-center justify-center p-4 sm:p-10" onKeyDown={onKeyDown}>
        {image && (
          <>
            <figure className="flex min-h-0 max-w-full flex-col items-center gap-3">
              <AnimatePresence mode="wait" initial={false}>
                <motion.img
                  key={image.src}
                  src={image.src}
                  alt={image.alt}
                  initial={{ opacity: 0, scale: reduce ? 1 : 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.14 }}
                  className="max-h-[78vh] max-w-full rounded-[16px] object-contain shadow-[var(--shadow-overlay)]"
                />
              </AnimatePresence>
              {image.caption && <figcaption id={`${id}-caption`} className="max-w-prose text-center text-sm text-white/90">{image.caption}</figcaption>}
            </figure>
            <div className="absolute left-4 top-4 rounded-full bg-black/50 px-3 py-1 text-sm tabular-nums text-white backdrop-blur" aria-live="polite">
              {index + 1} / {images.length}
            </div>
            {many && (
              <>
                <button type="button" aria-label="Previous image" onClick={() => go(-1)} className={`absolute left-3 top-1/2 -translate-y-1/2 ${chrome} ${ring}`}>
                  <ChevronLeft size={20} strokeWidth={2} aria-hidden />
                </button>
                <button type="button" aria-label="Next image" onClick={() => go(1)} className={`absolute right-3 top-1/2 -translate-y-1/2 ${chrome} ${ring}`}>
                  <ChevronRight size={20} strokeWidth={2} aria-hidden />
                </button>
              </>
            )}
          </>
        )}
        <button type="button" aria-label="Close" onClick={() => setOpen(false)} className={`absolute right-4 top-4 ${chrome} ${ring}`}>
          <X size={18} strokeWidth={2} aria-hidden />
        </button>
      </ModalFrame>
    </>
  );
}
