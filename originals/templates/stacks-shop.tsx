"use client";

import { useState } from "react";
import { BarChart3, Package, ShoppingBag, Store, Truck } from "lucide-react";
import { AppShell } from "../blocks/app-shell";
import { OrdersWorkspace } from "../blocks/orders-workspace";
import { ProductCatalog } from "../blocks/product-catalog";
import { RevenueOverview } from "../blocks/revenue-overview";
import { ShipmentTracking } from "../blocks/shipment-tracking";
import type { NavSection } from "../ui/sidebar-nav";

/* Stacks Shop: an e-commerce admin template for a fictional store; Overview shows revenue and shipments, Orders, Products and Shipments each give their block the full screen. */

const SECTIONS: NavSection[] = [
  {
    items: [
      { id: "overview", label: "Overview", icon: <BarChart3 size={16} aria-hidden /> },
      { id: "orders", label: "Orders", icon: <ShoppingBag size={16} aria-hidden /> },
      { id: "products", label: "Products", icon: <Package size={16} aria-hidden /> },
      { id: "shipments", label: "Shipments", icon: <Truck size={16} aria-hidden /> },
    ],
  },
];

const TITLES: Record<string, string> = { overview: "Overview", orders: "Orders", products: "Products", shipments: "Shipments" };

export interface StacksShopProps {
  className?: string;
}

export function StacksShop({ className = "" }: StacksShopProps) {
  const [view, setView] = useState("overview");
  return (
    <AppShell
      className={className}
      product={{ name: "Stacks Shop", mark: <span className="grid size-8 place-items-center rounded-[10px] bg-[image:var(--grad-primary)] text-[var(--inverse-fg)]"><Store size={16} aria-hidden /></span> }}
      sections={SECTIONS}
      activeId={view}
      onNavigate={setView}
      title={TITLES[view]}
      subtitle="Harbor & Pine · Last 28 days"
    >
      {view === "overview" && (
        <div className="@container grid gap-4">
          <RevenueOverview />
          <ShipmentTracking />
        </div>
      )}
      {view === "orders" && <OrdersWorkspace />}
      {view === "products" && <ProductCatalog />}
      {view === "shipments" && <ShipmentTracking />}
    </AppShell>
  );
}
