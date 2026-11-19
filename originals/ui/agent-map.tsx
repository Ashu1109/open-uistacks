"use client";

import { useState, useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "motion/react";

/* Agent map: an SVG graph of agents and the links between them; nodes pop in and links draw in on mount, nodes are keyboard-focusable buttons that lift on hover, active links animate dashes, and selection is controlled or uncontrolled. */

const noSubscribe = () => () => {};
function useReduce() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

const SPRING = { type: "spring", stiffness: 460, damping: 30 } as const;

const ring = "outline-none focus-visible:[&>rect]:stroke-[var(--select)] focus-visible:[&>rect]:stroke-2";

export interface MapNode {
  id: string;
  label: string;
  /** Small second line, e.g. a role or model. */
  caption?: string;
  x: number;
  y: number;
}

export interface MapEdge {
  from: string;
  to: string;
  label?: string;
  /** Marks a link a message is flowing over right now. */
  active?: boolean;
}

export interface AgentMapProps {
  nodes: MapNode[];
  edges: MapEdge[];
  width?: number;
  height?: number;
  selected?: string | null;
  defaultSelected?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
}

export const NODE_W = 132;
export const NODE_H = 48;

/** Cubic path from the right or left edge of `a` to the facing edge of `b`; also returns the midpoint for a label. */
export function edgePath(a: MapNode, b: MapNode): { d: string; mid: { x: number; y: number } } {
  const forward = b.x >= a.x;
  const x1 = a.x + (forward ? NODE_W / 2 : -NODE_W / 2);
  const x2 = b.x + (forward ? -NODE_W / 2 : NODE_W / 2);
  const bend = Math.max(Math.abs(x2 - x1) / 2, 24) * (forward ? 1 : -1);
  return {
    d: `M${x1} ${a.y} C${x1 + bend} ${a.y} ${x2 - bend} ${b.y} ${x2} ${b.y}`,
    mid: { x: (x1 + x2) / 2, y: (a.y + b.y) / 2 },
  };
}

export function AgentMap({ nodes, edges, width = 640, height = 280, selected, defaultSelected = null, onSelect, className = "" }: AgentMapProps) {
  const [inner, setInner] = useState<string | null>(defaultSelected);
  const current = selected === undefined ? inner : selected;
  const pick = (id: string) => {
    if (selected === undefined) setInner(id);
    onSelect?.(id);
  };
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const reduce = useReduce();
  const linksAt = 0.15 + nodes.length * 0.06;

  return (
    <svg role="group" aria-label="Agent map" viewBox={`0 0 ${width} ${height}`} className={`w-full rounded-[20px] bg-surface shadow-[var(--shadow-card)] dark:bg-raised ${className}`}>
      <defs>
        <marker id="agent-map-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 0 L8 4 L0 8 z" fill="var(--track-strong)" />
        </marker>
      </defs>
      {edges.map((e, i) => {
        const a = byId.get(e.from);
        const b = byId.get(e.to);
        if (!a || !b) return null;
        const { d, mid } = edgePath(a, b);
        return (
          <g key={`${e.from}-${e.to}`}>
            <motion.path
              d={d}
              fill="none"
              stroke={e.active ? "var(--select)" : "var(--track-strong)"}
              strokeWidth={e.active ? 2 : 1.5}
              strokeDasharray={e.active ? "6 5" : undefined}
              markerEnd="url(#agent-map-arrow)"
              className={e.active ? "animate-[agent-map-flow_1s_linear_infinite] motion-reduce:animate-none" : undefined}
              initial={reduce ? false : e.active ? { opacity: 0 } : { pathLength: 0, opacity: 0 }}
              animate={e.active ? { opacity: 1 } : { pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.45, ease: "easeOut", delay: linksAt + i * 0.08 }}
            />
            {e.label && (
              <motion.text x={mid.x} y={mid.y - 6} textAnchor="middle" fontSize="10" fill="var(--fg-subtle)" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25, delay: linksAt + i * 0.08 + 0.3 }}>
                {e.label}
              </motion.text>
            )}
          </g>
        );
      })}
      {nodes.map((n, i) => {
        const on = n.id === current;
        return (
          <motion.g
            key={n.id}
            role="button"
            tabIndex={0}
            aria-pressed={on}
            aria-label={n.caption ? `${n.label}, ${n.caption}` : n.label}
            onClick={() => pick(n.id)}
            onKeyDown={(ev) => {
              if (ev.key === "Enter" || ev.key === " ") {
                ev.preventDefault();
                pick(n.id);
              }
            }}
            className={`cursor-pointer ${ring}`}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
            initial={reduce ? false : { opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={reduce ? undefined : { scale: 1.03 }}
            whileTap={reduce ? undefined : { scale: 0.97 }}
            transition={{ ...SPRING, delay: reduce ? 0 : 0.05 + i * 0.06 }}
          >
            <rect x={n.x - NODE_W / 2} y={n.y - NODE_H / 2} width={NODE_W} height={NODE_H} rx={14} style={{ fill: on ? "var(--select-soft)" : "var(--subtle)", stroke: on ? "var(--select)" : "var(--track)", strokeWidth: on ? 2 : 1 }} className="transition-[fill,stroke,stroke-width] duration-200" />
            <text x={n.x} y={n.caption ? n.y - 3 : n.y + 4} textAnchor="middle" fontSize="12" fontWeight="500" fill="var(--fg)">{n.label}</text>
            {n.caption && <text x={n.x} y={n.y + 13} textAnchor="middle" fontSize="10" fill="var(--fg-subtle)">{n.caption}</text>}
          </motion.g>
        );
      })}
      <style>{`@keyframes agent-map-flow { to { stroke-dashoffset: -11; } }`}</style>
    </svg>
  );
}
