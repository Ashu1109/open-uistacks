import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BalanceCard, formatMoney, parseMinor, sparklinePath, currencyDigits } from "./ui/balance-card";
import { TransactionList, groupTransactions, dayLabel, type Transaction } from "./ui/transaction-list";
import { BudgetBars, budgetLevel, budgetRatio } from "./ui/budget-bars";
import { Watchlist, formatPercent, sortWatchlist, type WatchItem } from "./ui/watchlist";
import { InvoiceEditor, invoiceTotals, lineTotal, type InvoiceLine } from "./ui/invoice-editor";
import { PaymentCard, maskCardNumber } from "./ui/payment-card";
import { SpendLimit, snapLimit } from "./ui/spend-limit";
import { RecurringBills, daysUntil, dueLabel, monthlyEquivalent, monthlyTotal, type Bill } from "./ui/recurring-bills";
import { SwapCard, convertMinor, formatAssetAmount } from "./ui/swap-card";
import { AsciiGlobe, globeChar, renderGlobe } from "./ui/ascii-globe";
import { AsciiText, fallbackBitmap, renderAsciiText } from "./ui/ascii-text";
import { AsciiImage, asciiRows, luminanceChar, pixelsToAscii } from "./ui/ascii-image";
import { AsciiField, fieldFrame, fieldValue } from "./ui/ascii-field";
import { AsciiLoader, loaderFrame } from "./ui/ascii-loader";
import { SpotlightCard, spotlightBackground } from "./ui/spotlight-card";
import { TextScramble, scrambleFrame } from "./ui/text-scramble";
import { ShinyText, shineStyle } from "./ui/shiny-text";
import { DotField, dotDisplacement } from "./ui/dot-field";

afterEach(cleanup);

describe("money helpers", () => {
  it("formats minor units with Intl", () => {
    expect(formatMoney(123_450)).toBe("$1,234.50");
    expect(formatMoney(-500, "USD", "en-US", true)).toBe("-$5.00");
    expect(formatMoney(1500, "USD", "en-US", true)).toBe("+$15.00");
    expect(currencyDigits("JPY")).toBe(0);
    expect(formatMoney(1500, "JPY")).toContain("1,500");
  });

  it("parses decimal text to minor units without float drift", () => {
    expect(parseMinor("12.5")).toBe(1250);
    expect(parseMinor("1.005")).toBe(100);
    expect(parseMinor("$1,000")).toBe(100_000);
    expect(parseMinor(".5")).toBe(50);
    expect(parseMinor("abc")).toBeNull();
    expect(parseMinor("12", 0)).toBe(12);
  });

  it("builds a sparkline path", () => {
    expect(sparklinePath([1], 10, 10)).toBe("");
    expect(sparklinePath([0, 10], 100, 20, 0)).toBe("M0.0 20.0 L100.0 0.0");
    expect(sparklinePath([5, 5], 100, 20, 0)).toBe("M0.0 10.0 L100.0 10.0");
  });
});

describe("BalanceCard", () => {
  it("shows the balance and change, and hides on toggle", async () => {
    const onHiddenChange = vi.fn();
    render(<BalanceCard balance={250_000} change={12_000} history={[1, 3, 2, 5]} onHiddenChange={onHiddenChange} />);
    expect(screen.getByText("$2,500.00")).toBeTruthy();
    expect(screen.getByText("+$120.00")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Hide balance" }));
    expect(screen.queryByText("$2,500.00")).toBeNull();
    expect(screen.getByLabelText("Balance hidden")).toBeTruthy();
    expect(onHiddenChange).toHaveBeenCalledWith(true);
  });
});

const NOW = new Date(2026, 10, 18, 12);
const TX: Transaction[] = [
  { id: "1", title: "Coffee", amount: -450, date: "2026-11-18" },
  { id: "2", title: "Salary", amount: 300_000, date: "2026-11-17" },
  { id: "3", title: "Books", amount: -2000, date: "2026-11-17", status: "pending" },
  { id: "4", title: "Old", amount: -100, date: "2026-11-01" },
];

describe("TransactionList", () => {
  it("groups by day, newest first, with nets", () => {
    const groups = groupTransactions(TX, NOW);
    expect(groups.map((g) => g.label)).toEqual(["Today", "Yesterday", "Sun, Nov 1"]);
    expect(groups[1]?.net).toBe(298_000);
    expect(dayLabel(new Date(2026, 10, 18), NOW)).toBe("Today");
  });

  it("renders rows, pending badge and selection", async () => {
    const onSelect = vi.fn();
    render(<TransactionList items={TX} now={NOW} onSelect={onSelect} />);
    expect(screen.getByText("Pending")).toBeTruthy();
    expect(screen.getByRole("region", { name: "Yesterday" })).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: /Coffee/ }));
    expect(onSelect).toHaveBeenCalledWith(TX[0]);
  });

  it("shows an empty state", () => {
    render(<TransactionList items={[]} emptyText="Nothing" />);
    expect(screen.getByText("Nothing")).toBeTruthy();
  });
});

