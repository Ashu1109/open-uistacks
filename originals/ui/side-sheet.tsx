"use client";

import { useId, type ReactElement, type ReactNode } from "react";
import { X } from "lucide-react";
import { ModalFrame, cloneTrigger, useControlled } from "./dialog";

/* Side sheet: a modal panel that slides in from the left or right edge with a title, scrolling body and pinned footer; it traps focus, closes on Escape or a backdrop click and returns focus to the trigger. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface SideSheetProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** An element (usually a button) that opens the sheet when clicked. */
  trigger?: ReactElement;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  side?: "left" | "right";
  /** Tailwind max-width class for the panel. */
  width?: string;
  className?: string;
}

export function SideSheet({ open, defaultOpen, onOpenChange, trigger, title, description, children, footer, side = "right", width = "max-w-md", className = "" }: SideSheetProps) {
  const id = useId();
  const [isOpen, setOpen] = useControlled(open, defaultOpen ?? false, onOpenChange);
  return (
    <>
      {trigger && cloneTrigger(trigger, { onClick: () => setOpen(true), "aria-haspopup": "dialog", "aria-expanded": isOpen })}
      <ModalFrame
        open={isOpen}
        onClose={() => setOpen(false)}
        placement={side}
        labelledBy={`${id}-title`}
        describedBy={description ? `${id}-description` : undefined}
        className={`flex h-full w-full ${width} flex-col bg-surface shadow-[var(--shadow-overlay)] dark:bg-raised ${side === "right" ? "rounded-l-[24px]" : "rounded-r-[24px]"} ${className}`}
      >
        <div className="flex shrink-0 items-start gap-3 border-b border-track p-5">
          <div className="min-w-0 flex-1">
            <h2 id={`${id}-title`} className="text-base font-semibold text-fg">{title}</h2>
            {description && <p id={`${id}-description`} className="mt-1 text-sm leading-5 text-fg-muted">{description}</p>}
          </div>
          <button type="button" aria-label="Close" onClick={() => setOpen(false)} className={`grid size-8 shrink-0 place-items-center rounded-full text-fg-muted transition-colors hover:bg-subtle hover:text-fg ${ring}`}>
            <X size={16} strokeWidth={2} aria-hidden />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5 text-sm text-fg">{children}</div>
        {footer && <div className="flex shrink-0 justify-end gap-2 border-t border-track px-5 py-3">{footer}</div>}
      </ModalFrame>
    </>
  );
}
