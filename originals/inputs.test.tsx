import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Plus, Trash2, Mail } from "lucide-react";
import { BorderBeam, beamGradient } from "./ui/border-beam";
import { MorphButton } from "./ui/morph-button";
import { HoldToConfirm, holdProgress } from "./ui/hold-to-confirm";
import { SpeedDial } from "./ui/speed-dial";
import { ActionBar, selectionLabel, wrapIndex } from "./ui/action-bar";
import { ReactionButton, burstOffsets, formatCount } from "./ui/reaction-button";
import { Select, stepEnabled, typeaheadIndex, type SelectOption } from "./ui/select";
import { RichTextToolbar, toggleFormat } from "./ui/rich-text-toolbar";
import { AddressAutocomplete } from "./ui/address-autocomplete";
import { CardInput, detectBrand, expiryValid, formatCardNumber, formatExpiry, luhnValid } from "./ui/card-input";
import { FileUpload, matchesAccept, validateFiles } from "./ui/file-upload";
import { SignaturePad, hasInk, strokeLength } from "./ui/signature-pad";
import { Keypad, applyKey, maskValue } from "./ui/keypad";
import { AmountInput, formatAmount, parseAmount, sanitizeAmount } from "./ui/amount-input";
import { SegmentedControl, nextEnabled } from "./ui/segmented-control";
import { Slider, ratioOf, snapToStep } from "./ui/slider";
import { DatePicker, addDays, addMonths, formatISO, moveFocus, monthGrid } from "./ui/date-picker";
import { HistogramRange, clampRange, countInRange } from "./ui/histogram-range";
import { TimeSlotPicker, formatSlot, generateSlots, moveSlot } from "./ui/time-slot-picker";
import { ColorPicker, hexToHsv, hsvToHex, normalizeHex } from "./ui/color-picker";
import { PermissionMatrix, columnState, rowState, setColumn, setRow, toggleCell } from "./ui/permission-matrix";
import { PeoplePicker, filterPeople, initials } from "./ui/people-picker";
import { WheelPicker, clampIndex, indexAfterDrag } from "./ui/wheel-picker";
import { ValueStepper, stepValue } from "./ui/value-stepper";
import { DateStrip, stripStart } from "./ui/date-strip";
import { ColorSwatch, isLightColor } from "./ui/color-swatch";

afterEach(cleanup);

const TODAY = new Date(2024, 1, 14);

