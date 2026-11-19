"use client";

import { useState } from "react";
import { Activity, Gauge, GitPullRequest, Rocket, ShieldCheck, Bug, Hammer } from "lucide-react";
import { AppShell } from "../blocks/app-shell";
import { DevToolsBuildHealth } from "../blocks/dev-tools-build-health";
import { DevToolsCiMinutes } from "../blocks/dev-tools-ci-minutes";
import { DevToolsDeploysToday } from "../blocks/dev-tools-deploys-today";
import { DevToolsDora } from "../blocks/dev-tools-dora";
import { DevToolsFlakyTests } from "../blocks/dev-tools-flaky-tests";
import { DevToolsReleaseGate } from "../blocks/dev-tools-release-gate";
import { DevToolsReviewQueue } from "../blocks/dev-tools-review-queue";
import { DevToolsTopErrors } from "../blocks/dev-tools-top-errors";

/* Dev tools template: Forge, an engineering-productivity app. Overview shows DORA, build health, CI minutes, deploys and the release gate; Quality shows flaky tests, review queue and production errors. */

const SECTIONS = [
  {
    items: [
      { id: "overview", label: "Overview", icon: <Gauge size={16} aria-hidden /> },
      { id: "quality", label: "Quality", icon: <ShieldCheck size={16} aria-hidden /> },
    ],
  },
  {
    title: "Pipelines",
    items: [
      { id: "builds", label: "Builds", icon: <Hammer size={16} aria-hidden /> },
      { id: "deploys", label: "Deploys", icon: <Rocket size={16} aria-hidden /> },
      { id: "reviews", label: "Reviews", icon: <GitPullRequest size={16} aria-hidden /> },
      { id: "errors", label: "Errors", icon: <Bug size={16} aria-hidden /> },
    ],
  },
];

const VIEW_OF: Record<string, "overview" | "quality"> = { overview: "overview", builds: "overview", deploys: "overview", quality: "quality", reviews: "quality", errors: "quality" };
const TITLE: Record<string, string> = { overview: "Overview", builds: "Builds", deploys: "Deploys", quality: "Quality", reviews: "Reviews", errors: "Errors" };

const Mark = (
  <span className="grid size-8 place-items-center rounded-[10px] bg-[image:var(--grad-primary)] text-[var(--inverse-fg)]">
    <Activity size={17} aria-hidden />
  </span>
);

export interface DevToolsTemplateProps {
  className?: string;
}

export function DevTools({ className = "" }: DevToolsTemplateProps) {
  const [active, setActive] = useState("overview");
  const view = VIEW_OF[active] ?? "overview";
  return (
    <AppShell product={{ name: "Forge", mark: Mark }} sections={SECTIONS} activeId={active} onNavigate={setActive} title={TITLE[active]} subtitle="Platform team, last 7 days" className={className}>
      {view === "overview" ? (
        <div className="grid grid-cols-1 gap-4 @[900px]:grid-cols-12">
          <DevToolsDora className="@[900px]:col-span-12" />
          <DevToolsBuildHealth className="@[900px]:col-span-7" />
          <DevToolsCiMinutes className="@[900px]:col-span-5" />
          <DevToolsDeploysToday className="@[900px]:col-span-7" />
          <DevToolsReleaseGate className="@[900px]:col-span-5" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 @[900px]:grid-cols-12">
          <DevToolsFlakyTests className="@[900px]:col-span-6" />
          <DevToolsReviewQueue className="@[900px]:col-span-6" />
          <DevToolsTopErrors className="@[900px]:col-span-12" />
        </div>
      )}
    </AppShell>
  );
}
