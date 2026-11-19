import { useState } from "react";
import { Archive, Copy, FileText, Mail, Pencil, Plus, Search, Send, Share2, Sparkles, Trash2, Calendar, Download } from "lucide-react";
import { Demo } from "../demo";
import { ApprovalRequest } from "../../registry/ui/approval-request";
import { BellButton } from "../../registry/ui/bell-button";
import { BranchSwitcher } from "../../registry/ui/branch-switcher";
import { Button } from "../../registry/ui/button";
import { ChipInput } from "../../registry/ui/chip-input";
import { Citation } from "../../registry/ui/citation";
import { CitationRow } from "../../registry/ui/citation-row";
import { CopyButton } from "../../registry/ui/copy-button";
import { CopyField } from "../../registry/ui/copy-field";
import { CurrencyInput } from "../../registry/ui/currency-input";
import { ExpandingSearch } from "../../registry/ui/expanding-search";
import { Feedback } from "../../registry/ui/feedback";
import { IconButton } from "../../registry/ui/icon-button";
import { InlineEdit } from "../../registry/ui/inline-edit";
import { Input } from "../../registry/ui/input";
import { Message } from "../../registry/ui/message";
import { NumberInput } from "../../registry/ui/number-input";
import { OtpInput } from "../../registry/ui/otp-input";
import { PasswordInput } from "../../registry/ui/password-input";
import { PhoneInput } from "../../registry/ui/phone-input";
import { SearchInput } from "../../registry/ui/search-input";
import { SplitButton } from "../../registry/ui/split-button";
import { StarterCards } from "../../registry/ui/starter-cards";
import { Suggestions } from "../../registry/ui/suggestions";
import { Textarea } from "../../registry/ui/textarea";
import { TimeInput } from "../../registry/ui/time-input";

const SOURCES = [
  { label: "Field guide to sourdough", href: "#" },
  { label: "Baking science notes", href: "#" },
  { label: "Kitchen almanac", href: "#" },
  { label: "Pantry journal", href: "#" },
];

const CITE_SOURCES = [
  { id: "1", title: "How hydration changes crumb structure", domain: "breadlab.example/hydration", href: "#" },
  { id: "2", title: "A beginner's guide to starters", domain: "kitchenschool.example/starters", href: "#" },
  { id: "3", title: "Oven spring explained", domain: "doughnotes.example/spring", href: "#" },
  { id: "4", title: "Choosing flour for long ferments", domain: "milltown.example/flour", href: "#" },
  { id: "5", title: "Scoring patterns that work", domain: "crustclub.example/scoring", href: "#" },
];

const STARTERS = [
  { id: "a", prompt: "Summarize yesterday's team calls", app: "Meetings", icon: <FileText /> },
  { id: "b", prompt: "Draft a reply to the latest customer email", app: "Mail", icon: <Mail /> },
  { id: "c", prompt: "Find a free hour for a design review", app: "Calendar", icon: <Calendar /> },
  { id: "d", prompt: "Turn my notes into a launch checklist", app: "Notes", icon: <Pencil /> },
];

function SuggestionsDemo() {
  const [picked, setPicked] = useState("");
  return (
    <div className="grid gap-3">
      <Suggestions
        items={[{ label: "Explain this chart" }, { label: "Shorten the intro" }, { label: "Suggest three titles" }]}
        onSelect={setPicked}
      />
      <p className="text-sm text-fg-muted" aria-live="polite">{picked ? `Sent: ${picked}` : "Pick a prompt"}</p>
    </div>
  );
}

function StarterDemo() {
  const [picked, setPicked] = useState("");
  return (
    <div className="grid gap-3">
      <StarterCards items={STARTERS} onSelect={(it) => setPicked(it.prompt)} />
      <p className="text-sm text-fg-muted">{picked || "Choose a starter"}</p>
    </div>
  );
}

function ApprovalDemo() {
  return (
    <div className="max-w-md">
      <ApprovalRequest
        overline="Billing agent · Payments"
        title="Create a refund of $48.00"
        description="The agent wants to refund order #1042 to the original card."
        risk="high"
        warning="A refund can't be undone once it is sent."
        expiry="Expires in 9 min"
        details={[
          { label: "Tool", value: "payments.refund", mono: true },
          { label: "Amount", value: "$48.00" },
        ]}
      />
    </div>
  );
}

function SplitDemo() {
  const [last, setLast] = useState("Nothing yet");
  return (
    <div className="grid gap-3">
      <SplitButton
        icon={<Send size={16} />}
        onClick={() => setLast("Sent now")}
        onAction={(id) => setLast(id)}
        actions={[
          { id: "schedule", label: "Schedule send", description: "Tomorrow at 8:00 AM", icon: <Calendar size={20} /> },
          { id: "draft", label: "Save as draft", icon: <Archive size={20} /> },
          { id: "discard", label: "Discard", icon: <Trash2 size={20} />, destructive: true },
        ]}
      >
        Send
      </SplitButton>
      <p className="text-sm text-fg-muted">Last action: {last}</p>
    </div>
  );
}

