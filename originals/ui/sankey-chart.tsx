"use client";

import { useMemo, useState } from "react";
import { ChartTip, Live, focusRing, formatNumber, formatPercent, sankeyLayout, seriesColor, type SankeyLinkInput, type SankeyNodeInput, useChartWidth } from "./chart-utils";

/* Sankey chart: flows between stages drawn as ribbons whose width is the value; hover a ribbon for its share, hover or focus a node to isolate everything passing through it. */

export type SankeyNodeDef = SankeyNodeInput;
export type SankeyLinkDef = SankeyLinkInput;

export interface SankeyChartProps {
  nodes: SankeyNodeDef[];
  links: SankeyLinkDef[];
  height?: number;
  format?: (n: number) => string;
  label?: string;
  className?: string;
}


export function SankeyChart({ nodes, links, height = 320, format = formatNumber, label, className = "" }: SankeyChartProps) {
  const [ref, W] = useChartWidth(640);
  const layout = useMemo(() => sankeyLayout(nodes, links, { width: W, height: height - 8, nodeWidth: 12, nodePadding: 14 }), [nodes, links, height, W]);
  const [node, setNode] = useState<string | null>(null);
  const [link, setLink] = useState<number | null>(null);
  const byId = new Map(layout.nodes.map((n, i) => [n.id, { n, i }]));
  const maxCol = Math.max(0, ...layout.nodes.map((n) => n.column));
  const touches = (l: SankeyLinkDef) => node === null || l.source === node || l.target === node;
  const hovered = link === null ? null : layout.links[link];
  const total = layout.nodes.filter((n) => n.column === 0).reduce((s, n) => s + n.value, 0);

  return (
    <figure ref={ref} className={`relative m-0 ${className}`}>
      <svg viewBox={`0 0 ${W} ${height}`} role="group" aria-label={label ?? `Sankey diagram with ${layout.nodes.length} nodes and ${layout.links.length} flows.`} className="block h-auto w-full" style={{ overflow: "visible" }}>
        <g transform="translate(0 4)">
          {layout.links.map((l, i) => {
            const s = byId.get(l.source);
            return (
              <path
                key={`${l.source}-${l.target}`}
                d={l.path}
                fill="none"
                stroke={seriesColor(s?.i ?? 0)}
                strokeWidth={Math.max(l.width, 1)}
                strokeOpacity={link === i ? 0.55 : touches(l) && (link === null || link === i) ? 0.3 : 0.07}
                className="transition-[stroke-opacity]"
                onPointerEnter={() => setLink(i)}
                onPointerLeave={() => setLink(null)}
              />
            );
          })}
          {layout.nodes.map((n, i) => (
            <g
              key={n.id}
              role="img"
              tabIndex={0}
              aria-label={`${n.label}: ${format(n.value)}`}
              className={focusRing}
              onPointerEnter={() => setNode(n.id)}
              onPointerLeave={() => setNode(null)}
              onFocus={() => setNode(n.id)}
              onBlur={() => setNode(null)}
            >
              <rect x={n.x} y={n.y} width={n.w} height={Math.max(n.h, 1)} rx={3} fill={seriesColor(i)} />
              <text x={n.column === maxCol && maxCol > 0 ? n.x - 8 : n.x + n.w + 8} y={n.y + n.h / 2} textAnchor={n.column === maxCol && maxCol > 0 ? "end" : "start"} dominantBaseline="middle" fontSize={12} fill="var(--fg)" stroke="var(--surface)" strokeWidth={3} paintOrder="stroke" aria-hidden>
                {n.label} <tspan fill="var(--fg-muted)">{format(n.value)}</tspan>
              </text>
            </g>
          ))}
        </g>
      </svg>
      {hovered && <ChartTip x={W / 2} y={height / 2} w={W} h={height}><div className="font-medium">{byId.get(hovered.source)?.n.label} → {byId.get(hovered.target)?.n.label}</div><div className="tabular-nums text-fg-muted">{format(hovered.value)} · {formatPercent(total === 0 ? 0 : hovered.value / total, 1)} of total</div></ChartTip>}
      <Live>{hovered ? `${byId.get(hovered.source)?.n.label} to ${byId.get(hovered.target)?.n.label}: ${format(hovered.value)}` : node ? `${byId.get(node)?.n.label}: ${format(byId.get(node)?.n.value ?? 0)}` : ""}</Live>
      <ul className="sr-only">{layout.links.map((l) => <li key={`${l.source}-${l.target}`}>{byId.get(l.source)?.n.label} to {byId.get(l.target)?.n.label}: {format(l.value)}</li>)}</ul>
    </figure>
  );
}