describe("pure helpers", () => {
  it("action bar and reaction helpers", () => {
    expect(wrapIndex(0, -1, 4)).toBe(3);
    expect(wrapIndex(3, 1, 4)).toBe(0);
    expect(selectionLabel(3)).toBe("3 selected");
    expect(formatCount(999)).toBe("999");
    expect(formatCount(1200)).toBe("1.2k");
    expect(formatCount(15000)).toBe("15k");
    expect(burstOffsets(4, 10)).toEqual([{ x: 0, y: -10 }, { x: 10, y: 0 }, { x: 0, y: 10 }, { x: -10, y: 0 }]);
    expect(holdProgress(600, 1200)).toBe(0.5);
    expect(holdProgress(5000, 1200)).toBe(1);
    expect(beamGradient(90, "red", "blue")).toContain("conic-gradient");
  });

  it("select navigation skips disabled options and types ahead", () => {
    const opts: SelectOption[] = [{ value: "a", label: "Apple" }, { value: "b", label: "Banana", disabled: true }, { value: "c", label: "Cherry" }, { value: "d", label: "Cranberry" }];
    expect(stepEnabled(opts, 0, 1)).toBe(2);
    expect(stepEnabled(opts, 0, -1)).toBe(3);
    expect(typeaheadIndex(opts, "c", 0)).toBe(2);
    expect(typeaheadIndex(opts, "c", 2)).toBe(3);
    expect(typeaheadIndex(opts, "b", 0)).toBe(-1);
  });

  it("card helpers format, detect brand and validate", () => {
    expect(detectBrand("4242")).toBe("visa");
    expect(detectBrand("5555")).toBe("mastercard");
    expect(detectBrand("2221")).toBe("mastercard");
    expect(detectBrand("3782")).toBe("amex");
    expect(detectBrand("6011")).toBe("discover");
    expect(detectBrand("9999")).toBe("unknown");
    expect(formatCardNumber("4242424242424242")).toBe("4242 4242 4242 4242");
    expect(formatCardNumber("378282246310005")).toBe("3782 822463 10005");
    expect(luhnValid("4242 4242 4242 4242")).toBe(true);
    expect(luhnValid("4242 4242 4242 4241")).toBe(false);
    expect(formatExpiry("1230")).toBe("12 / 30");
    expect(formatExpiry("4")).toBe("04");
    expect(expiryValid("01 / 24", new Date(2024, 0, 15))).toBe(true);
    expect(expiryValid("12 / 23", new Date(2024, 0, 15))).toBe(false);
  });

  it("file validation checks type, size and count", () => {
    const f = (name: string, size: number, type: string) => ({ name, size, type });
    expect(matchesAccept(f("a.PNG", 1, ""), ".png,.jpg")).toBe(true);
    expect(matchesAccept(f("a", 1, "image/webp"), "image/*")).toBe(true);
    expect(matchesAccept(f("a.txt", 1, "text/plain"), "image/*")).toBe(false);
    const { accepted, rejected } = validateFiles([f("a.png", 10, "image/png"), f("b.png", 9999, "image/png"), f("c.txt", 1, "text/plain"), f("d.png", 1, "image/png")], { accept: "image/*", maxSize: 100, maxFiles: 1 });
    expect(accepted.map((x) => x.name)).toEqual(["a.png"]);
    expect(rejected.map((r) => r.reason)).toEqual([expect.stringContaining("Larger"), "Unsupported file type", "Too many files"]);
  });

  it("signature, keypad and amount helpers", () => {
    expect(strokeLength([{ x: 0, y: 0 }, { x: 3, y: 4 }])).toBe(5);
    expect(hasInk([[{ x: 0, y: 0 }]])).toBe(false);
    expect(hasInk([[{ x: 0, y: 0 }, { x: 10, y: 0 }]])).toBe(true);
    expect(applyKey("12", "3", 4)).toBe("123");
    expect(applyKey("1234", "5", 4)).toBe("1234");
    expect(applyKey("12", "back", 4)).toBe("1");
    expect(applyKey("12", "x", 4)).toBe("12");
    expect(maskValue("12", 4, true)).toEqual(["•", "•", "", ""]);
    expect(parseAmount("$1,234.567")).toBe(1234.56);
    expect(parseAmount("abc")).toBeNull();
    expect(sanitizeAmount("1.2.3x")).toBe("1.23");
    expect(formatAmount(1234.5)).toBe("1,234.50");
  });

  it("slider, stepper and wheel maths", () => {
    expect(snapToStep(37, 0, 100, 5)).toBe(35);
    expect(snapToStep(0.3, 0, 1, 0.1)).toBe(0.3);
    expect(snapToStep(500, 0, 100, 5)).toBe(100);
    expect(ratioOf(25, 0, 100)).toBe(0.25);
    expect(stepValue(0.1, 0.2, 0, 1, 0.1)).toBe(0.3);
    expect(stepValue(9, 5, 0, 10, 1)).toBe(10);
    expect(clampIndex(9, 3)).toBe(2);
    expect(indexAfterDrag(2, -72, 36, 10)).toBe(4);
    expect(indexAfterDrag(0, 100, 36, 10)).toBe(0);
    expect(nextEnabled([{ value: "a", label: "A" }, { value: "b", label: "B", disabled: true }, { value: "c", label: "C" }], 0, 1)).toBe(2);
  });

  it("date maths builds month grids and moves focus", () => {
    const grid = monthGrid(2024, 1);
    expect(grid).toHaveLength(6);
    expect(grid[0][0].getDay()).toBe(0);
    expect(grid.flat().some((d) => formatISO(d) === "2024-02-29")).toBe(true);
    expect(monthGrid(2024, 1, 1)[0][0].getDay()).toBe(1);
    expect(formatISO(addMonths(new Date(2024, 0, 31), 1))).toBe("2024-02-29");
    expect(formatISO(addDays(new Date(2024, 1, 28), 2))).toBe("2024-03-01");
    expect(formatISO(moveFocus(TODAY, "ArrowDown", false)!)).toBe("2024-02-21");
    expect(formatISO(moveFocus(TODAY, "Home", false)!)).toBe("2024-02-11");
    expect(formatISO(moveFocus(TODAY, "End", false)!)).toBe("2024-02-17");
    expect(formatISO(moveFocus(TODAY, "PageDown", true)!)).toBe("2025-02-14");
    expect(moveFocus(TODAY, "a", false)).toBeNull();
    expect(formatISO(stripStart(new Date(2024, 1, 22), TODAY, 7))).toBe("2024-02-21");
  });

  it("range, slot, color and matrix helpers", () => {
    expect(clampRange([-5, 200], 0, 100)).toEqual([0, 100]);
    expect(countInRange([1, 2, 3, 4], 0, 40, [10, 30])).toBe(5);
    const slots = generateSlots("09:00", "11:00", 30, ["09:30"]);
    expect(slots.map((s) => s.time)).toEqual(["09:00", "09:30", "10:00", "10:30"]);
    expect(slots[1].disabled).toBe(true);
    expect(formatSlot("13:05")).toBe("1:05 PM");
    expect(formatSlot("00:00")).toBe("12:00 AM");
    expect(formatSlot("13:05", false)).toBe("13:05");
    expect(moveSlot(slots, 0, 1)).toBe(2);
    expect(normalizeHex("#ABC")).toBe("#aabbcc");
    expect(normalizeHex("zzz")).toBeNull();
    expect(hsvToHex(hexToHsv("#ff8000"))).toBe("#ff8000");
    expect(hexToHsv("#ff0000")).toEqual({ h: 0, s: 100, v: 100 });
    expect(isLightColor("#ffffff")).toBe(true);
    expect(isLightColor("#101010")).toBe(false);
    const g = toggleCell({}, "r", "a");
    expect(g).toEqual({ r: ["a"] });
    expect(toggleCell(g, "r", "a")).toEqual({ r: [] });
    expect(setRow({}, "r", ["a", "b"], true)).toEqual({ r: ["a", "b"] });
    expect(setColumn({ x: ["a"], y: [] }, "b", ["x", "y"], true)).toEqual({ x: ["a", "b"], y: ["b"] });
    expect(rowState({ r: ["a"] }, "r", ["a", "b"])).toBe("some");
    expect(columnState({ x: ["a"], y: ["a"] }, "a", ["x", "y"])).toBe("all");
    expect(initials("Mara Quill")).toBe("MQ");
    expect(filterPeople([{ id: "1", name: "Mara Quill", email: "m@x.test" }, { id: "2", name: "Tobi Lark" }], "ark")).toHaveLength(1);
    expect(filterPeople([{ id: "1", name: "Mara" }], "", ["1"])).toEqual([]);
    expect(toggleFormat(["bold"], "italic")).toEqual(["bold", "italic"]);
    expect(toggleFormat(["bold"], "bold")).toEqual([]);
  });
});

