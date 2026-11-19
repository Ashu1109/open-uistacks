"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { MenuItems, placeMenu, type MenuEntry } from "./dropdown-menu";

/* Context menu: wraps an area so a right click, long press, the context-menu key or Shift+F10 opens a WAI-ARIA menu at the pointer, flipped to stay inside the viewport and closed by Escape, outside clicks or scrolling. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";
const LONG_PRESS_MS = 500;

export interface ContextMenuProps {
  items: MenuEntry[];
  /** The area that listens for the context gesture. */
  children: ReactNode;
  /** Names the menu and the area for screen readers. */
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function ContextMenu({ items, children, label = "Context menu", disabled, className = "" }: ContextMenuProps) {
  const reduce = useReduce();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const area = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const pressTimer = useRef(0);

  const openAt = (x: number, y: number) => {
    if (!disabled) setAnchor({ x, y });
  };
  const close = (refocus: boolean) => {
    setAnchor(null);
    if (refocus) area.current?.focus();
  };

  useLayoutEffect(() => {
    if (!anchor) return;
    const box = menu.current;
    setPosition(placeMenu(anchor.x, anchor.y, box?.offsetWidth ?? 0, box?.offsetHeight ?? 0, window.innerWidth, window.innerHeight));
  }, [anchor]);

  useEffect(() => {
    if (!anchor) return;
    const outside = (e: PointerEvent) => {
      if (!menu.current?.contains(e.target as Node)) setAnchor(null);
    };
    const dismiss = () => setAnchor(null);
    document.addEventListener("pointerdown", outside);
    window.addEventListener("scroll", dismiss, true);
    window.addEventListener("resize", dismiss);
    return () => {
      document.removeEventListener("pointerdown", outside);
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("resize", dismiss);
    };
  }, [anchor]);

  const onContextMenu = (e: MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    openAt(e.clientX, e.clientY);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "ContextMenu" && !(e.shiftKey && e.key === "F10")) return;
    e.preventDefault();
    const rect = area.current?.getBoundingClientRect();
    openAt((rect?.left ?? 0) + 16, (rect?.top ?? 0) + 16);
  };

  const cancelPress = () => window.clearTimeout(pressTimer.current);

  return (
    <div
      ref={area}
      tabIndex={disabled ? undefined : 0}
      aria-label={label}
      aria-haspopup="menu"
      onContextMenu={onContextMenu}
      onKeyDown={onKeyDown}
      onPointerDown={(e) => {
        if (e.pointerType !== "touch") return;
        const { clientX, clientY } = e;
        pressTimer.current = window.setTimeout(() => openAt(clientX, clientY), LONG_PRESS_MS);
      }}
      onPointerUp={cancelPress}
      onPointerMove={cancelPress}
      onPointerCancel={cancelPress}
      className={`rounded-[16px] ${ring} ${className}`}
    >
      {children}
      {hydrated &&
        createPortal(
          <AnimatePresence>
            {anchor && (
              <motion.div
                ref={menu}
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 520, damping: 34 }}
                style={{ left: position.left, top: position.top, transformOrigin: "top left" }}
                className="fixed z-[80] min-w-52"
              >
                <MenuItems entries={items} label={label} onClose={close} />
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
