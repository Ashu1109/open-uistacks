import { useRef, useState, type ReactNode } from "react";
import { useDemoView } from "../demo";
import { Archive, Copy, Download, FilePlus, Image as ImageIcon, Share2, Trash2 } from "lucide-react";
import { ActionBar } from "../../originals/ui/action-bar";
import { AddressAutocomplete, type AddressSuggestion } from "../../originals/ui/address-autocomplete";
import { AmountInput } from "../../originals/ui/amount-input";
import { BorderBeam } from "../../originals/ui/border-beam";
import { CardInput } from "../../originals/ui/card-input";
import { ColorPicker } from "../../originals/ui/color-picker";
import { ColorSwatch } from "../../originals/ui/color-swatch";
import { DatePicker } from "../../originals/ui/date-picker";
import { DateStrip } from "../../originals/ui/date-strip";
import { FileUpload } from "../../originals/ui/file-upload";
import { HistogramRange } from "../../originals/ui/histogram-range";
import { HoldToConfirm } from "../../originals/ui/hold-to-confirm";
import { Keypad } from "../../originals/ui/keypad";
import { MorphButton } from "../../originals/ui/morph-button";
import { PeoplePicker } from "../../originals/ui/people-picker";
import { PermissionMatrix } from "../../originals/ui/permission-matrix";
import { ReactionButton } from "../../originals/ui/reaction-button";
import { RichTextToolbar, type FormatCommand } from "../../originals/ui/rich-text-toolbar";
import { SegmentedControl } from "../../originals/ui/segmented-control";
import { Select } from "../../originals/ui/select";
import { SignaturePad } from "../../originals/ui/signature-pad";
import { Slider } from "../../originals/ui/slider";
import { SpeedDial } from "../../originals/ui/speed-dial";
import { TimeSlotPicker, generateSlots } from "../../originals/ui/time-slot-picker";
import { ValueStepper } from "../../originals/ui/value-stepper";
import { WheelPicker } from "../../originals/ui/wheel-picker";

function Demo({ title, slug, children }: { title: string; slug: string; children: ReactNode }) {
  const view = useDemoView(slug);
  if (view === "hidden") return null;
  if (view === "bare") return <div data-demo className="col-span-full w-full min-w-0">{children}</div>;
  return (
    <section id={slug} className="grid gap-3">
      <h3 className="text-sm font-medium text-fg-muted">{title}</h3>
      <div className="rounded-[20px] bg-subtle/50 p-6">{children}</div>
    </section>
  );
}

const PLACES: AddressSuggestion[] = [
  { id: "1", primary: "14 Willow Court", secondary: "Fernhill, Testland" },
  { id: "2", primary: "220 Willow Street", secondary: "Brookvale, Testland" },
  { id: "3", primary: "8 Maple Terrace", secondary: "Fernhill, Testland" },
  { id: "4", primary: "51 Harbor Lane", secondary: "Port Example, Testland" },
  { id: "5", primary: "7 Lantern Row", secondary: "Brookvale, Testland" },
];

const suggest = async (query: string) => {
  await new Promise((r) => setTimeout(r, 250));
  return PLACES.filter((p) => `${p.primary} ${p.secondary}`.toLowerCase().includes(query.toLowerCase()));
};

const FORMAT_TAGS: Record<FormatCommand, string> = { bold: "bold", italic: "italic", underline: "underline", strike: "strikeThrough", code: "", link: "", bulletList: "insertUnorderedList", orderedList: "insertOrderedList" };

function RichTextDemo() {
  const [active, setActive] = useState<FormatCommand[]>([]);
  const editor = useRef<HTMLDivElement>(null);
  const refresh = () => {
    const on = (Object.keys(FORMAT_TAGS) as FormatCommand[]).filter((c) => FORMAT_TAGS[c] && document.queryCommandState(FORMAT_TAGS[c]));
    setActive(on);
  };
  const run = (command: FormatCommand) => {
    editor.current?.focus();
    if (FORMAT_TAGS[command]) document.execCommand(FORMAT_TAGS[command]);
    refresh();
  };
  return (
    <div className="grid gap-3">
      <RichTextToolbar active={active} onCommand={run} />
      <div ref={editor} contentEditable suppressContentEditableWarning role="textbox" aria-multiline aria-label="Note" onKeyUp={refresh} onMouseUp={refresh} className="min-h-24 max-w-lg rounded-[14px] bg-surface p-3 text-sm text-fg shadow-[var(--shadow-card)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)]">
        Select some of this text and use the toolbar to format it.
      </div>
    </div>
  );
}

