import type { ReactNode } from "react";
import { useDemoView, useIsolated } from "../demo";
import { AssistantHome } from "../../originals/blocks/assistant-home";
import { AssistantStart } from "../../originals/blocks/assistant-start";
import { ChatAnswerSources } from "../../originals/blocks/chat-answer-sources";
import { ChatThreadComposer } from "../../originals/blocks/chat-thread-composer";
import { KnowledgeSources } from "../../originals/blocks/knowledge-sources";
import { StacksAssist } from "../../originals/templates/stacks-assist";

function Demo({ title, slug, children }: { title: string; slug: string; children: ReactNode }) {
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

export function Section() {
  const isolated = useIsolated();
  return (
    <div className="grid gap-10">
      <Demo title="Assistant home" slug="assistant-home"><AssistantHome /></Demo>
      <Demo title="Assistant start" slug="assistant-start"><AssistantStart /></Demo>
      <Demo title="Chat answer with sources" slug="chat-answer-sources"><div className="mx-auto max-w-[720px]"><ChatAnswerSources /></div></Demo>
      <Demo title="Chat thread with composer" slug="chat-thread-composer"><div className="h-[560px]"><ChatThreadComposer /></div></Demo>
      <Demo title="Knowledge sources" slug="knowledge-sources"><KnowledgeSources /></Demo>
      {!isolated && (
      <section id="stacks-assist" className="grid gap-3">
        <h3 className="text-sm font-medium text-fg-muted">StacksAssist template</h3>
        <div className="h-[860px] overflow-hidden rounded-[20px] shadow-[var(--shadow-card)]"><StacksAssist /></div>
      </section>
      )}
    </div>
  );
}
