import { useState } from "react";
import { Bell, FileText, Folder, FolderOpen, Home, Inbox, Settings, Star } from "lucide-react";
import { Accordion } from "../../registry/ui/accordion";
import { AlertBanner } from "../../registry/ui/alert-banner";
import { Badge } from "../../registry/ui/badge";
import { Breadcrumbs } from "../../registry/ui/breadcrumbs";
import { Checkbox, type CheckedState } from "../../registry/ui/checkbox";
import { Combobox } from "../../registry/ui/combobox";
import { DateChip } from "../../registry/ui/date-chip";
import { EmptyState } from "../../registry/ui/empty-state";
import { FilterChips } from "../../registry/ui/filter-chips";
import { Pagination } from "../../registry/ui/pagination";
import { Popover } from "../../registry/ui/popover";
import { PRIORITIES, PRIORITY_LABELS, PriorityIcon } from "../../registry/ui/priority-icon";
import { Progress } from "../../registry/ui/progress";
import { QuantityStepper } from "../../registry/ui/quantity-stepper";
import { RadioGroup } from "../../registry/ui/radio-group";
import { Rating } from "../../registry/ui/rating";
import { Skeleton, SkeletonGroup, SkeletonLayout } from "../../registry/ui/skeleton";
import { STATUS_LABELS, StatusIcon, WORKFLOW_STATUSES } from "../../registry/ui/status-icon";
import { StepSlider } from "../../registry/ui/step-slider";
import { Switch } from "../../registry/ui/switch";
import { Tabs } from "../../registry/ui/tabs";
import { ThemeToggle, type ThemeMode } from "../../registry/ui/theme-toggle";
import { Tooltip } from "../../registry/ui/tooltip";
import { TreeView, type TreeNode } from "../../registry/ui/tree-view";
import { Demo } from "../demo";

function CheckboxDemo() {
  const [all, setAll] = useState<CheckedState>("mixed");
  const [items, setItems] = useState([true, false, false]);
  const names = ["Email digest", "Push alerts", "Weekly summary"];
  const n = items.filter(Boolean).length;
  const state: CheckedState = n === 0 ? false : n === items.length ? true : "mixed";
  return (
    <div className="grid gap-3">
      <Checkbox
        label="All notifications"
        checked={all === "mixed" ? state : all}
        onCheckedChange={(v) => {
          setAll(v);
          setItems(items.map(() => v));
        }}
      />
      <div className="grid gap-2 pl-6">
        {names.map((name, i) => (
          <Checkbox
            key={name}
            size="sm"
            label={name}
            checked={items[i]}
            onCheckedChange={(v) => {
              setAll("mixed");
              setItems(items.map((x, j) => (j === i ? v : x)));
            }}
          />
        ))}
      </div>
    </div>
  );
}

function RadioDemo() {
  const [plan, setPlan] = useState("pro");
  return (
    <RadioGroup
      label="Plan"
      layout="cards"
      value={plan}
      onValueChange={setPlan}
      options={[
        { value: "free", label: "Starter", description: "For side projects", meta: "$0" },
        { value: "pro", label: "Pro", description: "For small teams", meta: "$12" },
        { value: "team", label: "Business", description: "Advanced controls", meta: "$40" },
      ]}
    />
  );
}

function SwitchDemo() {
  const [on, setOn] = useState(true);
  return <Switch checked={on} onCheckedChange={setOn} label="Auto-save drafts" description="Save changes every few seconds" />;
}

function ComboboxDemo() {
  const [v, setV] = useState("");
  return (
    <div className="max-w-xs">
      <Combobox
        label="Timezone"
        placeholder="Search timezones"
        value={v}
        onValueChange={setV}
        options={[
          { value: "utc", label: "UTC", meta: "+00:00" },
          { value: "ny", label: "New York", meta: "-05:00" },
          { value: "ldn", label: "London", meta: "+00:00" },
          { value: "ber", label: "Berlin", meta: "+01:00" },
          { value: "tok", label: "Tokyo", meta: "+09:00" },
          { value: "syd", label: "Sydney", meta: "+11:00" },
        ]}
      />
    </div>
  );
}

function StepperDemo() {
  const [q, setQ] = useState(2);
  return (
    <div className="flex items-center gap-4">
      <QuantityStepper value={q} onValueChange={setQ} min={1} max={10} />
      <span className="text-sm text-fg-muted">{q} in cart</span>
    </div>
  );
}

function RatingDemo() {
  const [r, setR] = useState(4);
  return (
    <div className="grid gap-3">
      <Rating value={r} onValueChange={setR} showValue count={128} aria-label="Rate this product" />
      <Rating value={4.5} readOnly size="sm" showValue />
    </div>
  );
}