describe("actions", () => {
  it("border beam renders its content", () => {
    render(<BorderBeam><p>Hello beam</p></BorderBeam>);
    expect(screen.getByText("Hello beam")).toBeTruthy();
  });

  it("morph button goes to success, and to error on rejection", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<MorphButton onAction={async () => {}} />);
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(screen.getAllByText("Saved").length).toBeGreaterThan(0));
    unmount();
    render(<MorphButton onAction={() => Promise.reject(new Error("no"))} />);
    await user.click(screen.getByRole("button"));
    await waitFor(() => expect(screen.getAllByText("Failed, retry").length).toBeGreaterThan(0));
  });

  it("hold to confirm fires only after the full hold", async () => {
    const onConfirm = vi.fn();
    render(<HoldToConfirm onConfirm={onConfirm} duration={80} />);
    const button = screen.getByRole("button", { name: "Hold to delete" });
    fireEvent.keyDown(button, { key: " " });
    fireEvent.keyUp(button, { key: " " });
    await new Promise((r) => setTimeout(r, 120));
    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.keyDown(button, { key: "Enter" });
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
    expect(screen.getAllByText("Deleted").length).toBeGreaterThan(0);
  });

  it("speed dial opens, runs an action and closes on Escape", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<SpeedDial actions={[{ id: "new", label: "New file", icon: Plus, onSelect }, { id: "mail", label: "Email", icon: Mail, onSelect: () => {} }]} />);
    const trigger = screen.getByRole("button", { name: "Quick actions" });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    await user.click(trigger);
    await user.click(await screen.findByRole("menuitem", { name: "New file" }));
    expect(onSelect).toHaveBeenCalled();
    await user.click(trigger);
    await screen.findByRole("menu");
    await user.keyboard("{Escape}");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("action bar hides at zero and roves focus with arrows", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const items = [{ id: "d", label: "Delete", icon: Trash2, onSelect: onDelete, destructive: true }, { id: "m", label: "Move", onSelect: () => {} }];
    const { rerender } = render(<ActionBar items={items} count={0} />);
    expect(screen.queryByRole("toolbar")).toBeNull();
    rerender(<ActionBar items={items} count={3} onDismiss={() => {}} />);
    expect(await screen.findByText("3 selected")).toBeTruthy();
    screen.getByRole("button", { name: "Delete" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Move" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalled();
  });

  it("reaction button toggles and counts", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ReactionButton emoji="❤" label="Love" count={4} onPressedChange={onChange} />);
    const button = screen.getByRole("button", { name: "Love, 4 reactions" });
    expect(button.getAttribute("aria-pressed")).toBe("false");
    await user.click(button);
    expect(onChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole("button", { name: "Love, 5 reactions" }).getAttribute("aria-pressed")).toBe("true");
  });
});