describe("BudgetBars", () => {
  it("computes levels and ratios", () => {
    expect(budgetLevel(50, 100)).toBe("ok");
    expect(budgetLevel(90, 100)).toBe("near");
    expect(budgetLevel(101, 100)).toBe("over");
    expect(budgetRatio(150, 100)).toBe(1);
    expect(budgetRatio(25, 100)).toBe(0.25);
  });

  it("renders one meter per item with remaining text", () => {
    render(<BudgetBars items={[{ id: "a", label: "Food", spent: 12_000, limit: 10_000 }, { id: "b", label: "Fun", spent: 1000, limit: 10_000 }]} />);
    expect(screen.getByRole("meter", { name: "Food budget" }).getAttribute("aria-valuenow")).toBe("10000");
    expect(screen.getByText("$20.00 over")).toBeTruthy();
    expect(screen.getByText("$90.00 left")).toBeTruthy();
  });
});

const WATCH: WatchItem[] = [
  { symbol: "BBB", name: "Beta", price: 1000, changePct: -1.5, series: [3, 2, 1] },
  { symbol: "AAA", name: "Alpha", price: 2000, changePct: 2.25, series: [1, 2, 3] },
];

describe("Watchlist", () => {
  it("formats percent and sorts", () => {
    expect(formatPercent(2.5)).toBe("+2.50%");
    expect(formatPercent(-0.1)).toBe("-0.10%");
    expect(sortWatchlist(WATCH, "name").map((w) => w.symbol)).toEqual(["AAA", "BBB"]);
    expect(sortWatchlist(WATCH, "change").map((w) => w.symbol)).toEqual(["AAA", "BBB"]);
  });

  it("sorts on click and removes", async () => {
    const onRemove = vi.fn();
    render(<Watchlist items={WATCH} onRemove={onRemove} />);
    expect(screen.getAllByRole("listitem")[0]?.textContent).toContain("BBB");
    await userEvent.click(screen.getByRole("button", { name: "Name" }));
    expect(screen.getAllByRole("listitem")[0]?.textContent).toContain("AAA");
    await userEvent.click(screen.getByRole("button", { name: "Remove BBB" }));
    expect(onRemove).toHaveBeenCalledWith("BBB");
  });
});

const LINES: InvoiceLine[] = [
  { id: "a", description: "Design", quantity: 2, unitPrice: 15_000 },
  { id: "b", description: "Hosting", quantity: 1.5, unitPrice: 333 },
];

