import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InvoicesWorkspace, filterInvoices, invoiceTotal, outstanding, type Invoice } from "./invoices-workspace";
import { PnlOverview, netMargin, percentDelta, sumAmounts } from "./pnl-overview";
import { TreasuryOverview, monthlyBurn, runwayMonths, totalCash } from "./treasury-overview";
import { StacksBooks } from "../templates/stacks-books";
import { StacksCrypto } from "../templates/stacks-crypto";

afterEach(cleanup);

const INV = (id: string, status: Invoice["status"], price: number): Invoice => ({ id, number: `N-${id}`, customer: `Cust ${id}`, issued: "2026-01-01", due: "2026-02-01", status, lines: [{ description: "Work", unitPrice: price, quantity: 2 }] });

describe("invoice helpers", () => {
  const list = [INV("a", "draft", 100), INV("b", "sent", 200), INV("c", "overdue", 300), INV("d", "paid", 400)];
  it("totals, filters and sums outstanding", () => {
    expect(invoiceTotal(list[0])).toBe(200);
    expect(filterInvoices(list, "paid").map((i) => i.id)).toEqual(["d"]);
    expect(filterInvoices(list, "all")).toHaveLength(4);
    expect(outstanding(list)).toBe(1000);
  });
});

describe("InvoicesWorkspace", () => {
  it("renders demo data, filters, and fires actions", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    const onMarkPaid = vi.fn();
    render(<InvoicesWorkspace onSend={onSend} onMarkPaid={onMarkPaid} />);
    const list = screen.getByRole("list", { name: "Invoice list" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(5);
    await user.click(screen.getByRole("radio", { name: "Draft" }));
    expect(within(list).getAllByRole("listitem")).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Send invoice" }));
    expect(onSend).toHaveBeenCalledWith(expect.objectContaining({ number: "INV-1043" }));
    await user.click(screen.getByRole("radio", { name: "Overdue" }));
    await user.click(screen.getByRole("button", { name: "Mark paid" }));
    expect(onMarkPaid).toHaveBeenCalledWith(expect.objectContaining({ number: "INV-1041" }));
  });

  it("shows an empty message and selects another invoice", async () => {
    const user = userEvent.setup();
    render(<InvoicesWorkspace invoices={[INV("a", "sent", 100), INV("b", "sent", 200)]} />);
    await user.click(screen.getByRole("button", { name: /Cust b/ }));
    expect(screen.getByRole("article", { name: "Invoice N-b" })).toBeTruthy();
    await user.click(screen.getByRole("radio", { name: "Paid" }));
    expect(screen.getByText("No paid invoices")).toBeTruthy();
  });
});

describe("P&L helpers", () => {
  it("computes margin, delta and sums", () => {
    expect(netMargin(1000, 750)).toBe(25);
    expect(netMargin(0, 10)).toBe(0);
    expect(percentDelta(110, 100)).toBe(10);
    expect(percentDelta(5, 0)).toBeNull();
    expect(percentDelta(5, undefined)).toBeNull();
    expect(sumAmounts([{ amount: 2 }, { amount: 3 }])).toBe(5);
  });
});

describe("PnlOverview", () => {
  it("renders figures with formatted money and categories", () => {
    render(<PnlOverview />);
    expect(screen.getByRole("region", { name: "Profit and loss" })).toBeTruthy();
    expect(screen.getByText("$94,500.00")).toBeTruthy();
    expect(screen.getByText("Payroll")).toBeTruthy();
    expect(screen.getByRole("img", { name: /Payroll: \d+% of expenses/ })).toBeTruthy();
  });
});

describe("treasury helpers", () => {
  it("computes cash, burn and runway", () => {
    expect(totalCash([{ name: "a", balance: 5 }, { name: "b", balance: 7 }])).toBe(12);
    expect(monthlyBurn([{ label: "x", inflow: 100, outflow: 300 }, { label: "y", inflow: 100, outflow: 100 }])).toBe(100);
    expect(monthlyBurn([{ label: "x", inflow: 300, outflow: 100 }])).toBe(0);
    expect(monthlyBurn([])).toBe(0);
    expect(runwayMonths(1000, 100)).toBe(10);
    expect(runwayMonths(1000, 0)).toBeNull();
  });
});

describe("TreasuryOverview", () => {
  it("renders accounts, total cash and runway", () => {
    render(<TreasuryOverview />);
    expect(screen.getByRole("region", { name: "Treasury" })).toBeTruthy();
    expect(screen.getByText("$485,700.00")).toBeTruthy();
    expect(screen.getByText("Cash positive")).toBeTruthy();
    expect(within(screen.getByRole("list", { name: "Accounts" })).getAllByRole("listitem")).toHaveLength(3);
  });

  it("shows runway in months when burning cash", () => {
    render(<TreasuryOverview accounts={[{ name: "Op", balance: 600_000 }]} flows={[{ label: "Jan", inflow: 100_000, outflow: 300_000 }]} />);
    expect(screen.getByText("3 months")).toBeTruthy();
  });
});

describe("templates", () => {
  it("Stacks Books switches between overview and invoices", async () => {
    const user = userEvent.setup();
    render(<div style={{ height: 800 }}><StacksBooks /></div>);
    expect(screen.getByRole("heading", { name: "Overview" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Profit and loss" })).toBeTruthy();
    await user.click(screen.getAllByText("Invoices")[0]);
    expect(screen.getByRole("heading", { name: "Invoices", level: 1 })).toBeTruthy();
    expect(screen.getByRole("list", { name: "Invoice list" })).toBeTruthy();
  });

  it("Stacks Crypto switches between portfolio and markets", async () => {
    const user = userEvent.setup();
    render(<div style={{ height: 800 }}><StacksCrypto /></div>);
    expect(screen.getByRole("heading", { name: "Portfolio", level: 1 })).toBeTruthy();
    await user.click(screen.getAllByText("Markets")[0]);
    expect(screen.getByRole("heading", { name: "Markets", level: 1 })).toBeTruthy();
    expect(screen.getByText("Lumen")).toBeTruthy();
  });
});