function FilterChipsDemo() {
  const [v, setV] = useState<string[]>(["open"]);
  return (
    <FilterChips
      multiple
      all
      value={v}
      onValueChange={setV}
      options={[
        { value: "open", label: "Open", count: 12 },
        { value: "review", label: "In review", count: 4 },
        { value: "done", label: "Done", count: 31 },
        { value: "blocked", label: "Blocked", count: 2 },
      ]}
    />
  );
}

function StepSliderDemo() {
  const [v, setV] = useState("balanced");
  return (
    <div className="max-w-sm">
      <StepSlider
        label="Quality"
        levels={[
          { value: "fast", label: "Fast" },
          { value: "balanced", label: "Balanced" },
          { value: "high", label: "High" },
          { value: "max", label: "Maximum" },
        ]}
        value={v}
        onValueChange={setV}
        startLabel="Faster"
        endLabel="Sharper"
        recommended="balanced"
      />
    </div>
  );
}

function ThemeToggleDemo() {
  const [m, setM] = useState<ThemeMode>("light");
  return (
    <div className="flex flex-wrap items-center gap-4">
      <ThemeToggle value={m} onValueChange={setM} aria-label="Theme" />
      <ThemeToggle defaultValue="dark" content="labels" aria-label="Theme with labels" />
    </div>
  );
}

function TabsDemo() {
  return (
    <Tabs
      label="Project sections"
      items={[
        { value: "overview", label: "Overview", content: <p className="pt-3 text-sm text-fg-muted">A summary of activity this week.</p> },
        { value: "tasks", label: "Tasks", count: 8, content: <p className="pt-3 text-sm text-fg-muted">Eight tasks are open.</p> },
        { value: "files", label: "Files", content: <p className="pt-3 text-sm text-fg-muted">No new files.</p> },
        { value: "archive", label: "Archive", disabled: true },
      ]}
    />
  );
}

function AccordionDemo() {
  return (
    <Accordion
      variant="contained"
      defaultValue={["a"]}
      items={[
        { value: "a", title: "What is included?", content: "Unlimited projects, shared libraries and priority support." },
        { value: "b", title: "Can I cancel anytime?", content: "Yes, cancel from settings and keep access until the period ends." },
        { value: "c", title: "Do you offer refunds?", content: "Within 14 days of purchase, no questions asked." },
      ]}
    />
  );
}

function PaginationDemo() {
  const [p, setP] = useState(4);
  return <Pagination total={248} page={p} onPageChange={setP} defaultPageSize={10} showRange itemLabel="results" />;
}

function BreadcrumbsDemo() {
  return (
    <Breadcrumbs
      maxItems={4}
      items={[
        { label: "Home", href: "#", icon: <Home size={16} /> },
        { label: "Projects", href: "#" },
        { label: "Website", href: "#" },
        { label: "Design", href: "#" },
        { label: "Homepage" },
      ]}
      onNavigate={(_i, _n, e) => e.preventDefault()}
    />
  );
}

const TREE: TreeNode[] = [
  {
    id: "src",
    label: "src",
    icon: <FolderOpen size={16} />,
    children: [
      { id: "app", label: "App.tsx", icon: <FileText size={16} />, badge: "M", badgeLabel: "Modified", badgeTone: "warning" },
      { id: "main", label: "main.tsx", icon: <FileText size={16} /> },
      { id: "lib", label: "lib", icon: <Folder size={16} />, children: [{ id: "utils", label: "utils.ts", icon: <FileText size={16} />, badge: "A", badgeLabel: "Added", badgeTone: "success" }] },
    ],
  },
  { id: "pkg", label: "package.json", icon: <FileText size={16} /> },
];

function TreeDemo() {
  const [sel, setSel] = useState<string | null>("app");
  return (
    <div className="max-w-xs">
      <TreeView items={TREE} value={sel} onValueChange={setSel} defaultExpanded={["src"]} aria-label="Project files" />
    </div>
  );
}

const btn = "rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-subtle";

function TooltipDemo() {
  return (
    <div className="flex gap-3">
      <Tooltip content="Mark as favorite" shortcut={["F"]}>
        <button className={btn} aria-label="Favorite"><Star size={16} /></button>
      </Tooltip>
      <Tooltip title="Notifications" content="Choose what you hear about" placement="bottom">
        <button className={btn} aria-label="Notifications"><Bell size={16} /></button>
      </Tooltip>
    </div>
  );
}

function PopoverDemo() {
  return (
    <Popover
      title="Share project"
      description="Anyone with the link can view."
      trigger={<button className={btn}><Settings size={14} className="mr-1.5 inline" />Options</button>}
    >
      {({ close }) => (
        <div className="grid gap-2">
          <input aria-label="Share link" readOnly value="https://example.com/p/42" className="h-9 rounded-lg border border-line bg-transparent px-3 text-sm" />
          <button className={btn} onClick={close}>Copy and close</button>
        </div>
      )}
    </Popover>
  );
}

