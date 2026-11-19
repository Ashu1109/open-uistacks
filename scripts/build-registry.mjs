#!/usr/bin/env node
/* Builds the open-uistacks registry: one r/<name>.json per component, block, template, helper and the theme, plus r/index.json,
   with every relative import rewritten to the layout the CLI installs (ui/, blocks/, templates/ under one folder). Also refreshes
   the catalog section of README.md. `--check` exits 1 when r/ or the README is stale instead of writing. */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, posix, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "r");
const REPO = "Ashu1109/open-uistacks";
const PEERS = new Set(["react", "react-dom"]);
const THEME_FILE = "open-uistacks.css";

const read = (p) => readFileSync(join(ROOT, p), "utf8");

function exported(source, name, open, close) {
  const start = source.indexOf(`export const ${name}`);
  const from = source.indexOf(open, source.indexOf("=", start));
  const to = source.indexOf(`\n${close};`, from);
  return JSON.parse(source.slice(from, to + 2));
}

/** npm package name of a bare import specifier: `motion/react` → `motion`, `@scope/pkg/x` → `@scope/pkg`. */
export function npmName(spec) {
  const parts = spec.split("/");
  return spec.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
}

/** Where a repo source file lands in a project: originals/ui and registry/ui → ui/, originals/blocks → blocks/, originals/templates → templates/. */
export function installPathOf(repoPath) {
  const m = /^(?:originals\/(ui|blocks|templates)|registry\/(ui))\/([a-z0-9-]+\.tsx?)$/.exec(repoPath);
  return m ? `${m[1] ?? m[2]}/${m[3]}` : null;
}