function BellDemo() {
  const [count, setCount] = useState(3);
  return (
    <div className="flex items-center gap-4">
      <BellButton
        count={count}
        onClear={() => setCount(0)}
        flip={false}
        panelWidth={280}
        align="start"
        panel={
          <div className="grid gap-2 p-4 text-sm text-fg">
            <p className="font-medium">Notifications</p>
            <p className="text-fg-muted">Maya commented on your draft.</p>
            <p className="text-fg-muted">Your export is ready.</p>
          </div>
        }
      />
      <Button size="sm" variant="outline" onClick={() => setCount((c) => c + 1)}>New notification</Button>
    </div>
  );
}

function ChipDemo() {
  const [v, setV] = useState(["ana@example.com"]);
  return (
    <div className="max-w-md">
      <ChipInput
        label="Invite teammates"
        placeholder="Add emails"
        value={v}
        onValueChange={setV}
        suggestions={[
          { value: "ben@example.com", label: "Ben Carter", description: "ben@example.com" },
          { value: "chloe@example.com", label: "Chloe Diaz", description: "chloe@example.com" },
        ]}
      />
    </div>
  );
}

function CurrencyDemo() {
  const [v, setV] = useState<number | null>(1250);
  return (
    <div className="max-w-xs">
      <CurrencyInput label="Budget" value={v} onValueChange={setV} hint="Pick a currency on the left" />
    </div>
  );
}

function OtpDemo() {
  const [done, setDone] = useState("");
  return (
    <div className="grid gap-3">
      <OtpInput label="Verification code" hint="Enter the 6 digits we sent you" onComplete={setDone} />
      <p className="text-sm text-fg-muted">{done ? `Code entered: ${done}` : "Waiting for code"}</p>
    </div>
  );
}

function InlineEditDemo() {
  return (
    <div className="grid max-w-sm gap-4">
      <InlineEdit variant="title" aria-label="Project name" defaultValue="Spring campaign" />
      <InlineEdit variant="field" aria-label="Owner email" type="email" defaultValue="owner@example.com" />
    </div>
  );
}

function NumberDemo() {
  return (
    <div className="flex flex-wrap items-end gap-6">
      <NumberInput label="Seats" defaultValue={5} min={1} max={50} />
      <NumberInput label="Discount" defaultValue={20} min={0} max={100} unit="%" variant="end" />
    </div>
  );
}

function SearchDemo() {
  const [q, setQ] = useState("");
  return (
    <div className="grid max-w-sm gap-2">
      <SearchInput
        aria-label="Search docs"
        placeholder="Search docs"
        defaultRecent={["getting started", "billing"]}
        onSearch={setQ}
      />
      <p className="text-sm text-fg-muted">{q ? `Searched: ${q}` : "Press Enter to search"}</p>
    </div>
  );
}

function PhoneDemo() {
  return (
    <div className="max-w-xs">
      <PhoneInput label="Phone number" defaultCountry="US" defaultValue="" hint="We only call about your order" />
    </div>
  );
}

function TimeDemo() {
  const [v, setV] = useState("09:30");
  return (
    <div className="max-w-xs">
      <TimeInput label="Meeting time" value={v} onValueChange={setV} />
    </div>
  );
}

function ExpandingDemo() {
  return (
    <div className="flex h-12 items-center">
      <ExpandingSearch aria-label="Search" placeholder="Search files" width={260} side="start" />
    </div>
  );
}

function BranchDemo() {
  return (
    <div className="max-w-lg">
      <BranchSwitcher
        defaultValue={1}
        branches={[
          { id: "1", prompt: "Write a tagline for a bakery", reply: "Baked fresh, shared warm.", meta: "2:14 PM" },
          { id: "2", prompt: "Write a tagline for a neighborhood bakery", reply: "Your corner of warm bread and good mornings.", meta: "Edited · 2:16 PM" },
        ]}
      />
    </div>
  );
}

