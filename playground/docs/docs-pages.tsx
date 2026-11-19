import type { ReactNode } from "react";
import { CodeBlock } from "../../registry/ui/code-block";
import { PageHeader } from "./ui";
import { href, itemsOf } from "./items";

/* Docs pages: introduction, installation and theming. */

export const DOC_PAGES = [
  { slug: "introduction", name: "Introduction" },
  { slug: "installation", name: "Installation" },
  { slug: "theming", name: "Themes and modes" },
] as const;

function Prose({ children }: { children: ReactNode }) {
  return <div className="grid max-w-3xl gap-5 text-[15px] leading-7 text-fg-muted [&_h2]:mt-4 [&_h2]:text-[20px] [&_h2]:font-semibold [&_h2]:text-fg [&_strong]:text-fg">{children}</div>;
}

function Introduction() {
  const components = itemsOf("component");
  const free = components.filter((c) => c.tier === "Free").length;
  const stats = [
    { label: "Components", value: components.length, to: href("components") },
    { label: "Blocks", value: itemsOf("block").length, to: href("blocks") },
    { label: "Templates", value: itemsOf("template").length, to: href("templates") },
  ];
  return (
    <div className="grid gap-10">
      <PageHeader title="Introduction">Animated React components, blocks and full app templates for AI products, dashboards and tools. Copy the source into your project and own it.</PageHeader>
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <a key={s.label} href={s.to} className="rounded-[20px] bg-surface p-5 shadow-[var(--shadow-card)] transition-colors hover:bg-[color-mix(in_srgb,var(--fg)_3%,var(--surface))] dark:bg-raised">
            <p className="text-[13px] text-fg-muted">{s.label}</p>
            <p className="mt-1 text-[32px] font-semibold tabular-nums text-fg">{s.value}</p>
          </a>
        ))}
      </div>
      <Prose>
        <p><strong>{free} free components</strong> are the MIT-licensed originals from their public registry. The other <strong>{components.length - free} components</strong>, every block and every template were written from scratch for this kit on the same design tokens.</p>
        <p>Everything is built with React, Tailwind CSS v4, Motion and Lucide icons. There is no runtime package to install: each page shows the full source, the files it imports and its props.</p>
        <h2>How a page is laid out</h2>
        <p>Every component, block and template page has a live <strong>Preview</strong>, the <strong>Code</strong>, installation steps, a usage snippet and a props table. Blocks ship with sample data, so they render on their own; templates can be previewed at desktop, tablet and phone widths.</p>
      </Prose>
    </div>
  );
}

const CLI = "npx github:Ashu1109/open-uistacks";

function Installation() {
  return (
    <div className="grid gap-10">
      <PageHeader title="Installation">Start from a React project with Tailwind CSS v4, then add components with the open-uistacks CLI.</PageHeader>
      <Prose>
        <h2>1. Set up the theme</h2>
        <p>Run <strong>init</strong> once. It creates <strong>open-uistacks.json</strong>, writes the theme tokens to <strong>components/open-uistacks.css</strong> (or <strong>src/components</strong> when you have a src folder) and imports them right after Tailwind in your global stylesheet.</p>
        <CodeBlock code={`${CLI} init`} language="bash" title="Terminal" lineNumbers={false} />
        <h2>2. Add components</h2>
        <p>Name one or more components, blocks or templates. Each one arrives with everything it imports: components go in <strong>ui/</strong>, blocks in <strong>blocks/</strong> and templates in <strong>templates/</strong>. The npm packages they need (motion and lucide-react) are installed with your package manager.</p>
        <CodeBlock code={`${CLI} add prompt-input model-picker\n${CLI} add revenue-overview\n${CLI} add devops`} language="bash" title="Terminal" lineNumbers={false} />
        <p>Use <strong>list</strong> to see every name, <strong>--dry-run</strong> to preview the changes, and <strong>--overwrite</strong> to update files you already added. Dark mode follows a <strong>dark</strong> class on the root element.</p>
        <CodeBlock code={`${CLI} list\n${CLI} add kanban-board --dry-run`} language="bash" title="Terminal" lineNumbers={false} />
        <h2>Or copy by hand</h2>
        <p>Install <strong>motion</strong> and <strong>lucide-react</strong>, copy <strong>theme.css</strong> next to your global stylesheet and import it after Tailwind, then paste a component from its <strong>Code</strong> tab into <strong>components/ui</strong>.</p>
        <CodeBlock code={`@import "tailwindcss";\n@import "./theme.css";\n@custom-variant dark (&:where(.dark, .dark *));`} language="text" title="globals.css" lineNumbers={false} />
      </Prose>
    </div>
  );
}

const TOKENS = ["bg", "surface", "raised", "subtle", "track", "fg", "fg-muted", "fg-subtle", "select", "select-soft", "success", "warning", "danger"];

function Theming() {
  return (
    <div className="grid gap-10">
      <PageHeader title="Themes and modes">Every component reads the same CSS variables, so changing a token restyles the whole kit in both light and dark mode.</PageHeader>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {TOKENS.map((t) => (
          <div key={t} className="overflow-hidden rounded-[16px] bg-surface shadow-[var(--shadow-card)] dark:bg-raised">
            <div className="h-16 ring-1 ring-inset ring-track" style={{ background: `var(--${t})` }} />
            <p className="px-3 py-2 font-mono text-[12px] text-fg">--{t}</p>
          </div>
        ))}
      </div>
      <Prose>
        <p>Tokens are defined on <strong>:root</strong> for light mode and on <strong>.dark</strong> for dark mode, and exposed to Tailwind through <strong>@theme inline</strong>, which is why classes like <strong>bg-surface</strong> and <strong>text-fg-muted</strong> work. Use the toggle in the top bar to compare both modes.</p>
      </Prose>
    </div>
  );
}

export function DocsPage({ slug }: { slug?: string }) {
  if (slug === "installation") return <Installation />;
  if (slug === "theming") return <Theming />;
  return <Introduction />;
}