const IMPORT = /(^[ \t]*(?:import|export)\b[^;"]*?\bfrom\s*|^[ \t]*import\s*|\bimport\(\s*)"([^"]+)"/gm;

/** Rewrites one file's relative imports to the installed layout; returns the new source, the item names it needs and its npm packages. */
export function rewriteImports(source, repoPath, exists) {
  const requires = new Set();
  const packages = new Set();
  const from = installPathOf(repoPath);
  const content = source.replace(IMPORT, (whole, lead, spec) => {
    if (!spec.startsWith(".")) {
      if (!PEERS.has(npmName(spec))) packages.add(npmName(spec));
      return whole;
    }
    const base = posix.normalize(posix.join(posix.dirname(repoPath), spec));
    const target = [base, `${base}.tsx`, `${base}.ts`].find(exists);
    const to = target && installPathOf(target);
    if (!to) throw new Error(`${repoPath}: cannot map import "${spec}"`);
    requires.add(posix.basename(to).replace(/\.tsx?$/, ""));
    let next = posix.relative(posix.dirname(from), to.replace(/\.tsx?$/, ""));
    if (!next.startsWith(".")) next = `./${next}`;
    return `${lead}"${next}"`;
  });
  return { content, requires: [...requires], packages: [...packages] };
}

function themeItem() {
  const css = read("theme.css").replace(/^\/\*.*?\*\/\n/s, "/* open-uistacks theme: design tokens for light (:root) and dark (.dark), exposed to Tailwind v4. Import after tailwindcss. */\n");
  return {
    name: "theme",
    title: "Theme",
    kind: "theme",
    group: "Theme",
    description: "Colour, surface, shadow and series tokens for light and dark mode, mapped to Tailwind utilities like bg-surface and text-fg-muted.",
    license: "MIT",
    author: "open-uistacks",
    dependencies: [],
    requires: [],
    files: [{ path: THEME_FILE, content: `${css.trimEnd()}\n\n@custom-variant dark (&:where(.dark, .dark *));\n` }],
  };
}

function build() {
  const catalog = read("playground/docs/catalog.ts");
  const descriptions = exported(read("playground/docs/meta.ts"), "DESCRIPTIONS", "{", "}");
  const versions = JSON.parse(read("package.json")).devDependencies;
  const exists = (p) => existsSync(join(ROOT, p));
  const pin = (pkg) => (versions[pkg] ? `${pkg}@${versions[pkg]}` : pkg);

  const sources = [
    ...exported(catalog, "COMPONENTS", "[", "]").map((c) => ({
      name: c.slug, title: c.name, kind: "component", group: c.category, free: c.tier === "Free",
      path: c.tier === "Free" ? `registry/ui/${c.slug}.tsx` : `originals/ui/${c.slug}.tsx`,
    })),
    { name: "chart-utils", title: "Chart utils", kind: "lib", group: "Helpers", path: "originals/ui/chart-utils.ts",
      description: "Shared scales, paths, statistics and motion helpers (enter, DrawPath, CountUp, Leaving) used by the charts and many components." },
    ...exported(catalog, "BLOCKS", "[", "]").map((b) => ({ name: b.slug, title: b.name, kind: "block", group: b.family, path: `originals/blocks/${b.slug}.tsx` })),
    ...exported(catalog, "TEMPLATES", "[", "]").map((t) => ({ name: t.slug, title: t.name, kind: "template", group: "Templates", path: `originals/templates/${t.slug}.tsx` })),
  ];

  const items = sources.map((s) => {
    const { content, requires, packages } = rewriteImports(read(s.path), s.path, exists);
    return {
      name: s.name,
      title: s.title,
      kind: s.kind,
      group: s.group,
      description: s.description ?? descriptions[s.name] ?? "",
      license: "MIT",
      author: s.free ? "UI Stacks <https://uistacks.dev>, MIT; free component, unchanged" : "open-uistacks",
      dependencies: packages.sort().map(pin),
      requires: requires.filter((r) => r !== s.name).sort(),
      files: [{ path: installPathOf(s.path), content }],
    };
  });
  items.push(themeItem());

  const names = new Set(items.map((i) => i.name));
  for (const item of items) for (const r of item.requires) if (!names.has(r)) throw new Error(`${item.name} requires unknown item ${r}`);

  const index = {
    name: "open-uistacks",
    homepage: `https://github.com/${REPO}`,
    items: items.map(({ name, title, kind, group, description }) => ({ name, title, kind, group, description })),
  };
  return { items, index };
}

function catalogMarkdown(index) {
  const byKind = (kind) => index.items.filter((i) => i.kind === kind);
  const groups = (list) => [...new Set(list.map((i) => i.group))].map((g) => [g, list.filter((i) => i.group === g)]);
  const table = (list) => ["| Name | Add it |", "|---|---|", ...list.map((i) => `| ${i.title} | \`add ${i.name}\` |`)].join("\n");
  const section = (title, kind) => {
    const list = byKind(kind);
    return [`### ${title} (${list.length})`, "", ...groups(list).map(([g, l]) => `<details>\n<summary><strong>${g}</strong> (${l.length})</summary>\n\n${table(l)}\n\n</details>\n`)].join("\n");
  };
  return [section("Components", "component"), section("Blocks", "block"), `### Templates (${byKind("template").length})\n\n${table(byKind("template"))}\n`].join("\n");
}

function withCatalog(readme, index) {
  const start = "<!-- catalog:start -->";
  const end = "<!-- catalog:end -->";
  if (!readme.includes(start)) return readme;
  return `${readme.slice(0, readme.indexOf(start) + start.length)}\n${catalogMarkdown(index)}\n${readme.slice(readme.indexOf(end))}`;
}

function main() {
  const check = process.argv.includes("--check");
  const { items, index } = build();
  const files = new Map([["index.json", index], ...items.map((i) => [`${i.name}.json`, i])].map(([f, v]) => [f, `${JSON.stringify(v, null, 2)}\n`]));
  const readmePath = join(ROOT, "README.md");
  const readme = existsSync(readmePath) ? readFileSync(readmePath, "utf8") : "";
  const nextReadme = withCatalog(readme, index);

  if (check) {
    const current = existsSync(OUT) ? readdirSync(OUT) : [];
    const stale = [...files].filter(([f, body]) => !existsSync(join(OUT, f)) || readFileSync(join(OUT, f), "utf8") !== body).map(([f]) => f);
    const extra = current.filter((f) => !files.has(f));
    if (nextReadme !== readme) stale.push("README.md");
    if (stale.length || extra.length) {
      console.error(`Registry is stale (${[...stale, ...extra].slice(0, 8).join(", ")}${stale.length + extra.length > 8 ? ", ..." : ""}). Run: npm run registry`);
      process.exit(1);
    }
    console.log(`Registry is up to date (${items.length} items).`);
    return;
  }
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  for (const [f, body] of files) writeFileSync(join(OUT, f), body);
  if (nextReadme !== readme) writeFileSync(readmePath, nextReadme);
  console.log(`Wrote ${items.length} items to ${relative(process.cwd(), OUT) || "r"}/.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
