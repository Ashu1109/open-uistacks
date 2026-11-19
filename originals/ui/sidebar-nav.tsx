"use client";

import { useId, useRef, useState, useSyncExternalStore, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useControlled } from "./dialog";

/* Sidebar nav: a vertical navigation rail with titled sections, collapsible groups, badges and a current-page marker; it collapses to an icon-only rail, and Up/Down/Home/End move focus between items. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface NavItem {
  id: string;
  label: string;
  icon?: ReactNode;
  /** Renders a link; without it the item is a button and `onActiveChange` is the way to react. */
  href?: string;
  badge?: string | number;
  /** Nested items make this a collapsible group. */
  children?: NavItem[];
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

/** The id of the group containing `activeId`, so it can start expanded. */
export function groupOf(sections: NavSection[], activeId: string | undefined): string | undefined {
  return sections.flatMap((s) => s.items).find((item) => item.children?.some((c) => c.id === activeId))?.id;
}

export interface SidebarNavProps {
  sections: NavSection[];
  activeId?: string;
  defaultActiveId?: string;
  onActiveChange?: (id: string) => void;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Names the navigation landmark. */
  label?: string;
  className?: string;
}

export function SidebarNav({ sections, activeId: activeProp, defaultActiveId, onActiveChange, collapsed: collapsedProp, defaultCollapsed, onCollapsedChange, label = "Sidebar", className = "" }: SidebarNavProps) {
  const id = useId();
  const reduce = useReduce();
  const [activeId, setActive] = useControlled(activeProp, defaultActiveId, onActiveChange as ((id: string | undefined) => void) | undefined);
  const [collapsed, setCollapsed] = useControlled(collapsedProp, defaultCollapsed ?? false, onCollapsedChange);
  const [expanded, setExpanded] = useState<string[]>(() => {
    const group = groupOf(sections, activeProp ?? defaultActiveId);
    return group ? [group] : [];
  });
  const nav = useRef<HTMLElement>(null);

  const onKeyDown = (e: KeyboardEvent) => {
    const items = Array.from(nav.current?.querySelectorAll<HTMLElement>("[data-nav-item]") ?? []);
    const at = items.indexOf(document.activeElement as HTMLElement);
    const target: Record<string, number> = { ArrowDown: at + 1, ArrowUp: at - 1, Home: 0, End: items.length - 1 };
    if (!(e.key in target) || items.length === 0) return;
    e.preventDefault();
    items[Math.min(Math.max(target[e.key], 0), items.length - 1)]?.focus();
  };

  const rowClass = (selected: boolean) =>
    `flex h-9 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-sm font-medium transition-colors ${collapsed ? "justify-center" : ""} ${
      selected ? "bg-select-soft text-select-text" : "text-fg-muted hover:bg-subtle hover:text-fg"
    } ${ring}`;

  const content = (item: NavItem, trailing?: ReactNode) => (
    <>
      {item.icon && <span className="grid size-5 shrink-0 place-items-center">{item.icon}</span>}
      {!collapsed && <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>}
      {!collapsed && item.badge !== undefined && <span className="rounded-full bg-subtle px-1.5 text-[11px] font-medium leading-[18px] text-fg-muted">{item.badge}</span>}
      {!collapsed && trailing}
    </>
  );

  const leaf = (item: NavItem) => {
    const selected = item.id === activeId;
    const props = {
      "data-nav-item": "",
      "aria-current": selected ? ("page" as const) : undefined,
      "aria-label": collapsed ? item.label : undefined,
      title: collapsed ? item.label : undefined,
      className: rowClass(selected),
      onClick: () => setActive(item.id),
    };
    return item.href ? <a href={item.href} {...props}>{content(item)}</a> : <button type="button" {...props}>{content(item)}</button>;
  };

  const group = (item: NavItem) => {
    const open = !collapsed && expanded.includes(item.id);
    const hasActive = item.children?.some((c) => c.id === activeId);
    return (
      <>
        <button
          type="button"
          data-nav-item=""
          aria-expanded={collapsed ? undefined : open}
          aria-controls={open ? `${id}-${item.id}` : undefined}
          aria-label={collapsed ? item.label : undefined}
          title={collapsed ? item.label : undefined}
          onClick={() => (collapsed ? setCollapsed(false) : setExpanded((list) => (list.includes(item.id) ? list.filter((g) => g !== item.id) : [...list, item.id])))}
          className={`${rowClass(false)} ${hasActive && collapsed ? "bg-select-soft text-select-text" : ""}`}
        >
          {content(item, <ChevronDown size={14} strokeWidth={2} aria-hidden className={`transition-transform ${open ? "rotate-180" : ""}`} />)}
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.ul
              id={`${id}-${item.id}`}
              initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
              animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 34 }}
              className="ml-4 grid gap-0.5 overflow-hidden border-l border-track pl-2"
            >
              {item.children?.map((child) => <li key={child.id}>{leaf(child)}</li>)}
            </motion.ul>
          )}
        </AnimatePresence>
      </>
    );
  };

  return (
    <motion.nav
      ref={nav}
      aria-label={label}
      onKeyDown={onKeyDown}
      initial={false}
      animate={{ width: collapsed ? 64 : 256 }}
      transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 34 }}
      className={`flex shrink-0 flex-col gap-4 overflow-hidden rounded-[20px] bg-surface p-2 shadow-[var(--shadow-card)] dark:bg-raised ${className}`}
    >
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
        {sections.map((section, s) => (
          <div key={section.title ?? s}>
            {section.title && !collapsed && <div className="px-2.5 pb-1 text-xs font-medium text-fg-subtle">{section.title}</div>}
            <ul className="grid gap-0.5">
              {section.items.map((item) => <li key={item.id}>{item.children ? group(item) : leaf(item)}</li>)}
            </ul>
          </div>
        ))}
      </div>
      <button
        type="button"
        data-nav-item=""
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-pressed={collapsed}
        onClick={() => setCollapsed(!collapsed)}
        className={`flex h-9 items-center gap-2.5 rounded-[10px] px-2.5 text-sm text-fg-muted transition-colors hover:bg-subtle hover:text-fg ${collapsed ? "justify-center" : ""} ${ring}`}
      >
        {collapsed ? <PanelLeftOpen size={18} strokeWidth={2} aria-hidden /> : <PanelLeftClose size={18} strokeWidth={2} aria-hidden />}
        {!collapsed && "Collapse"}
      </button>
    </motion.nav>
  );
}
