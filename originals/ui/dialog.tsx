"use client";

import { cloneElement, useEffect, useId, useRef, useState, useSyncExternalStore, type KeyboardEvent, type ReactElement, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { TriangleAlert, X } from "lucide-react";

/* Dialog: a modal window rendered into document.body that traps focus, locks page scroll, closes on Escape or a backdrop click and returns focus to what opened it; ModalFrame is the shared shell the sheets, palette and lightbox build on. */

const noSubscribe = () => () => {};
export function useHydrated() {
  return useSyncExternalStore(noSubscribe, () => true, () => false);
}
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useHydrated();
  return hydrated && Boolean(prefers);
}

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

/** Controlled when `value` is defined, otherwise keeps its own state; `onChange` always fires. */
export function useControlled<T>(value: T | undefined, defaultValue: T, onChange?: (next: T) => void) {
  const [inner, setInner] = useState(defaultValue);
  const current = value === undefined ? inner : value;
  const set = (next: T) => {
    if (value === undefined) setInner(next);
    onChange?.(next);
  };
  return [current, set] as const;
}

type Props = Record<string, unknown>;

/** Clones a trigger element, merging `extra` over its props and chaining any `on*` handlers it already had. */
export function cloneTrigger(trigger: ReactElement, extra: Props) {
  const own = trigger.props as Props;
  const merged: Props = { ...extra };
  for (const key of Object.keys(extra)) {
    const mine = own[key];
    const added = extra[key];
    if (key.startsWith("on") && typeof mine === "function" && typeof added === "function") {
      merged[key] = (...args: unknown[]) => {
        mine(...args);
        added(...args);
      };
    }
  }
  return cloneElement(trigger as ReactElement<Props>, merged);
}

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** Keeps Tab and Shift+Tab cycling inside `root`. */
export function trapTab(e: KeyboardEvent, root: HTMLElement | null) {
  if (e.key !== "Tab" || !root) return;
  const items = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE));
  if (items.length === 0) return e.preventDefault();
  const active = document.activeElement;
  if (e.shiftKey && (active === items[0] || active === root)) {
    e.preventDefault();
    items[items.length - 1].focus();
  } else if (!e.shiftKey && active === items[items.length - 1]) {
    e.preventDefault();
    items[0].focus();
  }
}

export type ModalPlacement = "center" | "palette" | "bottom" | "right" | "left";

type From = { opacity?: number; scale?: number; x?: string; y?: number | string };

const FROM: Record<ModalPlacement, From> = {
  center: { opacity: 0, scale: 0.96, y: 10 },
  palette: { opacity: 0, scale: 0.98, y: -8 },
  bottom: { y: "100%" },
  right: { x: "100%" },
  left: { x: "-100%" },
};

const ALIGN: Record<ModalPlacement, string> = {
  center: "items-center justify-center p-4",
  palette: "items-start justify-center px-4 pt-[12vh]",
  bottom: "items-end justify-center",
  right: "items-stretch justify-end",
  left: "items-stretch justify-start",
};

export interface ModalFrameProps {
  open: boolean;
  onClose: () => void;
  placement?: ModalPlacement;
  /** Accessible name when there is no visible title to point `labelledBy` at. */
  label?: string;
  labelledBy?: string;
  describedBy?: string;
  /** Ignore backdrop clicks, for flows that must not be dismissed by accident. */
  persistent?: boolean;
  className?: string;
  panelProps?: HTMLMotionProps<"div">;
  onKeyDown?: (e: KeyboardEvent<HTMLDivElement>) => void;
  children: ReactNode;
}

export function ModalFrame({ open, onClose, placement = "center", label, labelledBy, describedBy, persistent, className = "", panelProps, onKeyDown, children }: ModalFrameProps) {
  const reduce = useReduce();
  const hydrated = useHydrated();
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const node = panel.current;
    const target = node?.querySelector<HTMLElement>("[data-autofocus]") ?? node?.querySelector<HTMLElement>(FOCUSABLE) ?? node;
    target?.focus();
    const onEscape = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") close.current();
    };
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("keydown", onEscape);
      document.body.style.overflow = overflow;
      opener?.focus?.();
    };
  }, [open]);

  if (!hydrated) return null;
  const from: From = reduce ? { opacity: 0 } : FROM[placement];
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div key="modal" className="fixed inset-0 z-[70]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}>
          <div data-modal-backdrop aria-hidden onClick={persistent ? undefined : onClose} className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
          <div className={`pointer-events-none absolute inset-0 flex ${ALIGN[placement]}`}>
            <motion.div
              ref={panel}
              role="dialog"
              aria-modal="true"
              aria-label={labelledBy ? undefined : label}
              aria-labelledby={labelledBy}
              aria-describedby={describedBy}
              tabIndex={-1}
              {...panelProps}
              onKeyDown={(e) => {
                trapTab(e, panel.current);
                onKeyDown?.(e);
              }}
              initial={from}
              animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
              exit={from}
              transition={{ type: "spring", stiffness: 500, damping: 34 }}
              className={`pointer-events-auto outline-none ${className}`}
            >
              {children}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export interface DialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** An element (usually a button) that opens the dialog when clicked. */
  trigger?: ReactElement;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Buttons for the bottom row; wire them to close through `onOpenChange`. */
  footer?: ReactNode;
  tone?: "default" | "danger";
  persistent?: boolean;
  className?: string;
}

export function Dialog({ open, defaultOpen, onOpenChange, trigger, title, description, children, footer, tone = "default", persistent, className = "" }: DialogProps) {
  const id = useId();
  const [isOpen, setOpen] = useControlled(open, defaultOpen ?? false, onOpenChange);
  return (
    <>
      {trigger && cloneTrigger(trigger, { onClick: () => setOpen(true), "aria-haspopup": "dialog", "aria-expanded": isOpen })}
      <ModalFrame
        open={isOpen}
        onClose={() => setOpen(false)}
        labelledBy={`${id}-title`}
        describedBy={description ? `${id}-description` : undefined}
        persistent={persistent}
        className={`relative w-full max-w-md rounded-[20px] bg-surface shadow-[var(--shadow-overlay)] dark:bg-raised ${className}`}
      >
        <div className="flex items-start gap-3 p-5 pr-12">
          {tone === "danger" && (
            <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-danger-soft text-danger-text">
              <TriangleAlert size={16} strokeWidth={2} aria-hidden />
            </span>
          )}
          <div className="min-w-0">
            <h2 id={`${id}-title`} className="text-base font-semibold text-fg">{title}</h2>
            {description && <p id={`${id}-description`} className="mt-1 text-sm leading-5 text-fg-muted">{description}</p>}
          </div>
        </div>
        {children && <div className="px-5 pb-5 text-sm text-fg">{children}</div>}
        {footer && <div className="flex justify-end gap-2 border-t border-track px-5 py-3">{footer}</div>}
        <button
          type="button"
          aria-label="Close"
          onClick={() => setOpen(false)}
          className={`absolute right-3 top-3 grid size-8 place-items-center rounded-full text-fg-muted transition-colors hover:bg-subtle hover:text-fg ${ring}`}
        >
          <X size={16} strokeWidth={2} aria-hidden />
        </button>
      </ModalFrame>
    </>
  );
}
