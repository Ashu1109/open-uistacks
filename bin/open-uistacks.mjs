#!/usr/bin/env node
/* open-uistacks CLI. `init` writes open-uistacks.json and the theme stylesheet and imports it after Tailwind; `add` copies items and
   everything they import into ui/, blocks/ and templates/ under the configured folder, then installs their npm packages; `list` prints
   the catalog. Reads the registry bundled next to this file, else --registry (folder or URL), else the GitHub copy. No dependencies. */
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, posix, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";

const PKG = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const BUNDLED = fileURLToPath(new URL("../r/", import.meta.url));
const REMOTE = "https://raw.githubusercontent.com/Ashu1109/open-uistacks/main/r/";
const CONFIG = "open-uistacks.json";
const THEME_FILE = "open-uistacks.css";
const NAME = /^[a-z0-9][a-z0-9-]*$/;
const FILE = /^(?:(?:ui|blocks|templates)\/[a-z0-9-]+\.tsx?|open-uistacks\.css)$/;
const GLOBAL_CSS = ["src/index.css", "src/app/globals.css", "app/globals.css", "src/styles/globals.css", "styles/globals.css", "src/globals.css", "src/main.css", "src/styles.css", "src/App.css"];

const HELP = `open-uistacks ${PKG.version}

Usage
  npx github:Ashu1109/open-uistacks <command> [options]

Commands
  init                 Create ${CONFIG}, add the theme stylesheet and import it after Tailwind
  add <name...>        Add components, blocks or templates (and everything they import)
  list [kind]          List what you can add; kind is component, block or template

Options
  --dir <path>         Folder for ui/, blocks/ and templates/ (init; default src/components or components)
  --css <file>         Global stylesheet to import the theme into (init; found automatically)
  --overwrite          Replace files that differ without asking (add)
  --no-install         Skip installing npm packages (add)
  --dry-run            Show what would change without writing anything (add)
  --registry <src>     Registry folder or URL (default: the copy bundled with this CLI)
  -h, --help           Show this help
  -v, --version        Show the version

Examples
  npx github:Ashu1109/open-uistacks init
  npx github:Ashu1109/open-uistacks add prompt-input model-picker
  npx github:Ashu1109/open-uistacks add devops
  npx github:Ashu1109/open-uistacks list block`;

function parseArgs(argv) {
  const flags = { overwrite: false, install: true, dryRun: false, help: false, version: false };
  const values = {};
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-h" || a === "--help") flags.help = true;
    else if (a === "-v" || a === "--version") flags.version = true;
    else if (a === "--overwrite") flags.overwrite = true;
    else if (a === "--no-install") flags.install = false;
    else if (a === "--dry-run") flags.dryRun = true;
    else if (a === "--dir" || a === "--css" || a === "--registry") {
      const v = argv[++i];
      if (!v || v.startsWith("--")) throw new Error(`${a} needs a value`);
      values[a.slice(2)] = v;
    } else if (a.startsWith("-")) throw new Error(`Unknown option ${a}. Run with --help.`);
    else positional.push(a);
  }
  return { command: positional[0], names: positional.slice(1), flags, values };
}

function registry(source) {
  const src = source ?? process.env.OPEN_UISTACKS_REGISTRY ?? (existsSync(join(BUNDLED, "index.json")) ? BUNDLED : REMOTE);
  const remote = /^https?:\/\//.test(src);
  return async (file) => {
    if (remote) {
      const url = new URL(file, src.endsWith("/") ? src : `${src}/`);
      const res = await fetch(url).catch((e) => { throw new Error(`Could not reach ${url}: ${e.message}`); });
      if (res.status === 404) throw new Error(`Not in the registry: ${file.replace(/\.json$/, "")}. Run "list" to see names.`);
      if (!res.ok) throw new Error(`${url} answered ${res.status}`);
      return res.json();
    }
    const path = join(resolve(src), file);
    if (!existsSync(path)) throw new Error(`Not in the registry: ${file.replace(/\.json$/, "")}. Run "list" to see names.`);
    return JSON.parse(readFileSync(path, "utf8"));
  };
}

/** Registry items come from a folder or the network, so their shape and file paths are checked before anything is written. */
function checkItem(item, name) {
  if (!item || item.name !== name || !Array.isArray(item.files) || !Array.isArray(item.requires ?? []) || !Array.isArray(item.dependencies ?? [])) {
    throw new Error(`Registry item "${name}" is malformed.`);
  }
  for (const f of item.files) {
    if (typeof f.path !== "string" || typeof f.content !== "string" || !FILE.test(f.path)) throw new Error(`Registry item "${name}" has an unsafe file path: ${f.path}`);
  }
  for (const r of item.requires ?? []) if (!NAME.test(r)) throw new Error(`Registry item "${name}" requires an invalid name: ${r}`);
  for (const d of item.dependencies ?? []) if (!/^(@[a-z0-9._-]+\/)?[a-z0-9._-]+(@[\w.^~<>=| -]+)?$/i.test(d)) throw new Error(`Registry item "${name}" lists an invalid package: ${d}`);
  return item;
}

