import { useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Monitor, RotateCcw, Smartphone, Tablet } from "lucide-react";
import { CodeBlock } from "../../registry/ui/code-block";
import { SegmentedControl } from "../../originals/ui/segmented-control";
import { CenteredPreview, Preview } from "./preview";
import { TierBadge } from "./ui";
import { exportName, installPath, npmDependencies, parseProps, siblingFiles, useSource } from "./source";
import { SECTION_OF_KIND, groupHref, href, itemHref, itemsOf, type Item } from "./items";

/* Item page: breadcrumb, title, Preview and Code tabs, then installation, usage, props and previous/next links. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";
const DEVICE_WIDTH = { desktop: "100%", tablet: "820px", mobile: "390px" } as const;
type Device = keyof typeof DEVICE_WIDTH;

function Stage({ item, run }: { item: Item; run: number }) {
  const [device, setDevice] = useState<Device>("desktop");
  if (item.kind === "template") {
    return (
      <div className="grid gap-3">
        <SegmentedControl
          label="Preview width"
          size="sm"
          value={device}
          onValueChange={(v) => setDevice(v === "tablet" || v === "mobile" ? v : "desktop")}
          options={[
            { value: "desktop", label: <Monitor size={15} />, ariaLabel: "Desktop" },
            { value: "tablet", label: <Tablet size={15} />, ariaLabel: "Tablet" },
            { value: "mobile", label: <Smartphone size={15} />, ariaLabel: "Mobile" },
          ]}
          className="justify-self-end"
        />
        <div className="flex justify-center rounded-[22px] bg-subtle/60 p-4 ring-1 ring-track">
          <div style={{ width: DEVICE_WIDTH[device] }} className="h-[820px] max-w-full overflow-hidden rounded-[18px] shadow-[var(--shadow-card)] transition-[width]">
            <Preview key={run} item={item} />
          </div>
        </div>
      </div>
    );
  }
  const pad = item.kind === "block" ? "p-4 @[640px]:p-8" : "p-6 @[640px]:p-12";
  return (
    <div className={`@container flex min-h-[420px] items-center justify-center rounded-[22px] bg-subtle/60 ring-1 ring-track ${pad}`}>
      <CenteredPreview key={run} item={item} maxWidth={item.kind === "block" ? 1400 : 680} />
    </div>
  );
}

function Heading({ children }: { children: ReactNode }) {
  return <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-fg">{children}</h2>;
}

function Installation({ item, code }: { item: Item; code: string }) {
  if (item.tier === "Free") {
    return <CodeBlock code={`npx shadcn@latest add https://uistacks.dev/r/${item.slug}`} language="bash" title="Terminal" lineNumbers={false} />;
  }
  const deps = npmDependencies(code);
  const siblings = siblingFiles(code);
  return (
    <ol className="grid gap-4 text-[14px] leading-6 text-fg-muted [counter-reset:step]">
      {deps.length > 0 && (
        <li className="grid gap-2">
          <span>1. Install the dependencies.</span>
          <CodeBlock code={`npm install ${deps.join(" ")}`} language="bash" title="Terminal" lineNumbers={false} />
        </li>
      )}
      <li>
        {deps.length > 0 ? "2" : "1"}. Copy the source from the Code tab into <code className="rounded bg-subtle px-1.5 py-0.5 text-[13px] text-fg">{installPath(item)}</code>.
        {siblings.length > 0 && (
          <span> It imports {siblings.map((s, i) => <span key={s}>{i > 0 && ", "}<code className="rounded bg-subtle px-1.5 py-0.5 text-[13px] text-fg">{s}</code></span>)}, so copy those too.</span>
        )}
      </li>
      <li>
        {deps.length > 0 ? "3" : "2"}. Add the theme tokens once, as described in <a className="text-select-text underline-offset-2 hover:underline" href={href("docs", "theming")}>Theming</a>.
      </li>
    </ol>
  );
}

function PropsTable({ code, name }: { code: string; name: string }) {
  const rows = parseProps(code, name);
  if (rows.length === 0) return null;
  return (
    <section className="grid gap-4">
      <Heading>Props</Heading>
      <div className="overflow-x-auto rounded-[18px] ring-1 ring-track">
        <table className="w-full min-w-[560px] border-collapse text-left text-[13px]">
          <thead className="bg-subtle/60 text-fg-muted">
            <tr>
              <th scope="col" className="px-4 py-2.5 font-medium">Prop</th>
              <th scope="col" className="px-4 py-2.5 font-medium">Type</th>
              <th scope="col" className="px-4 py-2.5 font-medium">Default</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-t border-track align-top">
                <td className="px-4 py-3">
                  <code className="font-mono text-[12.5px] text-fg">{r.name}{r.optional ? "" : " *"}</code>
                  {r.doc && <p className="mt-1 text-fg-muted">{r.doc}</p>}
                </td>
                <td className="px-4 py-3"><code className="font-mono text-[12px] text-select-text">{r.type}</code></td>
                <td className="px-4 py-3"><code className="font-mono text-[12px] text-fg-muted">{r.defaultValue ?? "—"}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Pager({ item }: { item: Item }) {
  const list = itemsOf(item.kind);
  const at = list.findIndex((i) => i.slug === item.slug);
  const prev = list[at - 1];
  const next = list[at + 1];
  const link = `flex min-w-0 flex-1 flex-col gap-1 rounded-[18px] p-4 ring-1 ring-track transition-colors hover:bg-subtle/60 ${ring}`;
  return (
    <nav aria-label="More" className="flex gap-4 border-t border-track pt-8">
      {prev ? (
        <a href={itemHref(prev)} className={link}>
          <span className="flex items-center gap-1 text-xs text-fg-muted"><ArrowLeft size={13} aria-hidden /> Previous</span>
          <span className="truncate text-[15px] font-medium text-fg">{prev.name}</span>
        </a>
      ) : <span className="flex-1" />}
      {next ? (
        <a href={itemHref(next)} className={`${link} items-end text-right`}>
          <span className="flex items-center gap-1 text-xs text-fg-muted">Next <ArrowRight size={13} aria-hidden /></span>
          <span className="truncate text-[15px] font-medium text-fg">{next.name}</span>
        </a>
      ) : <span className="flex-1" />}
    </nav>
  );
}

export function ItemPage({ item }: { item: Item }) {
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const [run, setRun] = useState(0);
  const code = useSource(item);
  const name = code ? exportName(code, item.slug) : "";
  const importFrom = `@/${installPath(item).replace(/\.tsx$/, "")}`;
  const section = SECTION_OF_KIND[item.kind];
  return (
    <article className="grid gap-10">
      <div className="grid gap-4">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px] text-fg-muted">
          <a href={href(section)} className="hover:text-fg">{section.charAt(0).toUpperCase() + section.slice(1)}</a>
          {item.kind !== "template" && (
            <>
              <span aria-hidden>/</span>
              <a href={groupHref(section, item.group)} className="hover:text-fg">{item.group}</a>
            </>
          )}
        </nav>
        <h1 className="flex flex-wrap items-center gap-3 text-[36px] font-semibold leading-[1.15] tracking-[-0.02em] text-fg">
          {item.name} <TierBadge tier={item.tier} />
        </h1>
        {item.description && <p className="max-w-3xl text-[16px] leading-7 text-fg-muted">{item.description}</p>}
      </div>

      <div className="grid gap-4">
        <div className="flex items-center justify-between gap-3">
          <SegmentedControl
            label="View"
            value={tab}
            onValueChange={(v) => setTab(v === "code" ? "code" : "preview")}
            options={[{ value: "preview", label: "Preview" }, { value: "code", label: "Code" }]}
          />
          {tab === "preview" && (
            <button type="button" onClick={() => setRun((n) => n + 1)} className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] text-fg-muted hover:bg-subtle hover:text-fg ${ring}`}>
              <RotateCcw size={14} aria-hidden /> Replay
            </button>
          )}
        </div>
        {tab === "preview" ? <Stage key={item.slug} item={item} run={run} /> : code ? <CodeBlock code={code} language="tsx" title={installPath(item)} maxHeight={640} /> : <p className="text-sm text-fg-muted">Loading source…</p>}
      </div>

      {code && (
        <>
          <section className="grid gap-4">
            <Heading>Installation</Heading>
            <Installation item={item} code={code} />
          </section>
          <section className="grid gap-4">
            <Heading>Usage</Heading>
            <CodeBlock code={`import { ${name} } from "${importFrom}";\n\nexport function Example() {\n  return <${name} />;\n}`} language="tsx" title="example.tsx" lineNumbers={false} />
          </section>
          <PropsTable code={code} name={name} />
        </>
      )}
      <Pager item={item} />
    </article>
  );
}
