import { useEffect, useState } from "react";
import { pascal, type Item } from "./items";

/* Source files for the docs: lazily loaded raw source per item, plus small parsers for the export name, props table,
   npm dependencies and sibling files a component imports. */

const RAW = import.meta.glob<string>(
  ["../../originals/ui/*.{ts,tsx}", "../../originals/blocks/*.tsx", "../../originals/templates/*.tsx", "../../registry/ui/*.tsx", "!**/*.test.tsx"],
  { query: "?raw", import: "default" }
);

export function sourceKey(item: Item): string {
  if (item.kind === "block") return `../../originals/blocks/${item.slug}.tsx`;
  if (item.kind === "template") return `../../originals/templates/${item.slug}.tsx`;
  return item.tier === "Free" ? `../../registry/ui/${item.slug}.tsx` : `../../originals/ui/${item.slug}.tsx`;
}

export const installPath = (item: Item) => `components/${item.kind === "component" ? "ui" : `${item.kind}s`}/${item.slug}.tsx`;

export function useSource(item: Item): string | undefined {
  const key = sourceKey(item);
  const [state, setState] = useState<{ key: string; code: string }>();
  useEffect(() => {
    let live = true;
    RAW[key]?.().then((code) => live && setState({ key, code }));
    return () => {
      live = false;
    };
  }, [key]);
  return state?.key === key ? state.code : undefined;
}

export function exportName(code: string, slug: string): string {
  const wanted = pascal(slug);
  if (new RegExp(`export function ${wanted}\\b`).test(code)) return wanted;
  return code.match(/export function ([A-Z]\w*)/)?.[1] ?? wanted;
}

export interface PropRow {
  name: string;
  type: string;
  optional: boolean;
  defaultValue?: string;
  doc?: string;
}

function defaults(code: string, name: string): Record<string, string> {
  const head = code.match(new RegExp(`export function ${name}\\(\\{([\\s\\S]*?)\\}\\s*:`))?.[1] ?? "";
  return Object.fromEntries([...head.matchAll(/(\w+)\s*=\s*([^,\n]+?)\s*(?:,|$)/gm)].map((m) => [m[1], m[2].trim()]));
}

// ponytail: line-based parse of `export interface <Name>Props`; nested object types show their first line only.
export function parseProps(code: string, name: string): PropRow[] {
  const body = code.match(new RegExp(`export interface ${name}Props(?:\\s+extends[^{]+)?\\s*\\{\\n([\\s\\S]*?)\\n\\}`))?.[1];
  if (!body) return [];
  const found = defaults(code, name);
  const rows: PropRow[] = [];
  let doc: string | undefined;
  for (const line of body.split("\n")) {
    const comment = line.match(/^\s{2}\/\*\*\s*(.*?)\s*\*\/\s*$/);
    if (comment) {
      doc = comment[1];
      continue;
    }
    const field = line.match(/^\s{2}(?:readonly\s+)?("?[\w-]+"?)(\?)?:\s*(.+?);?\s*$/);
    if (!field) continue;
    const propName = field[1].replace(/"/g, "");
    rows.push({ name: propName, type: field[3], optional: Boolean(field[2]), defaultValue: found[propName], doc });
    doc = undefined;
  }
  return rows;
}

export function npmDependencies(code: string): string[] {
  return [["motion/react", "motion"], ["lucide-react", "lucide-react"]].filter(([from]) => code.includes(`"${from}"`)).map(([, pkg]) => pkg);
}

export function siblingFiles(code: string): string[] {
  return [...new Set([...code.matchAll(/from "(?:\.\.?\/)+(?:originals\/)?((?:ui|blocks|registry\/ui)\/)?([\w-]+)"/g)].map((m) => m[2]))].filter((f) => f !== "demo");
}