const ROLES = [{ id: "admin", label: "Admin", description: "Full control" }, { id: "editor", label: "Editor", description: "Create and change" }, { id: "viewer", label: "Viewer", description: "Read only" }];
const PERMISSIONS = [{ id: "read", label: "Read" }, { id: "write", label: "Write" }, { id: "share", label: "Share" }, { id: "delete", label: "Delete" }];
const PEOPLE = [
  { id: "1", name: "Mara Quill", email: "mara@example.test" },
  { id: "2", name: "Tobi Lark", email: "tobi@example.test" },
  { id: "3", name: "Isla Fenn", email: "isla@example.test" },
  { id: "4", name: "Noor Calder", email: "noor@example.test" },
  { id: "5", name: "Ezra Vane", email: "ezra@example.test" },
];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m) => ({ value: m, label: m }));
const SWATCHES = [
  { value: "#e5484d", label: "Red" }, { value: "#f76b15", label: "Orange" }, { value: "#f5d90a", label: "Yellow" }, { value: "#30a46c", label: "Green" },
  { value: "#1e6af1", label: "Blue" }, { value: "#8e4ec6", label: "Purple" }, { value: "#18181b", label: "Black" }, { value: "#f4f4f5", label: "Light gray" },
];

export function Section() {
  const [selected, setSelected] = useState(3);
  const [pin, setPin] = useState("");
  const [slot, setSlot] = useState<string | null>(null);
  return (
    <div className="grid gap-10">
      <Demo title="Border beam" slug="border-beam">
        <BorderBeam className="max-w-sm">
          <div className="p-5">
            <p className="text-sm font-medium text-fg">Daily summary is ready</p>
            <p className="mt-1 text-sm text-fg-muted">A beam of light travels around the edge to draw the eye.</p>
          </div>
        </BorderBeam>
      </Demo>
      <Demo title="Morph button" slug="morph-button">
        <div className="flex flex-wrap gap-3">
          <MorphButton onAction={() => new Promise((r) => setTimeout(r, 1200))} />
          <MorphButton labels={{ idle: "Send invite", loading: "Sending", error: "Could not send" }} onAction={() => new Promise((_, reject) => setTimeout(() => reject(new Error("offline")), 1000))} />
        </div>
      </Demo>
      <Demo title="Hold to confirm" slug="hold-to-confirm">
        <HoldToConfirm onConfirm={() => {}} label="Hold to delete project" />
      </Demo>
      <Demo title="Speed dial" slug="speed-dial">
        <div className="flex h-56 items-end justify-end">
          <SpeedDial actions={[{ id: "file", label: "New file", icon: FilePlus, onSelect: () => {} }, { id: "image", label: "Upload image", icon: ImageIcon, onSelect: () => {} }, { id: "share", label: "Share link", icon: Share2, onSelect: () => {} }]} />
        </div>
      </Demo>
      <Demo title="Action bar" slug="action-bar">
        <div className="flex h-24 flex-col items-start justify-center gap-4">
          <ActionBar count={selected} onDismiss={() => setSelected(0)} items={[{ id: "copy", label: "Copy", icon: Copy, onSelect: () => {} }, { id: "archive", label: "Archive", icon: Archive, onSelect: () => {} }, { id: "export", label: "Export", icon: Download, onSelect: () => {} }, { id: "delete", label: "Delete", icon: Trash2, onSelect: () => {}, destructive: true }]} />
          {selected === 0 && <button type="button" onClick={() => setSelected(3)} className="rounded-full bg-surface px-4 py-1.5 text-sm text-fg shadow-[var(--shadow-card)]">Select 3 rows</button>}
        </div>
      </Demo>
      <Demo title="Reaction button" slug="reaction-button">
        <div className="flex gap-2">
          <ReactionButton emoji="❤️" label="Love" count={128} />
          <ReactionButton emoji="🎉" label="Celebrate" count={14} defaultPressed />
          <ReactionButton emoji="👀" label="Looking" count={1500} />
        </div>
      </Demo>
      <Demo title="Select" slug="select">
        <Select label="Region" placeholder="Choose a region" options={[{ value: "eu", label: "Europe", description: "Frankfurt" }, { value: "us", label: "North America", description: "Virginia" }, { value: "ap", label: "Asia Pacific", description: "Singapore" }, { value: "af", label: "Africa", description: "Coming soon", disabled: true }]} />
      </Demo>
      <Demo title="Rich text toolbar" slug="rich-text-toolbar">
        <RichTextDemo />
      </Demo>
      <Demo title="Address autocomplete" slug="address-autocomplete">
        <AddressAutocomplete getSuggestions={suggest} onSelect={() => {}} placeholder="Try &quot;willow&quot;" />
      </Demo>
      <Demo title="Card input" slug="card-input">
        <div className="grid gap-2">
          <CardInput />
          <p className="text-xs text-fg-subtle">Test number: 4242 4242 4242 4242. Nothing is sent anywhere.</p>
        </div>
      </Demo>
      <Demo title="File upload" slug="file-upload">
        <FileUpload accept="image/*,.pdf" maxSize={5 * 1024 * 1024} maxFiles={4} />
      </Demo>
      <Demo title="Signature pad" slug="signature-pad">
        <SignaturePad />
      </Demo>
      <Demo title="Keypad" slug="keypad">
        <div className="grid gap-3">
          <Keypad value={pin} onValueChange={setPin} onSubmit={() => {}} label="Enter your PIN" />
        </div>
      </Demo>
      <Demo title="Amount input" slug="amount-input">
        <AmountInput presets={[10, 25, 50, 100]} defaultValue={25} max={10000} />
      </Demo>
      <Demo title="Segmented control" slug="segmented-control">
        <SegmentedControl label="Range" defaultValue="week" options={[{ value: "day", label: "Day" }, { value: "week", label: "Week" }, { value: "month", label: "Month" }, { value: "year", label: "Year", disabled: true }]} />
      </Demo>
      <Demo title="Slider" slug="slider">
        <Slider label="Creativity" defaultValue={40} step={5} marks={4} formatValue={(v) => `${v}%`} />
      </Demo>
      <Demo title="Date picker" slug="date-picker">
        <div className="h-96"><DatePicker label="Due date" /></div>
      </Demo>
      <Demo title="Histogram range" slug="histogram-range">
        <HistogramRange label="Price" bins={[2, 4, 9, 14, 20, 17, 12, 8, 5, 3, 1, 1]} min={0} max={240} step={10} defaultValue={[40, 160]} formatValue={(v) => `$${v}`} />
      </Demo>
      <Demo title="Time slot picker" slug="time-slot-picker">
        <div className="grid gap-3">
          <TimeSlotPicker slots={generateSlots("09:00", "13:00", 30, ["09:30", "11:00", "12:00"])} value={slot} onValueChange={setSlot} />
          <p aria-live="polite" className="text-xs text-fg-muted">{slot ? `Booked for ${slot}` : "No time chosen yet"}</p>
        </div>
      </Demo>
      <Demo title="Color picker" slug="color-picker">
        <ColorPicker presets={["#e5484d", "#f76b15", "#30a46c", "#1e6af1", "#8e4ec6"]} />
      </Demo>
      <Demo title="Permission matrix" slug="permission-matrix">
        <PermissionMatrix rows={ROLES} columns={PERMISSIONS} lockedRows={["admin"]} defaultValue={{ admin: ["read", "write", "share", "delete"], editor: ["read", "write"], viewer: ["read"] }} className="max-w-xl" />
      </Demo>
      <Demo title="People picker" slug="people-picker">
        <PeoplePicker people={PEOPLE} defaultValue={["1"]} placeholder="Add teammates" />
      </Demo>
      <Demo title="Wheel picker" slug="wheel-picker">
        <WheelPicker label="Month" options={MONTHS} defaultValue="March" />
      </Demo>
      <Demo title="Value stepper" slug="value-stepper">
        <ValueStepper label="Guests" defaultValue={2} min={1} max={12} formatValue={(n) => `${n} ${n === 1 ? "guest" : "guests"}`} />
      </Demo>
      <Demo title="Date strip" slug="date-strip">
        <DateStrip defaultValue={new Date()} />
      </Demo>
      <Demo title="Color swatch" slug="color-swatch">
        <ColorSwatch label="Label color" swatches={SWATCHES} defaultValue="#1e6af1" />
      </Demo>
    </div>
  );
}
