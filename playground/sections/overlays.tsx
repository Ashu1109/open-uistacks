import { useState, type ReactNode } from "react";
import { useDemoView } from "../demo";
import { Archive, Calendar, Copy, FileText, Folder, Home, Inbox, Image as ImageIcon, LayoutDashboard, Mail, MessageSquare, Search, Settings, Trash2, User, Users } from "lucide-react";
import { AppSwitcher } from "../../originals/ui/app-switcher";
import { BottomSheet } from "../../originals/ui/bottom-sheet";
import { BottomTabBar } from "../../originals/ui/bottom-tab-bar";
import { Coachmark } from "../../originals/ui/coachmark";
import { CommandPalette, type Command } from "../../originals/ui/command-palette";
import { ContextMenu } from "../../originals/ui/context-menu";
import { Dialog } from "../../originals/ui/dialog";
import { DisplayOptions, type DisplayValue } from "../../originals/ui/display-options";
import { Dock } from "../../originals/ui/dock";
import { DropdownMenu } from "../../originals/ui/dropdown-menu";
import { FilterBar, type FilterValue } from "../../originals/ui/filter-bar";
import { ForecastAlert } from "../../originals/ui/forecast-alert";
import { FormWizard } from "../../originals/ui/form-wizard";
import { HoverCard } from "../../originals/ui/hover-card";
import { ImageCropper, type CropRect } from "../../originals/ui/image-cropper";
import { Lightbox } from "../../originals/ui/lightbox";
import { NotificationCenter } from "../../originals/ui/notification-center";
import { OnboardingChecklist } from "../../originals/ui/onboarding-checklist";
import { ScrollSpyToc } from "../../originals/ui/scroll-spy-toc";
import { ShortcutsDialog } from "../../originals/ui/shortcuts-dialog";
import { SideSheet } from "../../originals/ui/side-sheet";
import { SidebarNav } from "../../originals/ui/sidebar-nav";
import { Toaster, toast } from "../../originals/ui/toast";
import { UsageMeter } from "../../originals/ui/usage-meter";

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

const button = "inline-flex h-9 items-center gap-2 rounded-full bg-surface px-4 text-sm font-medium text-fg shadow-[var(--shadow-btn-secondary)] dark:bg-raised outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)]";
const primary = "inline-flex h-9 items-center rounded-full bg-[image:var(--grad-primary)] px-4 text-sm font-medium text-[var(--inverse-fg)] shadow-[var(--shadow-btn-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)]";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const NOW = Date.UTC(2026, 10, 18, 12);

const FILTERS = [
  { id: "status", label: "Status", options: [{ value: "open", label: "Open" }, { value: "review", label: "In review" }, { value: "done", label: "Done" }] },
  { id: "owner", label: "Owner", options: [{ value: "me", label: "Me" }, { value: "team", label: "My team" }] },
  { id: "label", label: "Label", options: [{ value: "bug", label: "Bug" }, { value: "idea", label: "Idea" }, { value: "docs", label: "Docs" }] },
];

const APPS = [
  { id: "mail", name: "Mail", icon: <Mail size={20} /> },
  { id: "calendar", name: "Calendar", icon: <Calendar size={20} /> },
  { id: "files", name: "Files", icon: <Folder size={20} /> },
  { id: "chat", name: "Chat", icon: <MessageSquare size={20} /> },
  { id: "photos", name: "Photos", icon: <ImageIcon size={20} /> },
  { id: "docs", name: "Docs", icon: <FileText size={20} /> },
];

const SIDEBAR = [
  {
    title: "Workspace",
    items: [
      { id: "home", label: "Home", icon: <Home size={18} /> },
      { id: "inbox", label: "Inbox", icon: <Inbox size={18} />, badge: 4 },
      { id: "team", label: "Team", icon: <Users size={18} />, children: [{ id: "members", label: "Members" }, { id: "roles", label: "Roles" }] },
    ],
  },
  { title: "Library", items: [{ id: "reports", label: "Reports", icon: <LayoutDashboard size={18} /> }, { id: "settings", label: "Settings", icon: <Settings size={18} /> }] },
];