const toPosix = (p) => p.split(sep).join("/");

function readConfig(cwd) {
  const path = join(cwd, CONFIG);
  if (!existsSync(path)) return null;
  const config = JSON.parse(readFileSync(path, "utf8"));
  const inside = typeof config.dir === "string" ? relative(cwd, resolve(cwd, config.dir)) : "..";
  if (inside.startsWith("..") || isAbsolute(inside)) throw new Error(`${CONFIG} needs a "dir" inside this project.`);
  return config;
}

function findGlobalCss(cwd, explicit) {
  if (explicit) return existsSync(join(cwd, explicit)) ? explicit : null;
  return GLOBAL_CSS.find((f) => existsSync(join(cwd, f)) && /tailwindcss/.test(readFileSync(join(cwd, f), "utf8"))) ?? null;
}

/** Adds `@import "<theme>";` right after the Tailwind import; returns what happened. */
export function importTheme(css, themeRelPath) {
  if (css.includes(THEME_FILE)) return { css, changed: false };
  const line = `@import "${themeRelPath}";`;
  const lines = css.split("\n");
  const at = lines.findIndex((l) => /@import\s+["']tailwindcss["']/.test(l));
  if (at === -1) return { css: `${line}\n${css}`, changed: true };
  lines.splice(at + 1, 0, line);
  return { css: lines.join("\n"), changed: true };
}

function write(cwd, dir, file, { overwrite, dryRun }, ask) {
  const target = join(cwd, dir, file.path);
  const shown = toPosix(relative(cwd, target));
  if (existsSync(target)) {
    if (readFileSync(target, "utf8") === file.content) return { shown, state: "unchanged" };
    if (!overwrite && !ask) return { shown, state: "skipped (differs; rerun with --overwrite)" };
  }
  return { shown, target, state: existsSync(target) ? "replace" : "create" };
}

async function init(cwd, values, fetchItem, quiet = false) {
  let config = readConfig(cwd);
  if (!config) {
    config = { dir: values.dir ?? (existsSync(join(cwd, "src")) ? "src/components" : "components") };
    writeFileSync(join(cwd, CONFIG), `${JSON.stringify(config, null, 2)}\n`);
    console.log(`Created ${CONFIG} (components go in ${config.dir}/).`);
  } else if (!quiet) console.log(`Found ${CONFIG} (components go in ${config.dir}/).`);

  const theme = checkItem(await fetchItem("theme.json"), "theme");
  const themePath = join(cwd, config.dir, THEME_FILE);
  if (!existsSync(themePath)) {
    mkdirSync(dirname(themePath), { recursive: true });
    writeFileSync(themePath, theme.files[0].content);
    console.log(`Added the theme: ${toPosix(relative(cwd, themePath))}`);
  }

  const cssFile = findGlobalCss(cwd, values.css);
  if (cssFile) {
    let rel = posix.relative(posix.dirname(cssFile), toPosix(relative(cwd, themePath)));
    if (!rel.startsWith(".")) rel = `./${rel}`;
    const { css, changed } = importTheme(readFileSync(join(cwd, cssFile), "utf8"), rel);
    if (changed) {
      writeFileSync(join(cwd, cssFile), css);
      console.log(`Imported the theme in ${cssFile}.`);
    }
  } else {
    console.log(`Add this line to your global stylesheet, after @import "tailwindcss";\n  @import "./${toPosix(relative(cwd, themePath))}";  (path relative to that stylesheet)`);
  }
  return config;
}

function packageManager(cwd) {
  if (existsSync(join(cwd, "pnpm-lock.yaml"))) return ["pnpm", "add"];
  if (existsSync(join(cwd, "yarn.lock"))) return ["yarn", "add"];
  if (existsSync(join(cwd, "bun.lockb")) || existsSync(join(cwd, "bun.lock"))) return ["bun", "add"];
  return ["npm", "install"];
}

function missingPackages(cwd, wanted) {
  const path = join(cwd, "package.json");
  const pkg = existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : {};
  const have = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies };
  return wanted.filter((d) => !have[d.replace(/(.)@.*$/, "$1")]);
}

async function add(cwd, names, flags, values, fetchItem) {
  if (names.length === 0) throw new Error(`Name at least one item, for example: add prompt-input. Run "list" to see names.`);
  for (const n of names) if (!NAME.test(n)) throw new Error(`"${n}" is not a valid name.`);
  const config = flags.dryRun ? readConfig(cwd) ?? { dir: values.dir ?? (existsSync(join(cwd, "src")) ? "src/components" : "components") } : readConfig(cwd) ?? (await init(cwd, values, fetchItem, true));

  const items = [];
  const seen = new Set();
  const queue = [...names];
  while (queue.length) {
    const name = queue.shift();
    if (seen.has(name)) continue;
    seen.add(name);
    const item = checkItem(await fetchItem(`${name}.json`), name);
    items.push(item);
    queue.push(...(item.requires ?? []));
  }

  const tty = process.stdin.isTTY && process.stdout.isTTY;
  const rl = tty && !flags.overwrite && !flags.dryRun ? createInterface({ input: process.stdin, output: process.stdout }) : null;
  const counts = { create: 0, replace: 0, unchanged: 0, skipped: 0 };
  try {
    for (const item of items) {
      for (const file of item.files) {
        const plan = write(cwd, config.dir, file, flags, Boolean(rl));
        let state = plan.state;
        if (state === "replace" && !flags.overwrite && rl) {
          const answer = await rl.question(`${plan.shown} differs from the registry. Replace it? (y/N) `);
          if (!/^y(es)?$/i.test(answer.trim())) state = "skipped";
        }
        if ((state === "create" || state === "replace") && !flags.dryRun) {
          mkdirSync(dirname(plan.target), { recursive: true });
          writeFileSync(plan.target, file.content);
        }
        counts[state.startsWith("skipped") ? "skipped" : state]++;
        console.log(`${flags.dryRun && (state === "create" || state === "replace") ? `would ${state}` : state.padEnd(9)}  ${plan.shown}`);
      }
    }
  } finally {
    rl?.close();
  }

  const packages = [...new Set(items.flatMap((i) => i.dependencies ?? []))];
  const missing = missingPackages(cwd, packages);
  if (missing.length && flags.install && !flags.dryRun) {
    const [bin, verb] = packageManager(cwd);
    console.log(`Installing ${missing.join(" ")} with ${bin}...`);
    const run = spawnSync(bin, [verb, ...missing], { cwd, stdio: "inherit", shell: process.platform === "win32" });
    if (run.status !== 0) throw new Error(`${bin} ${verb} failed. Install these yourself: ${missing.join(" ")}`);
  } else if (missing.length) {
    console.log(`${flags.dryRun ? "Would install" : "Install these packages"}: ${missing.join(" ")}`);
  }

  console.log(`\n${flags.dryRun ? "Dry run: " : ""}${counts.create} added, ${counts.replace} replaced, ${counts.unchanged} unchanged, ${counts.skipped} skipped.`);
  const first = items[0]?.files[0];
  if (first && !flags.dryRun) console.log(`Import it from ${toPosix(join(config.dir, first.path)).replace(/\.tsx?$/, "")}`);
}

async function list(kind, fetchItem) {
  if (kind && !["component", "block", "template"].includes(kind.replace(/s$/, ""))) throw new Error(`Kind must be component, block or template.`);
  const index = await fetchItem("index.json");
  const items = index.items.filter((i) => (kind ? i.kind === kind.replace(/s$/, "") : ["component", "block", "template"].includes(i.kind)));
  const groups = [...new Set(items.map((i) => `${i.kind}s / ${i.group}`))];
  for (const g of groups) {
    console.log(`\n${g}`);
    for (const i of items.filter((x) => `${x.kind}s / ${x.group}` === g)) console.log(`  ${i.name.padEnd(30)} ${i.title}`);
  }
  console.log(`\n${items.length} items. Add one with: npx github:Ashu1109/open-uistacks add <name>`);
}

async function main(argv) {
  const { command, names, flags, values } = parseArgs(argv);
  if (flags.version) return console.log(PKG.version);
  if (flags.help || !command) return console.log(HELP);
  const fetchItem = registry(values.registry);
  const cwd = process.cwd();
  if (command === "init") return void (await init(cwd, values, fetchItem));
  if (command === "add") return add(cwd, names, flags, values, fetchItem);
  if (command === "list") return list(names[0], fetchItem);
  throw new Error(`Unknown command "${command}". Run with --help.`);
}

const invoked = process.argv[1] && existsSync(process.argv[1]) && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
if (invoked) {
  main(process.argv.slice(2)).catch((e) => {
    console.error(`open-uistacks: ${e.message}`);
    process.exit(1);
  });
}
