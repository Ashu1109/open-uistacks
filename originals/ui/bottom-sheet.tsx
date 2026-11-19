"use client";

import { useId, type ReactElement, type ReactNode } from "react";
import { motion, useDragControls } from "motion/react";
import { ModalFrame, cloneTrigger, useControlled } from "./dialog";

/* Bottom sheet: a modal panel that slides up from the screen edge and can be dragged down by its handle to dismiss; it also closes on Escape or a backdrop click and returns focus to the trigger. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

/** True when a drag released at `offsetY` pixels down (or flicked faster than `velocity`) should close the sheet. */
export function shouldDismiss(offsetY: number, velocityY: number, distance = 120, velocity = 500): boolean {
  return offsetY > distance || velocityY > velocity;
}

export interface BottomSheetProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** An element (usually a button) that opens the sheet when clicked. */
  trigger?: ReactElement;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function BottomSheet({ open, defaultOpen, onOpenChange, trigger, title, description, children, className = "" }: BottomSheetProps) {
  const id = useId();
  const controls = useDragControls();
  const [isOpen, setOpen] = useControlled(open, defaultOpen ?? false, onOpenChange);
  return (
    <>
      {trigger && cloneTrigger(trigger, { onClick: () => setOpen(true), "aria-haspopup": "dialog", "aria-expanded": isOpen })}
      <ModalFrame
        open={isOpen}
        onClose={() => setOpen(false)}
        placement="bottom"
        labelledBy={`${id}-title`}
        describedBy={description ? `${id}-description` : undefined}
        className={`flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-[24px] bg-surface shadow-[var(--shadow-overlay)] dark:bg-raised ${className}`}
        panelProps={{
          drag: "y",
          dragControls: controls,
          dragListener: false,
          dragConstraints: { top: 0, bottom: 0 },
          dragElastic: { top: 0, bottom: 0.6 },
          onDragEnd: (_, info) => shouldDismiss(info.offset.y, info.velocity.y) && setOpen(false),
        }}
      >
        <div onPointerDown={(e) => controls.start(e)} className="flex shrink-0 cursor-grab touch-none justify-center pb-2 pt-3 active:cursor-grabbing">
          <motion.span aria-hidden className="h-1.5 w-10 rounded-full bg-track-strong" whileHover={{ width: 48 }} whileTap={{ width: 56, scaleY: 1.2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
        </div>
        <div className="shrink-0 px-5 pb-3">
          <h2 id={`${id}-title`} tabIndex={-1} data-autofocus className="text-base font-semibold text-fg outline-none">{title}</h2>
          {description && <p id={`${id}-description`} className="mt-1 text-sm leading-5 text-fg-muted">{description}</p>}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 text-sm text-fg">{children}</div>
        <button type="button" onClick={() => setOpen(false)} className={`sr-only focus:not-sr-only focus:m-3 focus:rounded-full focus:bg-subtle focus:px-3 focus:py-1.5 focus:text-sm ${ring}`}>
          Close sheet
        </button>
      </ModalFrame>
    </>
  );
}
