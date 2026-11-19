"use client";

/* OrgChart: a top-down tree of people; a pure layout places each node (leaves in order, parents centred over their children) and SVG elbow connectors join them. */

export interface OrgNode {
  id: string;
  name: string;
  title: string;
  children?: readonly OrgNode[];
}

export interface LayoutOptions {
  nodeWidth: number;
  nodeHeight: number;
  gapX: number;
  gapY: number;
}

export interface PositionedNode {
  node: OrgNode;
  x: number;
  y: number;
  depth: number;
}

export interface TreeLayout {
  nodes: PositionedNode[];
  links: { from: string; to: string }[];
  width: number;
  height: number;
}

/** x/y is each node's top-left corner. */
export function layoutTree(root: OrgNode, { nodeWidth, nodeHeight, gapX, gapY }: LayoutOptions): TreeLayout {
  const nodes: PositionedNode[] = [];
  const links: TreeLayout["links"] = [];
  let nextLeaf = 0;
  let maxDepth = 0;

  const place = (node: OrgNode, depth: number): number => {
    maxDepth = Math.max(maxDepth, depth);
    const kids = node.children ?? [];
    const xs = kids.map((kid) => {
      links.push({ from: node.id, to: kid.id });
      return place(kid, depth + 1);
    });
    const x = xs.length > 0 ? (xs[0] + xs[xs.length - 1]) / 2 : nextLeaf++ * (nodeWidth + gapX);
    nodes.push({ node, x, y: depth * (nodeHeight + gapY), depth });
    return x;
  };
  place(root, 0);

  return { nodes, links, width: Math.max(nextLeaf, 1) * (nodeWidth + gapX) - gapX, height: (maxDepth + 1) * (nodeHeight + gapY) - gapY };
}

const initials = (name: string) => name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

export interface OrgChartProps {
  root: OrgNode;
  nodeWidth?: number;
  nodeHeight?: number;
  gapX?: number;
  gapY?: number;
  className?: string;
}

export function OrgChart({ root, nodeWidth = 176, nodeHeight = 64, gapX = 24, gapY = 48, className = "" }: OrgChartProps) {
  const layout = layoutTree(root, { nodeWidth, nodeHeight, gapX, gapY });
  const byId = new Map(layout.nodes.map((n) => [n.node.id, n]));
  return (
    <div className={`overflow-auto rounded-[20px] bg-surface p-6 shadow-[var(--shadow-card)] ${className}`}>
      <div role="tree" aria-label="Organization chart" className="relative mx-auto" style={{ width: layout.width, height: layout.height }}>
        <svg width={layout.width} height={layout.height} aria-hidden className="absolute inset-0">
          {layout.links.map(({ from, to }) => {
            const a = byId.get(from);
            const b = byId.get(to);
            if (!a || !b) return null;
            const x1 = a.x + nodeWidth / 2;
            const y1 = a.y + nodeHeight;
            const x2 = b.x + nodeWidth / 2;
            const mid = y1 + gapY / 2;
            return <path key={`${from}-${to}`} d={`M${x1} ${y1} V${mid} H${x2} V${b.y}`} fill="none" stroke="var(--track-strong)" strokeWidth="1.5" strokeLinejoin="round" />;
          })}
        </svg>
        {layout.nodes.map(({ node, x, y, depth }) => (
          <div key={node.id} role="treeitem" aria-level={depth + 1} aria-selected={false} style={{ left: x, top: y, width: nodeWidth, height: nodeHeight }} className="absolute flex items-center gap-2.5 rounded-[14px] bg-surface px-3 shadow-[var(--shadow-card)]">
            <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-select-soft text-xs font-semibold text-select-text">{initials(node.name)}</span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-medium text-fg">{node.name}</span>
              <span className="block truncate text-xs text-fg-muted">{node.title}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
