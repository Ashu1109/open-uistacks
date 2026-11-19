"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Menu, X } from "lucide-react";
import { SidebarNav, type NavSection } from "../ui/sidebar-nav";

/* App shell: the frame every template sits in. An inset sidebar, a top bar with the page title and actions, and a scrolling content area; when its container is narrower than 768px the sidebar becomes a drawer. It fills its parent, so give the parent a height (100dvh in an app). */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface AppShellProps {
  /** Product name and mark at the top of the sidebar. */
  product: { name: string; mark?: ReactNode };
  sections: NavSection[];
  activeId?: string;
  defaultActiveId?: string;
  onNavigate?: (id: string) => void;
  title: ReactNode;
  /** Under the title, such as a date range or breadcrumb. */
  subtitle?: ReactNode;
  /** Controls on the right of the top bar. */
  actions?: ReactNode;
  /** Pinned under the navigation, such as the signed-in user. */
  sidebarFooter?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function AppShell({
  product,
  sections,
  activeId: activeProp,
  defaultActiveId,
  onNavigate,
  title,
  subtitle,
  actions,
  sidebarFooter,
  children,
  className = "",
}: AppShellProps) {
  const reduce = useReduce();
  const [inner, setInner] = useState(defaultActiveId ?? sections[0]?.items[0]?.id);
  const active = activeProp ?? inner;
  const [drawer, setDrawer] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  const navigate = (id: string) => {
    if (activeProp === undefined) setInner(id);
    onNavigate?.(id);
    setDrawer(false);
  };

  const closeDrawer = () => {
    setDrawer(false);
    menuButton.current?.focus();
  };

  useEffect(() => {
    if (!drawer) return;
    closeButton.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setDrawer(false);
      menuButton.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawer]);

  const sidebar = (
    <div className="flex h-full w-60 flex-col gap-2">
      <div className="flex items-center gap-2.5 px-3 pb-1 pt-2">
        {product.mark}
        <span className="truncate text-[15px] font-semibold text-fg">{product.name}</span>
      </div>
      <SidebarNav sections={sections} activeId={active} onActiveChange={navigate} label={`${product.name} navigation`} className="min-h-0 flex-1" />
      {sidebarFooter}
    </div>
  );

  return (
    <div className={`@container relative flex h-full min-h-0 w-full overflow-hidden bg-bg text-fg ${className}`}>
      <div className="hidden h-full shrink-0 p-2 @[768px]:flex">{sidebar}</div>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center gap-3 border-b border-track px-4 py-3 @[768px]:px-6">
          <button
            ref={menuButton}
            type="button"
            aria-label="Open navigation"
            aria-expanded={drawer}
            onClick={() => setDrawer(true)}
            className={`grid size-8 shrink-0 place-items-center rounded-full text-fg-muted hover:bg-subtle hover:text-fg @[768px]:hidden ${ring}`}
          >
            <Menu size={18} aria-hidden />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[17px] font-semibold leading-6 text-fg">{title}</h1>
            {subtitle && <p className="truncate text-[13px] leading-5 text-fg-muted">{subtitle}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto p-4 @[768px]:p-6">{children}</main>
      </div>
      <AnimatePresence>
        {drawer && (
          <div className="absolute inset-0 z-50 @[768px]:hidden">
            <motion.div
              aria-hidden
              onClick={closeDrawer}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/30"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={`${product.name} navigation`}
              initial={reduce ? { opacity: 0 } : { x: "-100%" }}
              animate={reduce ? { opacity: 1 } : { x: 0 }}
              exit={reduce ? { opacity: 0 } : { x: "-100%" }}
              transition={{ type: "spring", stiffness: 500, damping: 40 }}
              className="absolute inset-y-0 left-0 flex bg-bg p-2 shadow-[var(--shadow-overlay)]"
            >
              {sidebar}
              <button
                ref={closeButton}
                type="button"
                aria-label="Close navigation"
                onClick={closeDrawer}
                className={`absolute right-3 top-3 grid size-8 place-items-center rounded-full text-fg-muted hover:bg-subtle hover:text-fg ${ring}`}
              >
                <X size={16} aria-hidden />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
