"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Leaving, gone } from "./chart-utils";
import { formatRelativeTime } from "./activity-feed";

/* Comment thread: nested comments with relative timestamps, inline replies and a composer; replies indent under their parent. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const SPRING = { type: "spring", stiffness: 480, damping: 36 } as const;

/** Entrance props: rise and fade in, staggered by index; reduced motion only fades. */
const enter = (i: number, reduce: boolean) =>
  reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.15 } }
    : { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, transition: { ...SPRING, delay: Math.min(i, 10) * 0.04 } };

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface ThreadComment {
  id: string;
  author: string;
  body: string;
  at: Date | number;
  replies?: ThreadComment[];
}

export interface CommentThreadProps {
  comments: ThreadComment[];
  /** Called with the text and the id of the comment replied to, or null for a top-level comment. */
  onSubmit?: (body: string, parentId: string | null) => void;
  now?: Date | number;
  className?: string;
}

export function countComments(comments: ThreadComment[]): number {
  return comments.reduce((n, c) => n + 1 + countComments(c.replies ?? []), 0);
}

function Composer({ label, onSubmit, onCancel, autoFocus }: { label: string; onSubmit: (body: string) => void; onCancel?: () => void; autoFocus?: boolean }) {
  const reduce = useReduce();
  const [text, setText] = useState("");
  const tap = reduce ? undefined : { scale: 0.97 };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    onSubmit(body);
    setText("");
  };
  return (
    <form onSubmit={submit} className="grid gap-2">
      <textarea
        aria-label={label}
        value={text}
        autoFocus={autoFocus}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        placeholder={label}
        className={`w-full resize-none rounded-[12px] bg-surface px-3 py-2 text-sm text-fg shadow-[var(--shadow-card)] placeholder:text-fg-subtle ${ring}`}
      />
      <div className="flex justify-end gap-2">
        {onCancel && (
          <motion.button type="button" whileTap={tap} onClick={onCancel} className={`h-8 rounded-[10px] px-3 text-sm text-fg-muted transition-colors hover:text-fg ${ring}`}>
            Cancel
          </motion.button>
        )}
        <motion.button type="submit" whileTap={text.trim() ? tap : undefined} disabled={!text.trim()} className={`h-8 rounded-[10px] bg-[image:var(--grad-primary)] px-3.5 text-sm font-medium text-[var(--inverse-fg)] shadow-[var(--shadow-btn-primary)] disabled:opacity-40 ${ring}`}>
          Send
        </motion.button>
      </div>
    </form>
  );
}

function Item({ comment, depth, index, now, onSubmit }: { comment: ThreadComment; depth: number; index: number; now?: Date | number; onSubmit?: CommentThreadProps["onSubmit"] }) {
  const reduce = useReduce();
  const [replying, setReplying] = useState(false);
  return (
    <motion.li {...enter(index, reduce)} className="grid gap-2">
      <article aria-label={`Comment by ${comment.author}`} className="flex gap-3">
        <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-select-soft text-xs font-medium text-select-text">
          {comment.author.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-5">
            <span className="font-medium text-fg">{comment.author}</span>{" "}
            <time dateTime={new Date(comment.at).toISOString()} className="text-xs text-fg-subtle">{formatRelativeTime(comment.at, now)}</time>
          </p>
          <p className="whitespace-pre-wrap text-sm leading-5 text-fg-muted">{comment.body}</p>
          {onSubmit && !replying && (
            <motion.button type="button" whileTap={reduce ? undefined : { scale: 0.95 }} onClick={() => setReplying(true)} aria-label={`Reply to ${comment.author}`} className={`mt-1 rounded text-xs font-medium text-fg-muted transition-colors hover:text-fg ${ring}`}>
              Reply
            </motion.button>
          )}
          <AnimatePresence>
          {onSubmit && replying && (
            <Leaving key="reply">{(out) => (
            <motion.div
              {...gone(out)}
              initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, height: "auto" }}
              exit={reduce ? { opacity: 0, transition: { duration: 0.1 } } : { opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0, marginTop: 0, transition: { duration: 0.18, ease: "easeIn" } }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="-mx-1 -mb-1 mt-1 overflow-hidden px-1 pb-1 pt-1"
            >
              <Composer autoFocus label={`Reply to ${comment.author}`} onCancel={() => setReplying(false)} onSubmit={(body) => { onSubmit(body, comment.id); setReplying(false); }} />
            </motion.div>
            )}</Leaving>
          )}
          </AnimatePresence>
        </div>
      </article>
      {comment.replies && comment.replies.length > 0 && (
        <ul className={`grid gap-4 border-l border-track pl-4 ${depth < 3 ? "ml-4" : "ml-0"}`}>
          {comment.replies.map((r, i) => <Item key={r.id} comment={r} depth={depth + 1} index={i} now={now} onSubmit={onSubmit} />)}
        </ul>
      )}
    </motion.li>
  );
}

export function CommentThread({ comments, onSubmit, now, className = "" }: CommentThreadProps) {
  return (
    <section aria-label={`Comments (${countComments(comments)})`} className={`grid gap-4 ${className}`}>
      <ul className="grid gap-5">
        {comments.map((c, i) => <Item key={c.id} comment={c} depth={0} index={i} now={now} onSubmit={onSubmit} />)}
      </ul>
      {onSubmit && <Composer label="Add a comment" onSubmit={(body) => onSubmit(body, null)} />}
    </section>
  );
}
