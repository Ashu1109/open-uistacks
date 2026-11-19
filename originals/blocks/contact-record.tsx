"use client";

import { useState } from "react";
import { Mail, Phone } from "lucide-react";
import { ActivityFeed, type ActivityItem } from "../ui/activity-feed";
import { PropertyPanel, type Property } from "../ui/property-panel";
import { Avatar } from "../../registry/ui/avatar";
import { Badge } from "../../registry/ui/badge";
import { Button } from "../../registry/ui/button";
import { formatMoney } from "./deal-pipeline-board";

/* Contact record: a full-width detail view of one contact: profile header with email and call actions, editable properties, related deals, and an activity timeline you can add notes to. Stacks two columns when its container is at least 720px wide. */

export interface RelatedDeal {
  id: string;
  name: string;
  stage: string;
  /** Integer minor units. */
  amountMinor: number;
}

export interface ContactProfile {
  name: string;
  title: string;
  company: string;
}

export const DEMO_CONTACT: ContactProfile = { name: "Priya Raman", title: "Head of Operations", company: "Brightwell Foods" };

export const DEMO_PROPERTIES: Property[] = [
  { id: "email", label: "Email", value: "priya.raman@brightwell.example" },
  { id: "phone", label: "Phone", value: "+1 555 0142" },
  { id: "owner", label: "Owner", value: "maya", options: [{ value: "maya", label: "Maya Okafor" }, { value: "jonas", label: "Jonas Pell" }, { value: "ines", label: "Ines Duarte" }] },
  { id: "lifecycle", label: "Lifecycle", value: "customer", options: [{ value: "lead", label: "Lead" }, { value: "opportunity", label: "Opportunity" }, { value: "customer", label: "Customer" }] },
  { id: "source", label: "Source", value: "Referral", readOnly: true },
];

export const DEMO_RELATED: RelatedDeal[] = [
  { id: "d1", name: "Platform rollout", stage: "Negotiation", amountMinor: 4_800_000 },
  { id: "d9", name: "Training package", stage: "Won", amountMinor: 420_000 },
];

export const DEMO_TIMELINE: ActivityItem[] = [
  { id: "a1", actor: "Maya Okafor", action: "logged a call with", target: "Priya Raman", at: Date.parse("2026-11-17T15:10:00Z"), detail: "Agreed to share the revised pricing by Friday." },
  { id: "a2", actor: "Priya Raman", action: "opened", target: "Proposal v3", at: Date.parse("2026-11-16T09:40:00Z") },
  { id: "a3", actor: "Maya Okafor", action: "moved deal to", target: "Negotiation", at: Date.parse("2026-11-12T11:00:00Z") },
];

export interface ContactRecordProps {
  contact?: ContactProfile;
  properties?: Property[];
  related?: RelatedDeal[];
  timeline?: ActivityItem[];
  /** Reference time for relative stamps and for new notes. */
  now?: number;
  /** Name shown on notes added here. */
  author?: string;
  currency?: string;
  onEmail?: () => void;
  onCall?: () => void;
  onPropertyChange?: (id: string, value: string) => void;
  onAddNote?: (text: string) => void;
  className?: string;
}

export function ContactRecord({
  contact = DEMO_CONTACT, properties = DEMO_PROPERTIES, related = DEMO_RELATED, timeline = DEMO_TIMELINE, now = Date.parse("2026-11-18T09:00:00Z"),
  author = "You", currency = "USD", onEmail, onCall, onPropertyChange, onAddNote, className = "",
}: ContactRecordProps) {
  const [props, setProps] = useState(properties);
  const [items, setItems] = useState(timeline);
  const [note, setNote] = useState("");

  const addNote = () => {
    const text = note.trim();
    if (!text) return;
    setItems((cur) => [{ id: `note-${cur.length}-${now}`, actor: author, action: "added a note", at: now, detail: text }, ...cur]);
    setNote("");
    onAddNote?.(text);
  };

  return (
    <section aria-label={`Contact ${contact.name}`} className={`@container ${className}`}>
      <header className="flex flex-wrap items-center gap-4 rounded-[20px] bg-surface p-4 shadow-[var(--shadow-card)]">
        <Avatar name={contact.name} size="lg" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold text-fg">{contact.name}</h2>
          <p className="truncate text-sm text-fg-muted">{contact.title}, {contact.company}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" leadingIcon={<Mail />} onClick={onEmail}>Email</Button>
          <Button variant="outline" size="sm" leadingIcon={<Phone />} onClick={onCall}>Call</Button>
        </div>
      </header>
      <div className="mt-3 grid gap-3 @[720px]:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-[20px] bg-surface p-4 shadow-[var(--shadow-card)]">
          <h3 className="pb-3 text-xs font-medium uppercase tracking-wide text-fg-subtle">Activity</h3>
          <form onSubmit={(e) => { e.preventDefault(); addNote(); }} className="mb-4 flex gap-2">
            <input
              aria-label="Add a note"
              placeholder="Add a note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-9 min-w-0 flex-1 rounded-[10px] bg-subtle px-3 text-sm text-fg outline-none placeholder:text-fg-subtle focus-visible:ring-2 focus-visible:ring-[var(--select)]"
            />
            <Button type="submit" size="sm" disabled={!note.trim()}>Save note</Button>
          </form>
          <ActivityFeed items={items} now={now} />
        </div>
        <div className="grid content-start gap-3">
          <PropertyPanel
            properties={props}
            onChange={(id, value) => {
              setProps((cur) => cur.map((p) => (p.id === id ? { ...p, value } : p)));
              onPropertyChange?.(id, value);
            }}
          />
          <section aria-label="Related deals" className="rounded-[18px] bg-surface p-3 shadow-[var(--shadow-card)] dark:bg-raised">
            <h3 className="px-2 pb-2 text-xs font-medium uppercase tracking-wide text-fg-subtle">Related deals</h3>
            <ul className="grid gap-1">
              {related.map((d) => (
                <li key={d.id} className="flex items-center gap-2 px-2 py-1.5">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg">{d.name}</span>
                  <Badge size="sm" tone={d.stage === "Won" ? "success" : "accent"}>{d.stage}</Badge>
                  <span className="text-sm tabular-nums text-fg-muted">{formatMoney(d.amountMinor, currency)}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </section>
  );
}
