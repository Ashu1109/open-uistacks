"use client";

import { useLayoutEffect, useRef, useState, useSyncExternalStore, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { ArrowUp, Square } from "lucide-react";

/* Chat composer: a field that grows with its text, Enter sends, Shift+Enter breaks the line, and the send button turns into stop while a reply streams. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface PromptInputProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Gets the trimmed text on Enter or the send button; the field then clears (through onValueChange when controlled). */
  onSubmit?: (text: string) => void;
  /** A reply is streaming: the send button becomes a stop button. */
  busy?: boolean;
  onStop?: () => void;
  placeholder?: string;
  /** Rows the field grows to before it scrolls. */
  maxRows?: number;
  /** Controls at the start of the bottom bar, such as an attach button. */
  leading?: ReactNode;
  /** Controls just before the send button, such as a model picker. */
  trailing?: ReactNode;
  /** Shown above the field, such as attachment chips. */
  header?: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function PromptInput({
  value: valueProp,
  defaultValue = "",
  onValueChange,
  onSubmit,
  busy = false,
  onStop,
  placeholder = "Ask anything",
  maxRows = 8,
  leading,
  trailing,
  header,
  disabled = false,
  className = "",
}: PromptInputProps) {
  const reduce = useReduce();
  const field = useRef<HTMLTextAreaElement>(null);
  const [inner, setInner] = useState(defaultValue);
  const value = valueProp ?? inner;
  const canSend = !busy && !disabled && value.trim().length > 0;

  useLayoutEffect(() => {
    const el = field.current;
    if (!el) return;
    el.style.height = "auto";
    const style = getComputedStyle(el);
    const line = parseFloat(style.lineHeight) || 24;
    const pad = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    el.style.height = `${Math.min(el.scrollHeight, line * maxRows + pad)}px`;
  }, [value, maxRows]);

  const change = (next: string) => {
    if (valueProp === undefined) setInner(next);
    onValueChange?.(next);
  };

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (!canSend) return;
    onSubmit?.(value.trim());
    change("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;
    e.preventDefault();
    submit();
  };

  return (
    <form
      onSubmit={submit}
      onPointerDown={(e) => {
        if (e.target !== e.currentTarget) return;
        e.preventDefault();
        field.current?.focus();
      }}
      className={`flex w-full cursor-text flex-col rounded-[24px] bg-surface p-2 shadow-[var(--shadow-card)] transition-shadow focus-within:shadow-[var(--shadow-card),0_0_0_4px_var(--select-soft)] ${disabled ? "opacity-60" : ""} ${className}`}
    >
      {header && <div className="pb-1">{header}</div>}
      <textarea
        ref={field}
        rows={1}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(e) => change(e.target.value)}
        onKeyDown={onKeyDown}
        className="block w-full resize-none bg-transparent px-2.5 py-1.5 text-[15px] leading-6 text-fg outline-none placeholder:text-fg-subtle"
      />
      <div className="flex items-center gap-1 pt-2">
        {leading && <div className="flex items-center gap-1">{leading}</div>}
        <div className="ml-auto flex items-center gap-1.5">
          {trailing}
          <SendButton busy={busy} canSend={canSend} onStop={onStop} reduce={reduce} />
        </div>
      </div>
    </form>
  );
}

function SendButton({ busy, canSend, onStop, reduce }: { busy: boolean; canSend: boolean; onStop?: () => void; reduce: boolean }) {
  const pop: HTMLMotionProps<"span"> = reduce
    ? {}
    : { initial: { scale: 0.4, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.4, opacity: 0 }, transition: { type: "spring", stiffness: 600, damping: 32 } };
  return (
    <motion.button
      type={busy ? "button" : "submit"}
      onClick={busy ? onStop : undefined}
      disabled={busy ? !onStop : !canSend}
      aria-label={busy ? "Stop" : "Send"}
      whileTap={reduce ? undefined : { scale: 0.92 }}
      className={`grid size-8 shrink-0 place-items-center rounded-full bg-[image:var(--grad-primary)] text-[var(--inverse-fg)] shadow-[var(--shadow-btn-primary)] transition-opacity disabled:opacity-30 ${ring}`}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {busy ? (
          <motion.span key="stop" className="grid place-items-center" {...pop}>
            <Square size={11} fill="currentColor" strokeWidth={0} aria-hidden />
          </motion.span>
        ) : (
          <motion.span key="send" className="grid place-items-center" {...pop}>
            <ArrowUp size={16} strokeWidth={2.25} aria-hidden />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export interface PromptInputActionProps {
  /** Read by screen readers and shown as the tooltip. */
  label: string;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

/** A round icon button sized for the composer's bottom bar. */
export function PromptInputAction({ label, children, onClick, disabled = false }: PromptInputActionProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`grid size-8 place-items-center rounded-full text-fg-muted transition-colors hover:bg-subtle hover:text-fg disabled:opacity-40 ${ring}`}
    >
      {children}
    </button>
  );
}