const SHORTCUTS = [
  { title: "General", shortcuts: [{ label: "Open command palette", keys: ["mod", "K"] }, { label: "Show shortcuts", keys: ["?"] }, { label: "Save", keys: ["mod", "S"] }] },
  { title: "Editing", shortcuts: [{ label: "Copy", keys: ["mod", "C"] }, { label: "Paste", keys: ["mod", "V"] }, { label: "Undo", keys: ["mod", "Z"] }, { label: "Redo", keys: ["mod", "shift", "Z"] }] },
  { title: "Navigation", shortcuts: [{ label: "Go to inbox", keys: ["G", "I"] }, { label: "Next item", keys: ["down"] }, { label: "Previous item", keys: ["up"] }] },
];

const GALLERY = [
  { src: "https://picsum.photos/id/1018/1200/800", alt: "Mountain lake at dawn", caption: "Mountain lake at dawn" },
  { src: "https://picsum.photos/id/1015/1200/800", alt: "River winding through a valley", caption: "River winding through a valley" },
  { src: "https://picsum.photos/id/1043/1200/800", alt: "Forest path in autumn" },
];

const TOC = [
  { id: "demo-overview", label: "Overview" },
  { id: "demo-install", label: "Installation" },
  { id: "demo-usage", label: "Usage", level: 2 as const },
  { id: "demo-api", label: "API reference" },
];

function ToastDemo() {
  return (
    <div className="flex flex-wrap gap-2">
      <button className={button} onClick={() => toast.success({ title: "Changes saved", description: "Your project was updated." })}>Success</button>
      <button className={button} onClick={() => toast.error({ title: "Upload failed", description: "The file is larger than 25 MB." })}>Error</button>
      <button className={button} onClick={() => toast({ title: "Message archived", action: { label: "Undo", onClick: () => toast.info("Restored") } })}>With action</button>
      <button className={button} onClick={() => toast.dismiss()}>Clear all</button>
      <Toaster />
    </div>
  );
}

