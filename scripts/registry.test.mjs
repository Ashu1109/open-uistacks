// @vitest-environment node
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { installPathOf, npmName, rewriteImports } from "./build-registry.mjs";
import { importTheme } from "../bin/open-uistacks.mjs";

describe("registry builder", () => {
  it("names npm packages from import specifiers", () => {
    expect(npmName("motion/react")).toBe("motion");
    expect(npmName("@scope/pkg/sub")).toBe("@scope/pkg");
  });

  it("maps repo files to the installed layout", () => {
    expect(installPathOf("registry/ui/button.tsx")).toBe("ui/button.tsx");
    expect(installPathOf("originals/blocks/app-shell.tsx")).toBe("blocks/app-shell.tsx");
    expect(installPathOf("playground/app.tsx")).toBeNull();
  });

  it("rewrites relative imports and ignores look-alike JSX text", () => {
    const source = [
      'import { Button } from "../../registry/ui/button";',
      'import { CountUp } from "../ui/chart-utils";',
      'import { motion } from "motion/react";',
      "export function X() {",
      '  return <Pick label="from" value={pair.from} />;',
      "}",
    ].join("\n");
    const exists = (p) => ["registry/ui/button.tsx", "originals/ui/chart-utils.ts"].includes(p);
    const out = rewriteImports(source, "originals/blocks/x.tsx", exists);
    expect(out.content.split("\n").slice(0, 2)).toEqual(['import { Button } from "../ui/button";', 'import { CountUp } from "../ui/chart-utils";']);
    expect(out.content.split("\n").slice(2)).toEqual(source.split("\n").slice(2));
    expect(out.requires.sort()).toEqual(["button", "chart-utils"]);
    expect(out.packages).toEqual(["motion"]);
  });

  it("matches the committed r/ folder and README catalog", () => {
    expect(() => execFileSync("node", ["scripts/build-registry.mjs", "--check"], { stdio: "pipe" })).not.toThrow();
  });
});

describe("cli", () => {
  it("imports the theme right after Tailwind, once", () => {
    const first = importTheme('@import "tailwindcss";\nbody {}\n', "./components/open-uistacks.css");
    expect(first.css).toBe('@import "tailwindcss";\n@import "./components/open-uistacks.css";\nbody {}\n');
    expect(importTheme(first.css, "./components/open-uistacks.css").changed).toBe(false);
  });
});