describe("text entry", () => {
  const opts: SelectOption[] = [{ value: "a", label: "Alpha" }, { value: "b", label: "Beta" }, { value: "g", label: "Gamma", disabled: true }];

  it("select opens with the keyboard and picks with Enter", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Select label="Greek" options={opts} onValueChange={onValueChange} />);
    const box = screen.getByRole("combobox", { name: "Greek" });
    box.focus();
    await user.keyboard("{ArrowDown}");
    expect(await screen.findByRole("listbox")).toBeTruthy();
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onValueChange).toHaveBeenCalledWith("b");
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
    expect(box.textContent).toContain("Beta");
  });

  it("select supports typeahead and ignores disabled options", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Select label="Greek" options={opts} onValueChange={onValueChange} defaultValue="a" />);
    screen.getByRole("combobox").focus();
    await user.keyboard("{Enter}b{Enter}");
    expect(onValueChange).toHaveBeenLastCalledWith("b");
    await user.keyboard("{Enter}");
    await user.click(await screen.findByRole("option", { name: "Gamma" }));
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });

  it("rich text toolbar reports commands and active state", async () => {
    const user = userEvent.setup();
    const onCommand = vi.fn();
    render(<RichTextToolbar active={["bold"]} onCommand={onCommand} />);
    expect(screen.getByRole("toolbar", { name: "Text formatting" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Bold" }).getAttribute("aria-pressed")).toBe("true");
    await user.click(screen.getByRole("button", { name: "Italic" }));
    expect(onCommand).toHaveBeenCalledWith("italic");
    screen.getByRole("button", { name: "Bold" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Italic" }));
  });

  it("address autocomplete debounces, lists suggestions and selects with the keyboard", async () => {
    const user = userEvent.setup();
    const getSuggestions = vi.fn(async (q: string) => [{ id: "1", primary: `${q} Orchard Lane`, secondary: "Testville" }, { id: "2", primary: `${q} Harbor Road` }]);
    const onSelect = vi.fn();
    render(<AddressAutocomplete getSuggestions={getSuggestions} onSelect={onSelect} debounceMs={10} />);
    const input = screen.getByRole("combobox", { name: "Address" });
    await user.type(input, "12");
    await screen.findAllByRole("option");
    expect(getSuggestions).toHaveBeenCalledTimes(1);
    expect(getSuggestions).toHaveBeenCalledWith("12");
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "1" }));
    expect((input as HTMLInputElement).value).toContain("Orchard Lane");
  });

  it("card input formats, detects the brand and reports validity", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CardInput onChange={onChange} />);
    await user.type(screen.getByLabelText("Card number"), "4242424242424242");
    expect((screen.getByLabelText("Card number") as HTMLInputElement).value).toBe("4242 4242 4242 4242");
    expect(screen.getByText("Visa")).toBeTruthy();
    await user.type(screen.getByLabelText("Expiry date"), "1299");
    expect((screen.getByLabelText("Expiry date") as HTMLInputElement).value).toBe("12 / 99");
    await user.type(screen.getByLabelText("Security code"), "123");
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ brand: "visa", valid: true, number: "4242424242424242" }));
    await user.clear(screen.getByLabelText("Security code"));
    await user.tab();
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ valid: false }));
  });

  it("file upload adds valid files, rejects others and removes", async () => {
    const onFilesChange = vi.fn();
    render(<FileUpload accept="image/*" maxSize={1000} onFilesChange={onFilesChange} />);
    expect(screen.getByRole("button", { name: /Drop files here/ })).toBeTruthy();
    const input = screen.getByLabelText("Choose files");
    const ok = new File(["x"], "pic.png", { type: "image/png" });
    const bad = new File(["x"], "notes.txt", { type: "text/plain" });
    fireEvent.change(input, { target: { files: [ok, bad] } });
    expect(await screen.findByText("pic.png")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toContain("notes.txt: Unsupported file type");
    expect(onFilesChange).toHaveBeenCalledWith([ok]);
    fireEvent.click(screen.getByRole("button", { name: "Remove pic.png" }));
    expect(screen.queryByText("pic.png")).toBeNull();
  });

  it("signature pad starts empty with disabled controls", () => {
    render(<SignaturePad />);
    expect(screen.getByRole("img", { name: /Signature area/ })).toBeTruthy();
    expect((screen.getByRole("button", { name: "Clear" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("signature pad records strokes and clears them", () => {
    const onChange = vi.fn();
    render(<SignaturePad onChange={onChange} />);
    const canvas = screen.getByRole("img", { name: /Signature area/ });
    fireEvent.pointerDown(canvas, { clientX: 5, clientY: 5, pointerId: 1 });
    fireEvent.pointerMove(canvas, { clientX: 40, clientY: 30, pointerId: 1 });
    fireEvent.pointerUp(canvas, { pointerId: 1 });
    expect((screen.getByRole("button", { name: "Clear" }) as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect((screen.getByRole("button", { name: "Clear" }) as HTMLButtonElement).disabled).toBe(true);
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("keypad collects digits, deletes and submits when full", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Keypad onSubmit={onSubmit} />);
    await user.click(screen.getByRole("button", { name: "1" }));
    await user.click(screen.getByRole("button", { name: "2" }));
    expect(screen.getByRole("status").getAttribute("aria-label")).toBe("2 of 4 digits entered");
    await user.click(screen.getByRole("button", { name: "Delete last digit" }));
    await user.click(screen.getByRole("button", { name: "2" }));
    await user.click(screen.getByRole("button", { name: "3" }));
    await user.click(screen.getByRole("button", { name: "4" }));
    expect(onSubmit).toHaveBeenCalledWith("1234");
  });

  it("keypad accepts physical keyboard digits", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Keypad onValueChange={onValueChange} mask={false} />);
    screen.getByRole("button", { name: "5" }).focus();
    await user.keyboard("79{Backspace}");
    expect(onValueChange).toHaveBeenLastCalledWith("7");
  });

  it("amount input formats on blur and clamps to max", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<AmountInput max={5000} onValueChange={onValueChange} presets={[25, 100]} />);
    const input = screen.getByLabelText("Amount") as HTMLInputElement;
    await user.type(input, "1234.5");
    expect(onValueChange).toHaveBeenLastCalledWith(1234.5);
    await user.tab();
    expect(input.value).toBe("1,234.50");
    await user.click(input);
    await user.clear(input);
    await user.type(input, "99999");
    expect(onValueChange).toHaveBeenLastCalledWith(5000);
    await user.click(screen.getByRole("button", { name: "$25" }));
    expect(onValueChange).toHaveBeenLastCalledWith(25);
  });
});

describe("choice", () => {
  it("segmented control selects with arrows and skips disabled", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<SegmentedControl label="View" defaultValue="day" onValueChange={onValueChange} options={[{ value: "day", label: "Day" }, { value: "week", label: "Week", disabled: true }, { value: "month", label: "Month" }]} />);
    expect(screen.getByRole("radiogroup", { name: "View" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Day" }).getAttribute("aria-checked")).toBe("true");
    screen.getByRole("radio", { name: "Day" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(onValueChange).toHaveBeenCalledWith("month");
    expect(screen.getByRole("radio", { name: "Month" }).getAttribute("aria-checked")).toBe("true");
  });

  it("slider follows the ARIA keyboard contract", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Slider label="Volume" defaultValue={50} step={5} onValueChange={onValueChange} formatValue={(v) => `${v}%`} />);
    const thumb = screen.getByRole("slider", { name: "Volume" });
    expect(thumb.getAttribute("aria-valuetext")).toBe("50%");
    thumb.focus();
    await user.keyboard("{ArrowRight}");
    expect(onValueChange).toHaveBeenLastCalledWith(55);
    await user.keyboard("{Home}");
    expect(thumb.getAttribute("aria-valuenow")).toBe("0");
    await user.keyboard("{End}");
    expect(thumb.getAttribute("aria-valuenow")).toBe("100");
    await user.keyboard("{PageDown}");
    expect(thumb.getAttribute("aria-valuenow")).toBe("90");
  });

  it("date picker opens on the right month and selects with the keyboard", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<DatePicker label="Due date" today={TODAY} defaultValue={TODAY} onValueChange={onValueChange} />);
    await user.click(screen.getByRole("button", { name: /Due date/ }));
    expect(await screen.findByRole("grid", { name: "February 2024" })).toBeTruthy();
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("button", { name: "Wednesday, February 14, 2024" })));
    await user.keyboard("{ArrowRight}{ArrowDown}");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Thursday, February 22, 2024" }));
    await user.keyboard("{PageDown}");
    expect(await screen.findByRole("grid", { name: "March 2024" })).toBeTruthy();
    await user.keyboard("{Enter}");
    expect(formatISO(onValueChange.mock.calls[0][0] as Date)).toBe("2024-03-22");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("date picker disables days outside min and max", async () => {
    const user = userEvent.setup();
    render(<DatePicker today={TODAY} defaultValue={TODAY} min={new Date(2024, 1, 10)} max={new Date(2024, 1, 20)} />);
    await user.click(screen.getByRole("button", { name: /Date/ }));
    expect((await screen.findByRole("button", { name: "Friday, February 9, 2024" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Thursday, February 15, 2024" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("histogram range moves thumbs by keyboard and counts results", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<HistogramRange bins={[1, 2, 3, 4]} min={0} max={40} step={10} defaultValue={[0, 40]} onValueChange={onValueChange} />);
    expect(screen.getByText("10 results")).toBeTruthy();
    const lo = screen.getByRole("slider", { name: "Range minimum" });
    lo.focus();
    await user.keyboard("{ArrowRight}");
    expect(onValueChange).toHaveBeenLastCalledWith([10, 40]);
    expect(screen.getByText("9 results")).toBeTruthy();
    const hi = screen.getByRole("slider", { name: "Range maximum" });
    hi.focus();
    await user.keyboard("{Home}");
    expect(hi.getAttribute("aria-valuenow")).toBe("20");
  });

  it("time slot picker selects and skips unavailable slots", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TimeSlotPicker slots={generateSlots("09:00", "11:00", 30, ["09:30"])} onValueChange={onValueChange} columns={2} />);
    expect((screen.getByRole("radio", { name: "9:30 AM" }) as HTMLButtonElement).disabled).toBe(true);
    await user.click(screen.getByRole("radio", { name: "9:00 AM" }));
    expect(onValueChange).toHaveBeenCalledWith("09:00");
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(screen.getByRole("radio", { name: "10:00 AM" }));
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(screen.getByRole("radio", { name: "10:00 AM" }));
  });

  it("color picker syncs hex input and the area slider", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ColorPicker defaultValue="#ff0000" onValueChange={onValueChange} presets={["#00ff00"]} />);
    const hex = screen.getByLabelText("Hex color") as HTMLInputElement;
    expect(hex.value).toBe("#ff0000");
    await user.clear(hex);
    await user.type(hex, "0f0{Enter}");
    expect(onValueChange).toHaveBeenLastCalledWith("#00ff00");
    const area = screen.getByRole("slider", { name: "Saturation and brightness" });
    expect(area.getAttribute("aria-valuetext")).toBe("Saturation 100%, brightness 100%");
    area.focus();
    await user.keyboard("{ArrowLeft}{ArrowDown}");
    expect(onValueChange).toHaveBeenLastCalledWith("#03fc03");
    await user.click(screen.getByRole("button", { name: "Use #00ff00" }));
    expect((screen.getByLabelText("Hex color") as HTMLInputElement).value).toBe("#00ff00");
  });

  it("permission matrix toggles cells, rows and columns", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <PermissionMatrix
        rows={[{ id: "editor", label: "Editor" }, { id: "viewer", label: "Viewer" }, { id: "owner", label: "Owner" }]}
        columns={[{ id: "read", label: "Read" }, { id: "write", label: "Write" }]}
        defaultValue={{ owner: ["read", "write"] }}
        lockedRows={["owner"]}
        onValueChange={onValueChange}
      />,
    );
    await user.click(screen.getByRole("checkbox", { name: "Editor: Read" }));
    expect(onValueChange).toHaveBeenLastCalledWith({ owner: ["read", "write"], editor: ["read"] });
    expect((screen.getByRole("checkbox", { name: "Editor: all permissions" }) as HTMLInputElement).indeterminate).toBe(true);
    await user.click(screen.getByRole("checkbox", { name: "Grant Write to all" }));
    expect((screen.getByRole("checkbox", { name: "Viewer: Write" }) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByRole("checkbox", { name: "Owner: Read" }) as HTMLInputElement).disabled).toBe(true);
  });

  it("people picker filters, adds chips and removes with Backspace", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const people = [{ id: "1", name: "Mara Quill", email: "mara@example.test" }, { id: "2", name: "Tobi Lark", email: "tobi@example.test" }];
    render(<PeoplePicker people={people} onValueChange={onValueChange} />);
    const input = screen.getByRole("combobox", { name: "People" });
    await user.type(input, "lar");
    expect(screen.getAllByRole("option")).toHaveLength(1);
    await user.keyboard("{Enter}");
    expect(onValueChange).toHaveBeenLastCalledWith(["2"]);
    expect(screen.getByRole("button", { name: "Remove Tobi Lark" })).toBeTruthy();
    await user.keyboard("{Backspace}");
    expect(onValueChange).toHaveBeenLastCalledWith([]);
  });

  it("people picker stops accepting people at max", async () => {
    const user = userEvent.setup();
    render(<PeoplePicker people={[{ id: "1", name: "Mara Quill" }, { id: "2", name: "Tobi Lark" }]} max={1} defaultValue={["1"]} />);
    expect((screen.getByRole("combobox") as HTMLInputElement).disabled).toBe(true);
    await user.click(screen.getByRole("button", { name: "Remove Mara Quill" }));
    expect((screen.getByRole("combobox") as HTMLInputElement).disabled).toBe(false);
  });

  it("wheel picker steps with arrows and by click", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const options = ["Jan", "Feb", "Mar", "Apr"].map((m) => ({ value: m, label: m }));
    render(<WheelPicker label="Month" options={options} defaultValue="Feb" onValueChange={onValueChange} />);
    const list = screen.getByRole("listbox", { name: "Month" });
    expect(screen.getByRole("option", { name: "Feb" }).getAttribute("aria-selected")).toBe("true");
    list.focus();
    await user.keyboard("{ArrowDown}");
    expect(onValueChange).toHaveBeenLastCalledWith("Mar");
    await user.keyboard("{End}");
    expect(onValueChange).toHaveBeenLastCalledWith("Apr");
    await user.click(screen.getByRole("option", { name: "Jan" }));
    expect(onValueChange).toHaveBeenLastCalledWith("Jan");
  });

  it("value stepper clicks, clamps and handles the keyboard", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ValueStepper label="Guests" defaultValue={1} min={1} max={3} onValueChange={onValueChange} formatValue={(n) => `${n} guests`} />);
    const spin = screen.getByRole("spinbutton", { name: "Guests" });
    expect(spin.getAttribute("aria-valuetext")).toBe("1 guests");
    expect((screen.getByRole("button", { name: "Decrease Guests" }) as HTMLButtonElement).disabled).toBe(true);
    await user.click(screen.getByRole("button", { name: "Increase Guests" }));
    expect(onValueChange).toHaveBeenLastCalledWith(2);
    spin.focus();
    await user.keyboard("{ArrowUp}{ArrowUp}");
    expect(spin.getAttribute("aria-valuenow")).toBe("3");
    expect(onValueChange).toHaveBeenCalledTimes(2);
    await user.keyboard("{Home}");
    expect(spin.getAttribute("aria-valuenow")).toBe("1");
  });

  it("date strip shows a week, selects and pages", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<DateStrip today={TODAY} defaultValue={TODAY} onValueChange={onValueChange} />);
    expect(screen.getAllByRole("radio")).toHaveLength(7);
    expect(screen.getByRole("radio", { name: /February 14, 2024/ }).getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("radio", { name: /February 14, 2024/ }).getAttribute("aria-current")).toBe("date");
    await user.click(screen.getByRole("radio", { name: /February 16, 2024/ }));
    expect(formatISO(onValueChange.mock.calls[0][0] as Date)).toBe("2024-02-16");
    await user.click(screen.getByRole("button", { name: "Next days" }));
    expect(screen.getByRole("radio", { name: /February 22, 2024/ })).toBeTruthy();
    screen.getByRole("radio", { name: /February 22, 2024/ }).focus();
    await user.keyboard("{ArrowRight}");
  });

  it("color swatch selects by click and arrow", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ColorSwatch label="Accent" defaultValue="#ff0000" onValueChange={onValueChange} swatches={[{ value: "#ff0000", label: "Red" }, { value: "#00ff00", label: "Green" }, { value: "#0000ff", label: "Blue" }]} />);
    expect(screen.getByRole("radio", { name: "Red" }).getAttribute("aria-checked")).toBe("true");
    await user.click(screen.getByRole("radio", { name: "Blue" }));
    expect(onValueChange).toHaveBeenLastCalledWith("#0000ff");
    await user.keyboard("{ArrowRight}");
    expect(onValueChange).toHaveBeenLastCalledWith("#ff0000");
  });
});
