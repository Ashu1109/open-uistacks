"use client";

import { useMemo, useState } from "react";
import { LayoutGrid, List, Pencil, Search } from "lucide-react";
import { Badge, type BadgeTone } from "../../registry/ui/badge";
import { SegmentedControl } from "../ui/segmented-control";
import { formatMoney } from "../ui/cart-summary";

/* Product catalog: a full-width or 2/3-width section listing products as a grid or a table-like list with search, stock level bars and an edit button per product; the grid reflows by container width. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface CatalogProduct {
  id: string;
  name: string;
  sku: string;
  /** Minor units. */
  price: number;
  stock: number;
  /** Stock at or below this counts as low; defaults to 10. */
  lowStockAt?: number;
  imageUrl?: string;
  category?: string;
}

export interface ProductCatalogProps {
  products?: CatalogProduct[];
  currency?: string;
  defaultView?: "grid" | "list";
  onEdit?: (product: CatalogProduct) => void;
  className?: string;
}

export type StockLevel = "out" | "low" | "ok";

export function stockLevel(stock: number, lowAt = 10): StockLevel {
  return stock <= 0 ? "out" : stock <= lowAt ? "low" : "ok";
}

export function filterProducts(products: CatalogProduct[], query: string): CatalogProduct[] {
  const q = query.trim().toLowerCase();
  return q ? products.filter((p) => `${p.name} ${p.sku} ${p.category ?? ""}`.toLowerCase().includes(q)) : products;
}

const LEVEL: Record<StockLevel, { tone: BadgeTone; text: string; bar: string }> = {
  out: { tone: "danger", text: "Out of stock", bar: "var(--danger)" },
  low: { tone: "warning", text: "Low stock", bar: "var(--warning)" },
  ok: { tone: "success", text: "In stock", bar: "var(--success)" },
};

export const DEMO_PRODUCTS: CatalogProduct[] = [
  { id: "p1", name: "Linen throw", sku: "LT-SND-01", price: 8900, stock: 42, category: "Textiles" },
  { id: "p2", name: "Ceramic mug set", sku: "CM-WHT-02", price: 3400, stock: 7, category: "Kitchen" },
  { id: "p3", name: "Desk lamp", sku: "DL-BLK-01", price: 12900, stock: 18, category: "Lighting" },
  { id: "p4", name: "Walnut tray", sku: "WT-NAT-03", price: 5400, stock: 0, category: "Kitchen" },
  { id: "p5", name: "Beeswax candle", sku: "BC-CDR-01", price: 2200, stock: 64, category: "Home" },
  { id: "p6", name: "Wool blanket", sku: "WB-CHR-02", price: 15900, stock: 9, category: "Textiles" },
];

function StockBar({ product }: { product: CatalogProduct }) {
  const level = stockLevel(product.stock, product.lowStockAt);
  const cap = Math.max((product.lowStockAt ?? 10) * 4, product.stock, 1);
  return (
    <div className="grid gap-1">
      <div className="flex items-center justify-between gap-2">
        <Badge size="sm" tone={LEVEL[level].tone}>{LEVEL[level].text}</Badge>
        <span className="text-xs tabular-nums text-fg-muted">{product.stock} units</span>
      </div>
      <div role="meter" aria-label={`Stock for ${product.name}`} aria-valuemin={0} aria-valuemax={cap} aria-valuenow={product.stock} className="h-1.5 overflow-hidden rounded-full bg-track">
        <div className="h-full rounded-full" style={{ width: `${(product.stock / cap) * 100}%`, background: LEVEL[level].bar }} />
      </div>
    </div>
  );
}

export function ProductCatalog({ products = DEMO_PRODUCTS, currency = "USD", defaultView = "grid", onEdit, className = "" }: ProductCatalogProps) {
  const [view, setView] = useState<string>(defaultView);
  const [query, setQuery] = useState("");
  const visible = useMemo(() => filterProducts(products, query), [products, query]);
  const edit = (p: CatalogProduct) => (
    <button type="button" aria-label={`Edit ${p.name}`} onClick={() => onEdit?.(p)} className={`grid size-8 shrink-0 place-items-center rounded-full text-fg-muted hover:bg-subtle hover:text-fg ${ring}`}>
      <Pencil size={15} aria-hidden />
    </button>
  );
  return (
    <section aria-label="Product catalog" className={`@container grid gap-4 rounded-[20px] bg-surface p-4 shadow-[var(--shadow-card)] dark:bg-raised ${className}`}>
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="mr-auto text-[15px] font-semibold text-fg">Products <span className="font-normal tabular-nums text-fg-muted">{visible.length}</span></h3>
        <label className="flex h-9 w-full items-center gap-2 rounded-[14px] bg-subtle px-3 text-fg-muted focus-within:ring-2 focus-within:ring-[var(--select)] @[480px]:w-64">
          <Search size={16} aria-hidden />
          <input value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search products" placeholder="Search name or SKU" className="min-w-0 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-fg-subtle" />
        </label>
        <SegmentedControl
          label="Layout"
          size="sm"
          value={view}
          onValueChange={setView}
          options={[{ value: "grid", label: <LayoutGrid size={15} aria-hidden />, ariaLabel: "Grid" }, { value: "list", label: <List size={15} aria-hidden />, ariaLabel: "List" }]}
        />
      </div>
      {visible.length === 0 ? (
        <p role="status" className="py-10 text-center text-sm text-fg-muted">No products match "{query}".</p>
      ) : view === "grid" ? (
        <ul aria-label="Products" className="grid gap-3 @[480px]:grid-cols-2 @[800px]:grid-cols-3">
          {visible.map((p) => (
            <li key={p.id} className="grid gap-3 rounded-[16px] bg-subtle/60 p-3">
              <div className="aspect-[5/3] overflow-hidden rounded-[12px] bg-[color-mix(in_srgb,var(--series-1)_10%,var(--subtle))]">{p.imageUrl && <img src={p.imageUrl} alt="" className="size-full object-cover" />}</div>
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-fg">{p.name}</p>
                  <p className="text-xs text-fg-subtle">{p.sku}</p>
                </div>
                <span className="text-sm font-medium tabular-nums text-fg">{formatMoney(p.price, currency)}</span>
                {edit(p)}
              </div>
              <StockBar product={p} />
            </li>
          ))}
        </ul>
      ) : (
        <ul aria-label="Products" className="grid divide-y divide-track">
          {visible.map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-fg">{p.name}</p>
                <p className="text-xs text-fg-subtle">{p.sku}{p.category ? ` · ${p.category}` : ""}</p>
              </div>
              <div className="hidden w-40 @[560px]:block"><StockBar product={p} /></div>
              <span className="w-20 text-right text-sm font-medium tabular-nums text-fg">{formatMoney(p.price, currency)}</span>
              {edit(p)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