function BadgeDemo() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone="success" dot>Active</Badge>
      <Badge tone="warning" variant="outline">Pending</Badge>
      <Badge tone="danger" variant="solid">Failed</Badge>
      <Badge tone="accent" icon={<Inbox size={12} />}>12 new</Badge>
      <Badge tone="pro">Pro</Badge>
      <Badge live tone="success">Live</Badge>
    </div>
  );
}

function ProgressDemo() {
  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="min-w-56 flex-1"><Progress value={64} label="Uploading" showValue tone="accent" /></div>
      <Progress type="circle" value={82} tone="success" showValue aria-label="Storage used" />
    </div>
  );
}

function SkeletonDemo() {
  return (
    <div className="grid gap-5">
      <SkeletonGroup label="Loading profile">
        <div className="flex items-center gap-3">
          <Skeleton shape="circle" width={40} height={40} />
          <div className="grid gap-2"><Skeleton width={160} /><Skeleton width={100} /></div>
        </div>
      </SkeletonGroup>
      <SkeletonLayout layout="list" rows={2} />
    </div>
  );
}

function EmptyDemo() {
  return (
    <EmptyState
      variant="first-use"
      title="No projects yet"
      description="Create your first project to start collaborating."
      primaryAction={{ label: "New project", onClick: () => {} }}
      secondaryAction={{ label: "Import", onClick: () => {} }}
      size="sm"
    />
  );
}

function AlertDemo() {
  return (
    <div className="grid gap-3">
      <AlertBanner variant="warning" title="Your trial ends in 3 days" action={{ label: "Upgrade", onClick: () => {} }} dismissible>
        Add a payment method to keep your projects.
      </AlertBanner>
      <AlertBanner variant="success" title="Changes published" />
    </div>
  );
}

function PriorityDemo() {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2">
      {PRIORITIES.map((p) => (
        <span key={p} className="inline-flex items-center gap-1.5 text-sm"><PriorityIcon priority={p} />{PRIORITY_LABELS[p]}</span>
      ))}
    </div>
  );
}

function StatusDemo() {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2">
      {WORKFLOW_STATUSES.map((s) => (
        <span key={s} className="inline-flex items-center gap-1.5 text-sm"><StatusIcon status={s} />{STATUS_LABELS[s]}</span>
      ))}
    </div>
  );
}

function DateChipDemo() {
  const now = "2026-06-10T12:00:00Z";
  return (
    <div className="flex flex-wrap gap-2">
      <DateChip date="2026-06-20" now={now} variant="pill" />
      <DateChip date="2026-06-11" now={now} variant="pill" />
      <DateChip date="2026-06-02" now={now} variant="pill" />
      <DateChip date="2026-06-05" doneAt="2026-06-04" now={now} variant="pill" />
    </div>
  );
}

export function Section() {
  return (
    <div className="grid gap-8">
      <Demo title="Checkbox" slug="checkbox"><CheckboxDemo /></Demo>
      <Demo title="Radio group" slug="radio-group"><RadioDemo /></Demo>
      <Demo title="Switch" slug="switch"><SwitchDemo /></Demo>
      <Demo title="Combobox" slug="combobox"><ComboboxDemo /></Demo>
      <Demo title="Quantity stepper" slug="quantity-stepper"><StepperDemo /></Demo>
      <Demo title="Rating" slug="rating"><RatingDemo /></Demo>
      <Demo title="Filter chips" slug="filter-chips"><FilterChipsDemo /></Demo>
      <Demo title="Step slider" slug="step-slider"><StepSliderDemo /></Demo>
      <Demo title="Theme toggle" slug="theme-toggle"><ThemeToggleDemo /></Demo>
      <Demo title="Tabs" slug="tabs"><TabsDemo /></Demo>
      <Demo title="Accordion" slug="accordion"><AccordionDemo /></Demo>
      <Demo title="Pagination" slug="pagination"><PaginationDemo /></Demo>
      <Demo title="Breadcrumbs" slug="breadcrumbs"><BreadcrumbsDemo /></Demo>
      <Demo title="Tree view" slug="tree-view"><TreeDemo /></Demo>
      <Demo title="Tooltip" slug="tooltip"><TooltipDemo /></Demo>
      <Demo title="Popover" slug="popover"><PopoverDemo /></Demo>
      <Demo title="Badge" slug="badge"><BadgeDemo /></Demo>
      <Demo title="Progress" slug="progress"><ProgressDemo /></Demo>
      <Demo title="Skeleton" slug="skeleton"><SkeletonDemo /></Demo>
      <Demo title="Empty state" slug="empty-state"><EmptyDemo /></Demo>
      <Demo title="Alert banner" slug="alert-banner"><AlertDemo /></Demo>
      <Demo title="Priority icon" slug="priority-icon"><PriorityDemo /></Demo>
      <Demo title="Status icon" slug="status-icon"><StatusDemo /></Demo>
      <Demo title="Date chip" slug="date-chip"><DateChipDemo /></Demo>
    </div>
  );
}
