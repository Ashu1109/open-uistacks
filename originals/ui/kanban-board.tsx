"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "motion/react";
import { BoardCard, type BoardCardProps } from "./board-card";

/* Kanban board: columns of cards you can drag with a pointer, or move by keyboard (Space to pick up, arrows to move, Space to drop, Escape to cancel), with every step announced in a live region. */

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

const GLIDE = { type: "spring", stiffness: 420, damping: 34 } as const;
const SETTLE = { type: "spring", stiffness: 520, damping: 24 } as const;
const LIFTED = { scale: 1.04, boxShadow: "0 16px 28px -12px rgba(0,0,0,0.35)", zIndex: 20 };
const RESTING = { scale: 1, boxShadow: "0 0 0 0 rgba(0,0,0,0)", zIndex: 0 };

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface KanbanCard extends Omit<BoardCardProps, "onOpen" | "className"> {
  id: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  cards: KanbanCard[];
}

export interface KanbanBoardProps {
  columns?: KanbanColumn[];
  defaultColumns?: KanbanColumn[];
  onColumnsChange?: (columns: KanbanColumn[]) => void;
  className?: string;
}

export interface CardPosition {
  columnId: string;
  index: number;
}

export function findCard(columns: KanbanColumn[], cardId: string): CardPosition | null {
  for (const col of columns) {
    const index = col.cards.findIndex((c) => c.id === cardId);
    if (index >= 0) return { columnId: col.id, index };
  }
  return null;
}

/** Returns new columns with the card removed and inserted at `index` (clamped) in the target column; unknown ids return the input. */
export function moveCard(columns: KanbanColumn[], cardId: string, toColumnId: string, index: number): KanbanColumn[] {
  const from = findCard(columns, cardId);
  const target = columns.find((c) => c.id === toColumnId);
  if (!from || !target) return columns;
  const card = columns.find((c) => c.id === from.columnId)!.cards[from.index];
  const without = columns.map((c) => (c.id === from.columnId ? { ...c, cards: c.cards.filter((x) => x.id !== cardId) } : c));
  return without.map((c) => {
    if (c.id !== toColumnId) return c;
    const at = Math.min(Math.max(index, 0), c.cards.length);
    return { ...c, cards: [...c.cards.slice(0, at), card, ...c.cards.slice(at)] };
  });
}

export type MoveDirection = "left" | "right" | "up" | "down";

/** Where a keyboard step takes a card, or null at an edge. Horizontal steps keep the row, clamped to the neighbour's length. */
export function stepPosition(columns: KanbanColumn[], pos: CardPosition, dir: MoveDirection): CardPosition | null {
  const col = columns.findIndex((c) => c.id === pos.columnId);
  if (dir === "up") return pos.index > 0 ? { ...pos, index: pos.index - 1 } : null;
  if (dir === "down") return pos.index < columns[col].cards.length - 1 ? { ...pos, index: pos.index + 1 } : null;
  const next = columns[col + (dir === "left" ? -1 : 1)];
  return next ? { columnId: next.id, index: Math.min(pos.index, next.cards.length) } : null;
}

const KEY_DIRECTION: Record<string, MoveDirection> = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" };

interface Held {
  id: string;
  origin: KanbanColumn[];
  via: "keyboard" | "pointer";
}