describe("InvoiceEditor", () => {
  it("computes line, tax and grand totals in minor units", () => {
    expect(lineTotal(LINES[1] as InvoiceLine)).toBe(500);
    expect(invoiceTotals(LINES, 10)).toEqual({ subtotal: 30_500, tax: 3050, total: 33_550 });
    expect(invoiceTotals(LINES, 8.25).tax).toBe(2516);
    expect(invoiceTotals([], 10).total).toBe(0);
  });

  it("recalculates when a quantity changes and lines are added or removed", async () => {
    const onTotalsChange = vi.fn();
    render(<InvoiceEditor defaultValue={LINES} defaultTaxPercent={10} onTotalsChange={onTotalsChange} />);
    expect(screen.getByText("$335.50")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Quantity, line 1"), { target: { value: "3" } });
    expect(screen.getByText("$500.50")).toBeTruthy();
    expect(onTotalsChange).toHaveBeenLastCalledWith({ subtotal: 45_500, tax: 4550, total: 50_050 });
    await userEvent.click(screen.getByRole("button", { name: "Add line" }));
    expect(screen.getByLabelText("Description, line 3")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Remove line 1" }));
    expect(screen.queryByLabelText("Description, line 3")).toBeNull();
  });
});

describe("PaymentCard", () => {
  it("masks the number", () => {
    expect(maskCardNumber("0000 0000 0000 1234")).toBe("•••• •••• •••• 1234");
    expect(maskCardNumber("0000000000001234", true)).toBe("0000 0000 0000 1234");
    expect(maskCardNumber("123")).toBe("123");
  });

  it("reveals on demand", async () => {
    render(<PaymentCard number="0000000000001234" holder="Alex Sample" expiry="08/29" />);
    expect(screen.getByRole("group", { name: "Demo Bank card ending in 1234" })).toBeTruthy();
    expect(screen.getByText("•••• •••• •••• 1234")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Show card number" }));
    expect(screen.getByText("0000 0000 0000 1234")).toBeTruthy();
  });
});

describe("SpendLimit", () => {
  it("snaps values", () => {
    expect(snapLimit(1499, 0, 10_000, 1000)).toBe(1000);
    expect(snapLimit(99_999, 0, 10_000, 1000)).toBe(10_000);
    expect(snapLimit(-5, 0, 10_000, 1000)).toBe(0);
  });

  it("changes the limit and period", async () => {
    const onValueChange = vi.fn();
    const onPeriodChange = vi.fn();
    render(<SpendLimit defaultValue={50_000} spent={55_000} onValueChange={onValueChange} onPeriodChange={onPeriodChange} />);
    expect(screen.getByLabelText("Spending limit")).toBeTruthy();
    expect(screen.getByText(/over your limit/)).toBeTruthy();
    fireEvent.change(screen.getByRole("slider"), { target: { value: "80000" } });
    expect(onValueChange).toHaveBeenCalledWith(80_000);
    await userEvent.click(screen.getByRole("radio", { name: "weekly" }));
    expect(onPeriodChange).toHaveBeenCalledWith("weekly");
  });
});

const BILLS: Bill[] = [
  { id: "net", name: "Streaming", amount: 1500, frequency: "monthly", nextDue: "2026-11-20" },
  { id: "cloud", name: "Storage", amount: 12_000, frequency: "yearly", nextDue: "2026-11-17", autopay: true },
];

describe("RecurringBills", () => {
  it("normalizes to monthly and labels due dates", () => {
    expect(monthlyEquivalent(12_000, "yearly")).toBe(1000);
    expect(monthlyEquivalent(3000, "quarterly")).toBe(1000);
    expect(monthlyEquivalent(1000, "weekly")).toBe(4333);
    expect(monthlyTotal(BILLS)).toBe(2500);
    expect(daysUntil("2026-11-20", NOW)).toBe(2);
    expect(dueLabel(0)).toBe("Due today");
    expect(dueLabel(1)).toBe("Due tomorrow");
    expect(dueLabel(5)).toBe("Due in 5 days");
    expect(dueLabel(-3)).toBe("Overdue by 3 days");
  });

  it("sorts by due date and toggles autopay", async () => {
    const onAutopayChange = vi.fn();
    render(<RecurringBills bills={BILLS} now={NOW} onAutopayChange={onAutopayChange} />);
    expect(screen.getAllByRole("listitem")[0]?.textContent).toContain("Storage");
    expect(screen.getByRole("switch", { name: "Autopay for Storage" }).getAttribute("aria-checked")).toBe("true");
    await userEvent.click(screen.getByRole("switch", { name: "Autopay for Streaming" }));
    expect(onAutopayChange).toHaveBeenCalledWith("net", true);
    expect(screen.getByRole("switch", { name: "Autopay for Streaming" }).getAttribute("aria-checked")).toBe("true");
  });
});

const USD = { symbol: "USD", decimals: 2 };
const BTC = { symbol: "BTC", decimals: 8 };

describe("SwapCard", () => {
  it("converts between minor units at a rate", () => {
    expect(convertMinor(10_000, 0.00001, USD, BTC)).toBe(100_000);
    expect(convertMinor(0, 2, USD, BTC)).toBe(0);
    expect(convertMinor(100, -1, USD, BTC)).toBe(0);
    expect(formatAssetAmount(1_000_000, BTC)).toBe("0.01000000");
  });

  it("computes the received amount, flips and submits", async () => {
    const onSwap = vi.fn();
    render(<SwapCard from={USD} to={{ symbol: "EUR", decimals: 2 }} rate={0.9} feeBps={100} balance={50_000} onSwap={onSwap} />);
    await userEvent.type(screen.getByLabelText("You pay"), "100");
    expect(screen.getByLabelText("You receive").textContent).toBe("89.10");
    await userEvent.click(screen.getByRole("button", { name: "Swap" }));
    expect(onSwap).toHaveBeenCalledWith(expect.objectContaining({ amount: 10_000, receive: 8910 }));
    await userEvent.click(screen.getByRole("button", { name: "Flip direction" }));
    expect(screen.getByRole("form", { name: "Swap EUR to USD" })).toBeTruthy();
  });

  it("blocks swaps above the balance", async () => {
    render(<SwapCard from={USD} to={BTC} rate={0.00001} balance={1000} />);
    await userEvent.type(screen.getByLabelText("You pay"), "50");
    expect(screen.getByRole("alert").textContent).toMatch(/more than your balance/);
    expect((screen.getByRole("button", { name: "Swap" }) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("AsciiGlobe", () => {
  it("renders a sphere with empty corners and a filled center", () => {
    const lines = renderGlobe(40, 20, 0).split("\n");
    expect(lines).toHaveLength(20);
    expect(lines.every((l) => l.length === 40)).toBe(true);
    expect(lines[0]?.[0]).toBe(" ");
    expect(lines[10]?.[20]).not.toBe(" ");
    expect(globeChar(1.2, 0, 0)).toBe(" ");
  });

  it("changes with rotation", () => {
    expect(renderGlobe(40, 20, 0)).not.toBe(renderGlobe(40, 20, 2));
  });

  it("is an image with a label and draws text", () => {
    render(<AsciiGlobe rows={10} label="Spinning planet" />);
    const globe = screen.getByRole("img", { name: "Spinning planet" });
    expect(globe.textContent?.length).toBeGreaterThan(50);
  });
});

describe("ASCII image and text", () => {
  it("maps luminance to a ramp", () => {
    expect(luminanceChar(0, " .#")).toBe(" ");
    expect(luminanceChar(1, " .#")).toBe("#");
    expect(luminanceChar(1, " .#", true)).toBe(" ");
    expect(luminanceChar(7, " .#")).toBe("#");
  });

  it("converts pixels and sizes rows", () => {
    const px = new Uint8ClampedArray([0, 0, 0, 255, 255, 255, 255, 255, 255, 255, 255, 0, 255, 255, 255, 255]);
    expect(pixelsToAscii(px, 2, 2, { ramp: " #" })).toEqual([" #", " #"]);
    expect(asciiRows(80, 100, 100)).toBe(40);
  });

  it("renders text with the built-in font when canvas is missing", () => {
    const bitmap = fallbackBitmap("HI", 1);
    expect(bitmap.width).toBe(14);
    expect(bitmap.height).toBe(5);
    const lines = renderAsciiText("HI", 5);
    expect(lines).toHaveLength(5);
    expect(lines.join("")).toContain("#");
    render(<AsciiText text="Hello" />);
    expect(screen.getByRole("img", { name: "Hello" })).toBeTruthy();
  });

  it("labels the image and falls back when it cannot load", () => {
    render(<AsciiImage src="/nope.png" alt="A mountain" />);
    expect(screen.getByRole("img", { name: "A mountain" })).toBeTruthy();
  });
});

describe("ASCII field and loader", () => {
  it("computes a bounded field value and a grid", () => {
    expect(fieldValue(0.5, 0.5, 0)).toBeGreaterThanOrEqual(0);
    expect(fieldValue(0.5, 0.5, 0, { x: 0.5, y: 0.5 })).toBeGreaterThan(fieldValue(0.5, 0.5, 0));
    const frame = fieldFrame(12, 4, 0).split("\n");
    expect(frame).toHaveLength(4);
    expect(frame[0]).toHaveLength(12);
  });

  it("renders a decorative field that reacts to the pointer", () => {
    const { container } = render(<AsciiField cols={20} rows={6} />);
    const pre = container.querySelector("pre");
    expect(container.firstElementChild?.getAttribute("aria-hidden")).toBe("true");
    expect(pre?.textContent?.split("\n")).toHaveLength(6);
    fireEvent.pointerMove(container.firstElementChild as Element, { clientX: 10, clientY: 10 });
    expect(pre?.textContent?.length).toBeGreaterThan(0);
  });

  it("cycles loader frames", () => {
    expect(loaderFrame("spinner", 0)).toBe("|");
    expect(loaderFrame("spinner", 5)).toBe("/");
    expect(loaderFrame("bar", 0, 10)).toBe("[===       ]");
    expect(loaderFrame("bar", 7, 10)).toBe("[       ===]");
    expect(loaderFrame("bar", 8, 10)).toBe("[      === ]");
    expect(loaderFrame("wave", 0, 4)).toHaveLength(4);
  });

  it("announces the loader label as a status", () => {
    render(<AsciiLoader label="Fetching rates" showLabel />);
    expect(screen.getByRole("status", { name: "Fetching rates" })).toBeTruthy();
  });

  it("stops the animation frame on unmount", () => {
    const cancel = vi.spyOn(globalThis, "cancelAnimationFrame");
    const { unmount } = render(<AsciiLoader />);
    unmount();
    expect(cancel).toHaveBeenCalled();
    cancel.mockRestore();
  });
});

describe("SpotlightCard", () => {
  it("builds a gradient and follows the pointer", () => {
    expect(spotlightBackground(10, 20, 100, "red")).toBe("radial-gradient(100px circle at 10px 20px, red, transparent 70%)");
    const { container } = render(<SpotlightCard>Plan</SpotlightCard>);
    expect(screen.getByText("Plan")).toBeTruthy();
    const glow = container.querySelector<HTMLElement>("[data-spotlight]");
    fireEvent.pointerMove(container.firstElementChild as Element, { clientX: 30, clientY: 40 });
    expect(glow?.style.opacity).toBe("1");
    fireEvent.pointerLeave(container.firstElementChild as Element);
    expect(glow?.style.opacity).toBe("0");
  });
});

describe("TextScramble and ShinyText", () => {
  it("settles characters left to right and keeps spaces", () => {
    const rand = () => 0;
    expect(scrambleFrame("ab cd", 0, "xyz", rand)).toBe("xx xx");
    expect(scrambleFrame("ab cd", 0.4, "xyz", rand)).toBe("ab xx");
    expect(scrambleFrame("ab cd", 1, "xyz", rand)).toBe("ab cd");
  });

  it("keeps the real text for screen readers and hides the scrambled copy", () => {
    const { container } = render(<TextScramble text="Launch day" />);
    expect(container.querySelector(".sr-only")?.textContent).toBe("Launch day");
    expect(container.querySelector("[aria-hidden]")).toBeTruthy();
  });

  it("settles to the real text", async () => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"] });
    const { container } = render(<TextScramble text="Done" duration={100} />);
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    expect(container.querySelector("[aria-hidden]")?.textContent).toBe("Done");
    vi.useRealTimers();
  });

  it("renders shiny text as real text with a clipped gradient", () => {
    expect(shineStyle("#000", "#fff", 20).backgroundImage).toContain("linear-gradient(110deg, #000 40%, #fff 50%, #000 60%)");
    render(<ShinyText>Upgrade to Pro</ShinyText>);
    expect(screen.getByText("Upgrade to Pro")).toBeTruthy();
  });
});

describe("DotField", () => {
  it("displaces dots near the pointer only", () => {
    expect(dotDisplacement(200, 0, 100)).toEqual({ x: 0, y: 0, scale: 1 });
    const near = dotDisplacement(20, 0, 100);
    expect(near.x).toBeGreaterThan(0);
    expect(near.scale).toBeGreaterThan(1);
    expect(dotDisplacement(0, 0, 100)).toEqual({ x: 0, y: 0, scale: 2.2 });
  });

  it("renders a decorative canvas without a 2d context", () => {
    const { container } = render(<DotField />);
    const canvas = container.querySelector("canvas");
    expect(canvas?.getAttribute("aria-hidden")).toBe("true");
    fireEvent.pointerMove(canvas as Element, { clientX: 5, clientY: 5 });
    fireEvent.pointerLeave(canvas as Element);
  });
});