export function Section() {
  const [filters, setFilters] = useState<FilterValue>({ status: ["open"] });
  const [display, setDisplay] = useState<DisplayValue>({ layout: "list", density: "comfortable", subtasks: true, sort: "updated" });
  const [crop, setCrop] = useState<CropRect | null>(null);
  const [tour, setTour] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [tab, setTab] = useState("home");
  const [name, setName] = useState("");
  const [scroller, setScroller] = useState<HTMLElement | null>(null);

  const commands: Command[] = [
    { id: "new", label: "New document", group: "Create", icon: <FileText size={16} />, shortcut: "N", onSelect: () => toast.success("New document created") },
    { id: "invite", label: "Invite teammate", group: "Create", icon: <Users size={16} />, keywords: ["add", "member"], onSelect: () => toast.info("Invite link copied") },
    { id: "search", label: "Search workspace", group: "Navigate", icon: <Search size={16} />, shortcut: "/", onSelect: () => {} },
    { id: "settings", label: "Open settings", group: "Navigate", icon: <Settings size={16} />, shortcut: "⌘,", onSelect: () => {} },
    { id: "theme", label: "Toggle dark mode", group: "Preferences", keywords: ["theme", "appearance"], onSelect: () => document.documentElement.classList.toggle("dark") },
  ];

  return (
    <div className="grid gap-10">
      <Demo title="Filter bar" slug="filter-bar">
        <FilterBar filters={FILTERS} value={filters} onValueChange={setFilters} />
      </Demo>

      <Demo title="App switcher" slug="app-switcher">
        <div className="flex h-72 justify-end">
          <AppSwitcher apps={APPS} currentId="docs" align="end" />
        </div>
      </Demo>

      <Demo title="Sidebar nav" slug="sidebar-nav">
        <SidebarNav sections={SIDEBAR} defaultActiveId="inbox" className="h-[28rem]" />
      </Demo>

      <Demo title="Form wizard" slug="form-wizard">
        <FormWizard
          className="mx-auto max-w-xl"
          steps={[
            {
              id: "account",
              title: "Account",
              description: "Tell us who you are.",
              validate: () => (name.trim() ? null : "Enter a workspace name to continue."),
              content: (
                <label className="grid gap-1.5 text-sm text-fg">
                  Workspace name
                  <input value={name} onChange={(e) => setName(e.target.value)} className="h-10 rounded-[10px] bg-surface px-3 shadow-[var(--shadow-control)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] dark:bg-raised" />
                </label>
              ),
            },
            { id: "plan", title: "Plan", description: "Pick what fits your team.", content: <p className="text-sm text-fg-muted">Starter is free for up to five people. You can change plans at any time.</p> },
            { id: "review", title: "Review", content: <p className="text-sm text-fg-muted">Everything looks good. Finish to create <strong className="text-fg">{name || "your workspace"}</strong>.</p> },
          ]}
          onComplete={() => toast.success("Workspace created")}
        />
      </Demo>

      <Demo title="Scroll-spy TOC" slug="scroll-spy-toc">
        <div className="flex gap-8">
          <div ref={setScroller} className="h-64 flex-1 overflow-y-auto rounded-[16px] bg-surface p-5 text-sm text-fg-muted dark:bg-raised">
            {TOC.map((t) => (
              <div key={t.id} id={t.id} className="mb-6 min-h-48">
                <h4 className="mb-2 font-semibold text-fg">{t.label}</h4>
                <p>Scroll this panel and the contents list follows along. Each section is tall enough to cross the observed band so the highlight moves.</p>
              </div>
            ))}
          </div>
          <ScrollSpyToc items={TOC} root={scroller} className="w-44 shrink-0" rootMargin="0px 0px -60% 0px" />
        </div>
      </Demo>

      <Demo title="Bottom tab bar" slug="bottom-tab-bar">
        <div className="mx-auto max-w-sm">
          <BottomTabBar
            value={tab}
            onValueChange={setTab}
            tabs={[
              { id: "home", label: "Home", icon: <Home size={20} /> },
              { id: "search", label: "Search", icon: <Search size={20} /> },
              { id: "inbox", label: "Inbox", icon: <Inbox size={20} />, badge: 12 },
              { id: "me", label: "Profile", icon: <User size={20} /> },
            ]}
          />
        </div>
      </Demo>

      <Demo title="Dock" slug="dock">
        <div className="flex justify-center pt-8">
          <Dock
            items={[
              { id: "files", label: "Files", icon: <Folder size={22} />, active: true },
              { id: "mail", label: "Mail", icon: <Mail size={22} /> },
              { id: "cal", label: "Calendar", icon: <Calendar size={22} /> },
              { id: "chat", label: "Chat", icon: <MessageSquare size={22} />, active: true },
              { id: "set", label: "Settings", icon: <Settings size={22} /> },
            ]}
          />
        </div>
      </Demo>

      <Demo title="Dialog" slug="dialog">
        <div className="flex flex-wrap gap-3">
          <Dialog
            trigger={<button className={button}>Rename project</button>}
            title="Rename project"
            description="Pick a name your team will recognise."
            footer={<span className="text-xs text-fg-subtle">Press Escape to cancel</span>}
          >
            <input defaultValue="Northwind launch" aria-label="Project name" className="h-10 w-full rounded-[10px] bg-subtle px-3 outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)]" />
          </Dialog>
          <Dialog trigger={<button className={button}>Delete project…</button>} tone="danger" title="Delete this project?" description="All files and history will be removed permanently.">
            <p className="text-fg-muted">This action cannot be undone.</p>
          </Dialog>
        </div>
      </Demo>

      <Demo title="Dropdown menu" slug="dropdown-menu">
        <DropdownMenu
          label="Document actions"
          trigger={<button className={button}>Actions</button>}
          items={[
            { id: "dup", label: "Duplicate", icon: <Copy size={15} />, shortcut: "⌘D", onSelect: () => toast("Duplicated") },
            { id: "arch", label: "Archive", icon: <Archive size={15} /> },
            { id: "sep", type: "separator" },
            { id: "lbl", type: "label", label: "Danger zone" },
            { id: "del", label: "Delete", icon: <Trash2 size={15} />, danger: true },
          ]}
        />
      </Demo>

      <Demo title="Command palette" slug="command-palette">
        <div className="flex items-center gap-3">
          <button className={button} onClick={() => setPaletteOpen(true)}>Open palette</button>
          <span className="text-sm text-fg-muted">or press Ctrl/Cmd + J</span>
        </div>
        <CommandPalette commands={commands} open={paletteOpen} onOpenChange={setPaletteOpen} hotkey="j" />
      </Demo>

      <Demo title="Notification center" slug="notification-center">
        <div className="flex h-96 justify-end">
          <NotificationCenter
            now={NOW}
            defaultNotifications={[
              { id: "1", title: "Build finished", body: "main deployed to staging.", time: NOW - 4 * 60_000 },
              { id: "2", title: "Priya commented on Roadmap", body: "Can we move the beta to Thursday?", time: NOW - 2 * HOUR },
              { id: "3", title: "Weekly report is ready", time: NOW - 20 * HOUR, read: true },
              { id: "4", title: "Invite accepted", body: "Lee joined Design.", time: NOW - 3 * DAY, read: true },
            ]}
          />
        </div>
      </Demo>

      <Demo title="Bottom sheet" slug="bottom-sheet">
        <BottomSheet trigger={<button className={button}>Share link</button>} title="Share this page" description="Drag the handle down to dismiss.">
          <ul className="grid gap-1">
            {["Copy link", "Send by email", "Add to a collection", "Export as PDF"].map((label) => (
              <li key={label}><button className="w-full rounded-[12px] px-3 py-3 text-left text-sm text-fg hover:bg-subtle">{label}</button></li>
            ))}
          </ul>
        </BottomSheet>
      </Demo>

      <Demo title="Coachmark" slug="coachmark">
        <div className="flex flex-wrap items-center gap-3">
          <button className={button} onClick={() => setTour(true)}>Start tour</button>
          <button id="tour-new" className={primary}>New project</button>
          <button id="tour-search" className={button}><Search size={15} /> Search</button>
        </div>
        <Coachmark
          open={tour}
          onOpenChange={setTour}
          steps={[
            { target: "#tour-new", title: "Create your first project", body: "Projects keep files, people and history together.", placement: "bottom" },
            { target: "#tour-search", title: "Find anything fast", body: "Search across projects, files and teammates.", placement: "bottom" },
          ]}
        />
      </Demo>

      <Demo title="Lightbox" slug="lightbox">
        <div className="flex gap-3">
          {GALLERY.map((img, i) => (
            <Lightbox key={img.src} images={GALLERY} defaultIndex={i} trigger={<button aria-label={`Open ${img.alt}`} className="overflow-hidden rounded-[14px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)]"><img src={img.src} alt="" className="size-24 object-cover" /></button>} />
          ))}
        </div>
      </Demo>

      <Demo title="Hover card" slug="hover-card">
        <p className="text-sm text-fg-muted">
          Designed by{" "}
          <HoverCard trigger={<a href="#hover-card" className="font-medium text-select-text underline-offset-2 hover:underline">@riverstone</a>} label="Riverstone profile">
            <div className="flex gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-select-soft text-select-text"><User size={18} /></span>
              <div>
                <p className="font-semibold text-fg">Riverstone Studio</p>
                <p className="mt-0.5 text-fg-muted">Small design team building interfaces for data tools. 42 public kits.</p>
              </div>
            </div>
          </HoverCard>{" "}
          and shipped in November.
        </p>
      </Demo>

      <Demo title="Context menu" slug="context-menu">
        <ContextMenu
          label="Canvas actions"
          items={[
            { id: "copy", label: "Copy", icon: <Copy size={15} />, shortcut: "⌘C" },
            { id: "paste", label: "Paste", shortcut: "⌘V", disabled: true },
            { id: "sep", type: "separator" },
            { id: "del", label: "Delete", icon: <Trash2 size={15} />, danger: true },
          ]}
        >
          <div className="grid h-40 place-items-center rounded-[16px] border border-dashed border-track-strong text-sm text-fg-muted">Right-click (or press Shift+F10) in this area</div>
        </ContextMenu>
      </Demo>

      <Demo title="Side sheet" slug="side-sheet">
        <SideSheet
          trigger={<button className={button}>Open filters</button>}
          title="Filters"
          description="Narrow the list of projects."
          footer={<><button className={button}>Reset</button><button className={primary}>Apply</button></>}
        >
          <div className="grid gap-4">
            {["Owner", "Status", "Created"].map((f) => (
              <label key={f} className="grid gap-1.5 text-sm text-fg">{f}<select className="h-10 rounded-[10px] bg-subtle px-3"><option>Any</option><option>Recent</option></select></label>
            ))}
          </div>
        </SideSheet>
      </Demo>

      <Demo title="Shortcuts dialog" slug="shortcuts-dialog">
        <div className="flex items-center gap-3">
          <button className={button} onClick={() => setShortcutsOpen(true)}>Keyboard shortcuts</button>
          <span className="text-sm text-fg-muted">or press ?</span>
        </div>
        <ShortcutsDialog groups={SHORTCUTS} open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      </Demo>

      <Demo title="Image cropper" slug="image-cropper">
        <div className="flex flex-wrap items-start gap-6">
          <ImageCropper src="https://picsum.photos/id/1025/900/600" alt="Dog resting on a blanket" aspect={1} width={288} onCropChange={setCrop} />
          <pre className="rounded-[12px] bg-surface p-3 text-xs text-fg-muted dark:bg-raised">{JSON.stringify(crop, null, 2)}</pre>
        </div>
      </Demo>

      <Demo title="Display options" slug="display-options">
        <div className="flex h-96 justify-end">
          <DisplayOptions
            value={display}
            onValueChange={setDisplay}
            defaultValue={{ layout: "list", density: "comfortable", subtasks: true, sort: "updated" }}
            options={[
              { id: "layout", label: "Layout", type: "segmented", choices: [{ value: "list", label: "List" }, { value: "board", label: "Board" }, { value: "grid", label: "Grid" }] },
              { id: "density", label: "Density", type: "segmented", choices: [{ value: "compact", label: "Compact" }, { value: "comfortable", label: "Comfortable" }] },
              { id: "subtasks", label: "Show sub-tasks", type: "toggle" },
              { id: "sort", label: "Order by", type: "select", choices: [{ value: "updated", label: "Last updated" }, { value: "created", label: "Created" }, { value: "name", label: "Name" }] },
            ]}
          />
        </div>
      </Demo>

      <Demo title="Toast" slug="toast">
        <ToastDemo />
      </Demo>

      <Demo title="Onboarding checklist" slug="onboarding-checklist">
        <OnboardingChecklist
          title="Get started"
          description="Four quick steps to set up your workspace."
          defaultCompleted={["profile"]}
          onDismiss={() => toast("Checklist hidden")}
          tasks={[
            { id: "profile", title: "Complete your profile" },
            { id: "project", title: "Create your first project", description: "Projects hold files, tasks and discussion.", action: { label: "New project", onClick: () => toast.info("Opening wizard") } },
            { id: "invite", title: "Invite a teammate", description: "Work is better together." },
            { id: "connect", title: "Connect an integration" },
          ]}
        />
      </Demo>

      <Demo title="Usage meter" slug="usage-meter">
        <div className="grid max-w-md gap-8">
          <UsageMeter label="Monthly credits" used={37_400} limit={50_000} unit="credits" resets="Resets Dec 1" action={<button className={button}>Buy more</button>} />
          <UsageMeter
            label="Storage"
            used={43_000}
            limit={50_000}
            unit="MB"
            segments={[{ label: "Media", value: 26_000 }, { label: "Documents", value: 12_000 }, { label: "Backups", value: 5_000 }]}
          />
          <UsageMeter label="Seats" used={11} limit={10} unit="seats" />
        </div>
      </Demo>

      <Demo title="Forecast alert" slug="forecast-alert">
        <div className="grid max-w-xl gap-4">
          <ForecastAlert used={31_000} limit={50_000} periodStart={Date.UTC(2026, 10, 1)} periodEnd={Date.UTC(2026, 11, 1)} now={NOW} format={(n) => n.toLocaleString("en-US")} action={<button className={primary}>Upgrade plan</button>} onDismiss={() => {}} />
          <ForecastAlert used={19_000} limit={50_000} periodStart={Date.UTC(2026, 10, 1)} periodEnd={Date.UTC(2026, 11, 1)} now={NOW} format={(n) => n.toLocaleString("en-US")} />
        </div>
      </Demo>
    </div>
  );
}