export function Section() {
  return (
    <div className="grid gap-8">
      <Demo title="Message" slug="message">
        <div className="grid max-w-xl gap-4">
          <Message role="user" content="How do I get a more open crumb in sourdough?" name="You" time="2:14 PM" />
          <Message
            role="assistant"
            name="Assistant"
            time="2:14 PM"
            content="Raise the hydration to about 78 percent, fold gently during bulk fermentation, and bake in a preheated Dutch oven for strong oven spring."
            thought={{ label: "Thought for 6s", text: "Open crumb depends on hydration, gluten structure and gas retention." }}
            sources={SOURCES}
            actions
          />
        </div>
      </Demo>

      <Demo title="Citation" slug="citation">
        <p className="max-w-md text-[15px] text-fg">
          Higher hydration gives a more open crumb
          <Citation
            index={1}
            label="breadlab.example"
            title="How hydration changes crumb structure"
            meta="breadlab.example · 4 min read"
            quote="Doughs above [[75 percent hydration]] tend to produce larger, irregular holes."
            href="#"
          />
          , especially with long ferments.
        </p>
      </Demo>

      <Demo title="Suggestions" slug="suggestions">
        <SuggestionsDemo />
      </Demo>

      <Demo title="Feedback" slug="feedback">
        <Feedback text="Raise the hydration to about 78 percent and fold gently." />
      </Demo>

      <Demo title="Starter cards" slug="starter-cards">
        <StarterDemo />
      </Demo>

      <Demo title="Citation row" slug="citation-row">
        <CitationRow sources={CITE_SOURCES} />
      </Demo>

      <Demo title="Branch switcher" slug="branch-switcher">
        <BranchDemo />
      </Demo>

      <Demo title="Approval request" slug="approval-request">
        <ApprovalDemo />
      </Demo>

      <Demo title="Button" slug="button">
        <div className="flex flex-wrap items-center gap-3">
          <Button leadingIcon={<Plus />}>New project</Button>
          <Button variant="secondary">Save</Button>
          <Button variant="outline" shortcut={["⌘", "↵"]}>Submit</Button>
          <Button variant="ghost">Cancel</Button>
          <Button variant="destructive" leadingIcon={<Trash2 />}>Delete</Button>
        </div>
      </Demo>

      <Demo title="Icon button" slug="icon-button">
        <div className="flex items-center gap-3">
          <IconButton aria-label="Edit" variant="solid"><Pencil /></IconButton>
          <IconButton aria-label="Share" variant="outline"><Share2 /></IconButton>
          <IconButton aria-label="Search" variant="soft" shape="square"><Search /></IconButton>
          <IconButton aria-label="Download, new" indicator><Download /></IconButton>
        </div>
      </Demo>

      <Demo title="Split button" slug="split-button">
        <SplitDemo />
      </Demo>

      <Demo title="Bell button" slug="bell-button">
        <div className="min-h-44"><BellDemo /></div>
      </Demo>

      <Demo title="Copy button" slug="copy-button">
        <div className="flex items-center gap-3">
          <CopyButton value="npm install ui-stacks" label="Copy" variant="secondary" />
          <CopyButton value="npm install ui-stacks" aria-label="Copy install command" />
        </div>
      </Demo>

      <Demo title="Input" slug="input">
        <div className="grid max-w-sm gap-4">
          <Input label="Email" type="email" placeholder="you@example.com" leadingIcon={<Mail />} hint="We never share it" />
          <Input label="Username" defaultValue="taken-name" error="That username is already taken" />
        </div>
      </Demo>

      <Demo title="Textarea" slug="textarea">
        <div className="max-w-sm">
          <Textarea label="Bio" placeholder="Tell us about yourself" autoGrow counter maxLength={160} hint="Shown on your profile" />
        </div>
      </Demo>

      <Demo title="Chip input" slug="chip-input">
        <ChipDemo />
      </Demo>

      <Demo title="Currency input" slug="currency-input">
        <CurrencyDemo />
      </Demo>

      <Demo title="Password input" slug="password-input">
        <div className="max-w-sm">
          <PasswordInput label="New password" meter defaultValue="correct horse" hint="Use at least 12 characters" />
        </div>
      </Demo>

      <Demo title="OTP input" slug="otp-input">
        <OtpDemo />
      </Demo>

      <Demo title="Inline edit" slug="inline-edit">
        <InlineEditDemo />
      </Demo>

      <Demo title="Number input" slug="number-input">
        <NumberDemo />
      </Demo>

      <Demo title="Search input" slug="search-input">
        <SearchDemo />
      </Demo>

      <Demo title="Phone input" slug="phone-input">
        <PhoneDemo />
      </Demo>

      <Demo title="Time input" slug="time-input">
        <TimeDemo />
      </Demo>

      <Demo title="Copy field" slug="copy-field">
        <div className="grid max-w-sm gap-3">
          <CopyField label="Share link" value="https://app.example.com/invite/k3x9q" />
          <CopyField label="API key" content="secret" value="sk_live_example_1234567890" />
        </div>
      </Demo>

      <Demo title="Expanding search" slug="expanding-search">
        <ExpandingDemo />
      </Demo>
    </div>
  );
}
