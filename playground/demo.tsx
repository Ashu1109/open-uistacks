import { createContext, useContext, type ReactNode } from "react";

/* Demo switch: one context lets the docs render a single demo out of a section, bare (no title card), while the
   section files keep their own Demo wrappers. */

export interface DemoViewValue {
  only?: string;
  bare?: boolean;
}

export const DemoView = createContext<DemoViewValue>({});

export type DemoVisibility = "show" | "bare" | "hidden";

export function useDemoView(slug: string): DemoVisibility {
  const { only, bare } = useContext(DemoView);
  if (only && only !== slug) return "hidden";
  return bare ? "bare" : "show";
}

export function Demo({ title, slug, children }: { title: string; slug: string; children: ReactNode }) {
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

/** True while the docs render a single demo, so a section can skip content that is not a Demo. */
export function useIsolated(): boolean {
  return useContext(DemoView).only !== undefined;
}
