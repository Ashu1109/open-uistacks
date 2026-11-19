import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { filterOrders, orderTotal, OrdersWorkspace, DEMO_ORDERS } from "./orders-workspace";
import { filterProducts, ProductCatalog, stockLevel, DEMO_PRODUCTS } from "./product-catalog";
import { percentChange, RevenueOverview, summarize, windows, DEMO_DAYS } from "./revenue-overview";
import { exceptionCount, ShipmentTracking, DEMO_SHIPMENTS } from "./shipment-tracking";
import { StacksShop } from "../templates/stacks-shop";

afterEach(cleanup);

describe("pure helpers", () => {
  it("filters orders by stage and query, and totals with shipping and tax", () => {
    expect(filterOrders(DEMO_ORDERS, "3", "").map((o) => o.number)).toEqual(["#4809", "#4806"]);
    expect(filterOrders(DEMO_ORDERS, "all", "priya")).toHaveLength(1);
    expect(orderTotal({ ...DEMO_ORDERS[1] })).toBe(Math.round(12900 * 1.08));
  });
  it("classifies stock and filters products", () => {
    expect([stockLevel(0), stockLevel(5), stockLevel(50), stockLevel(12, 20)]).toEqual(["out", "low", "ok", "low"]);
    expect(filterProducts(DEMO_PRODUCTS, "lt-snd")).toHaveLength(1);
  });
  it("summarizes windows and percent change", () => {
    const s = summarize([{ label: "a", revenue: 10000, orders: 2, visits: 100 }, { label: "b", revenue: 5000, orders: 1, visits: 50 }]);
    expect(s).toEqual({ revenue: 15000, orders: 3, aov: 5000, conversion: 0.02 });
    expect(percentChange(110, 100)).toBeCloseTo(10);
    expect(percentChange(5, 0)).toBeNull();
    const w = windows(DEMO_DAYS, 7);
    expect(w.current).toHaveLength(7);
    expect(w.previous).toHaveLength(7);
    expect(exceptionCount(DEMO_SHIPMENTS)).toBe(1);
  });
});

describe("OrdersWorkspace", () => {
  it("renders the list and the selected order's detail", () => {
    render(<OrdersWorkspace />);
    expect(screen.getByRole("list", { name: "Order list" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Order #4821" })).toBeTruthy();
    expect(screen.getByText("Linen throw")).toBeTruthy();
  });
  it("filters by search, selects an order and advances its fulfilment", async () => {
    const user = userEvent.setup();
    const onAdvance = vi.fn();
    render(<OrdersWorkspace onAdvance={onAdvance} />);
    await user.type(screen.getByLabelText("Search orders"), "luca");
    const list = screen.getByRole("list", { name: "Order list" });
    expect(within(list).getAllByRole("button")).toHaveLength(1);
    await user.click(within(list).getByRole("button"));
    expect(screen.getByRole("heading", { name: "Order #4820" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Mark as shipped" }));
    expect(onAdvance).toHaveBeenCalledWith("o2", 2);
    expect(screen.getByRole("button", { name: "Mark as delivered" })).toBeTruthy();
  });
  it("shows an empty state when nothing matches", async () => {
    const user = userEvent.setup();
    render(<OrdersWorkspace />);
    await user.type(screen.getByLabelText("Search orders"), "zzz");
    expect(screen.getByText("No orders match.")).toBeTruthy();
  });
});

describe("ProductCatalog", () => {
  it("renders products with stock meters and switches layout", async () => {
    const user = userEvent.setup();
    render(<ProductCatalog />);
    expect(screen.getAllByRole("meter")).toHaveLength(DEMO_PRODUCTS.length);
    expect(screen.getByText("Out of stock")).toBeTruthy();
    await user.click(screen.getByRole("radio", { name: "List" }));
    expect(screen.getByRole("list", { name: "Products" })).toBeTruthy();
  });
  it("searches and calls onEdit", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<ProductCatalog onEdit={onEdit} />);
    await user.type(screen.getByLabelText("Search products"), "lamp");
    await user.click(screen.getByRole("button", { name: "Edit Desk lamp" }));
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: "p3" }));
    expect(screen.queryByRole("button", { name: "Edit Linen throw" })).toBeNull();
  });
});

describe("RevenueOverview", () => {
  it("renders KPIs and the chart, and switches the range", async () => {
    const user = userEvent.setup();
    render(<RevenueOverview />);
    expect(screen.getByText("Avg. order value")).toBeTruthy();
    expect(screen.getByRole("img", { name: /last 7 days/ })).toBeTruthy();
    await user.click(screen.getByRole("radio", { name: "14 days" }));
    expect(screen.getByRole("img", { name: /last 14 days/ })).toBeTruthy();
  });
});

describe("ShipmentTracking", () => {
  it("renders shipments and the selected tracker", () => {
    render(<ShipmentTracking />);
    expect(screen.getByRole("list", { name: "Shipment list" })).toBeTruthy();
    expect(screen.getByRole("list", { name: "Order progress" })).toBeTruthy();
  });
  it("filters to exceptions and resolves one", async () => {
    const user = userEvent.setup();
    const onResolve = vi.fn();
    render(<ShipmentTracking onResolve={onResolve} />);
    await user.click(screen.getByRole("button", { name: /Exceptions/ }));
    const list = screen.getByRole("list", { name: "Shipment list" });
    expect(within(list).getAllByRole("button")).toHaveLength(1);
    await user.click(within(list).getByRole("button"));
    expect(screen.getByRole("alert").textContent).toContain("Address needs confirmation");
    await user.click(screen.getByRole("button", { name: "Resolve" }));
    expect(onResolve).toHaveBeenCalledWith(expect.objectContaining({ id: "s3" }));
  });
});

describe("StacksShop", () => {
  it("renders the overview and navigates between views", async () => {
    const user = userEvent.setup();
    render(<StacksShop />);
    expect(screen.getByRole("heading", { name: "Overview" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Revenue overview" })).toBeTruthy();
    await user.click(screen.getAllByText("Orders")[0]);
    expect(screen.getByRole("heading", { level: 1, name: "Orders" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Orders" })).toBeTruthy();
    await user.click(screen.getAllByText("Products")[0]);
    expect(screen.getByRole("region", { name: "Product catalog" })).toBeTruthy();
  });
});