export function KanbanBoard({ columns, defaultColumns = [], onColumnsChange, className = "" }: KanbanBoardProps) {
  const reduce = useReduce();
  const [inner, setInner] = useState(defaultColumns);
  const current = columns ?? inner;
  const [held, setHeld] = useState<Held | null>(null);
  const [message, setMessage] = useState("");
  const root = useRef<HTMLDivElement>(null);

  const latest = useRef(current);
  latest.current = current;
  const commit = (next: KanbanColumn[]) => {
    latest.current = next;
    setInner(next);
    onColumnsChange?.(next);
  };
  const titleOf = (id: string) => current.flatMap((c) => c.cards).find((c) => c.id === id)?.title ?? "Card";
  const describe = (id: string, columnsNow: KanbanColumn[]) => {
    const pos = findCard(columnsNow, id)!;
    const col = columnsNow.find((c) => c.id === pos.columnId)!;
    return `${col.title}, position ${pos.index + 1} of ${col.cards.length}`;
  };

  useLayoutEffect(() => {
    if (held?.via === "keyboard") root.current?.querySelector<HTMLElement>(`[data-card-id="${held.id}"]`)?.focus();
  }, [current, held]);

  const keyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      if (!held) {
        setHeld({ id, origin: current, via: "keyboard" });
        setMessage(`Picked up ${titleOf(id)}. ${describe(id, current)}. Use arrow keys to move, Space to drop, Escape to cancel.`);
      } else {
        setHeld(null);
        setMessage(`Dropped ${titleOf(id)}. ${describe(id, current)}.`);
      }
      return;
    }
    if (!held || held.id !== id) return;
    if (e.key === "Escape") {
      e.preventDefault();
      commit(held.origin);
      setHeld(null);
      setMessage(`Move cancelled. ${titleOf(id)} returned to ${describe(id, held.origin)}.`);
      return;
    }
    const dir = KEY_DIRECTION[e.key];
    if (!dir) return;
    e.preventDefault();
    const pos = findCard(current, id);
    const to = pos && stepPosition(current, pos, dir);
    if (!to) return;
    const next = moveCard(current, id, to.columnId, to.index);
    commit(next);
    setMessage(`${titleOf(id)} moved to ${describe(id, next)}.`);
  };

  const dropTarget = (x: number, y: number, id: string): CardPosition | null => {
    if (typeof document.elementFromPoint !== "function") return null;
    const column = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-column-id]");
    if (!column) return null;
    const rects = [...column.querySelectorAll<HTMLElement>("[data-card-id]")].filter((el) => el.dataset.cardId !== id).map((el) => el.getBoundingClientRect());
    return { columnId: column.dataset.columnId!, index: rects.filter((r) => r.top + r.height / 2 < y).length };
  };

  const pointerDown = (e: React.PointerEvent<HTMLElement>, id: string) => {
    if (e.button !== 0 || held) return;
    setHeld({ id, origin: current, via: "pointer" });
  };

  // A card that changes column is re-created by React, which drops element pointer capture mid-drag, so the drag is
  // followed on window instead; the ref always holds handlers that see the latest columns.
  const drag = useRef({ move: (_e: PointerEvent) => {}, end: () => {} });
  drag.current = {
    move: (e) => {
      if (held?.via !== "pointer") return;
      const to = dropTarget(e.clientX, e.clientY, held.id);
      const pos = findCard(latest.current, held.id);
      if (to && pos && (to.columnId !== pos.columnId || to.index !== pos.index)) commit(moveCard(latest.current, held.id, to.columnId, to.index));
    },
    end: () => {
      if (held?.via !== "pointer") return;
      setHeld(null);
      setMessage(`Dropped ${titleOf(held.id)}. ${describe(held.id, latest.current)}.`);
    },
  };
  const dragging = held?.via === "pointer";
  useEffect(() => {
    if (!dragging) return;
    const move = (e: PointerEvent) => drag.current.move(e);
    const end = () => drag.current.end();
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, [dragging]);

  return (
    <div ref={root} className={`relative flex gap-4 overflow-x-auto pb-2 ${dragging ? "select-none" : ""} ${className}`}>
      {current.map((col, ci) => (
        <motion.section key={col.id} {...enter(ci, reduce)} data-column-id={col.id} aria-label={`${col.title}, ${col.cards.length} cards`} className="flex w-[280px] shrink-0 flex-col gap-2.5 rounded-[18px] bg-subtle p-2.5">
          <h4 className="flex items-center justify-between px-1.5 pt-1 text-sm font-medium text-fg">
            {col.title}
            <span className="text-xs tabular-nums text-fg-subtle">{col.cards.length}</span>
          </h4>
          <ul className="grid min-h-12 content-start gap-2">
            {col.cards.map((card) => {
              const isHeld = held?.id === card.id;
              return (
                <motion.li
                  key={card.id}
                  layout={!reduce}
                  layoutId={reduce ? undefined : card.id}
                  animate={reduce ? undefined : isHeld ? LIFTED : RESTING}
                  transition={{ layout: GLIDE, default: isHeld ? GLIDE : SETTLE }}
                  className="relative rounded-[14px]"
                >
                  <div
                    role="button"
                    tabIndex={0}
                    data-card-id={card.id}
                    aria-pressed={isHeld}
                    aria-roledescription="draggable card"
                    aria-label={card.title}
                    onKeyDown={(e) => keyDown(e, card.id)}
                    onPointerDown={(e) => pointerDown(e, card.id)}
                    className={`touch-none rounded-[14px] ${isHeld ? "cursor-grabbing opacity-90 ring-2 ring-[var(--select)]" : "cursor-grab"} ${ring}`}
                  >
                    <BoardCard {...card} />
                  </div>
                </motion.li>
              );
            })}
          </ul>
        </motion.section>
      ))}
      <div aria-live="assertive" role="status" className="sr-only">{message}</div>
    </div>
  );
}
