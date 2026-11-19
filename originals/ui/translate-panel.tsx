"use client";

import { ArrowLeftRight, Check, Copy } from "lucide-react";
import { useId, useState } from "react";

/* Translate panel: two panes, source text on the left and the translation on the right, with language selects, a swap button and copy; the parent supplies the translated text. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface Language {
  code: string;
  name: string;
}

export interface LanguagePair {
  from: string;
  to: string;
}

/** Swaps the pair; the source text and its translation trade places in the caller. */
export const swapPair = ({ from, to }: LanguagePair): LanguagePair => ({ from: to, to: from });

export interface TranslatePanelProps {
  languages: Language[];
  source: string;
  translated: string;
  onSourceChange?: (text: string) => void;
  pair?: LanguagePair;
  defaultPair?: LanguagePair;
  onPairChange?: (pair: LanguagePair) => void;
  /** Show a shimmer in the output pane. */
  loading?: boolean;
  className?: string;
}

export function TranslatePanel({ languages, source, translated, onSourceChange, pair: pairProp, defaultPair, onPairChange, loading = false, className = "" }: TranslatePanelProps) {
  const id = useId();
  const [inner, setInner] = useState<LanguagePair>(defaultPair ?? { from: languages[0]?.code ?? "", to: languages[1]?.code ?? languages[0]?.code ?? "" });
  const [copied, setCopied] = useState(false);
  const pair = pairProp ?? inner;

  const setPair = (next: LanguagePair) => {
    if (pairProp === undefined) setInner(next);
    onPairChange?.(next);
  };
  const copy = () => {
    void navigator.clipboard?.writeText(translated).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const select = (label: string, value: string, onChange: (code: string) => void) => (
    <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className={`rounded-full bg-subtle px-3 py-1.5 text-[13px] font-medium text-fg ${ring}`}>
      {languages.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
    </select>
  );

  return (
    <section aria-label="Translate" className={`w-full max-w-2xl rounded-[20px] bg-surface p-3 shadow-[var(--shadow-card)] ${className}`}>
      <div className="flex items-center justify-center gap-2 pb-3">
        {select("Translate from", pair.from, (from) => setPair({ ...pair, from }))}
        <button type="button" aria-label="Swap languages" onClick={() => setPair(swapPair(pair))} className={`grid size-8 place-items-center rounded-full text-fg-muted hover:bg-subtle ${ring}`}><ArrowLeftRight size={15} aria-hidden /></button>
        {select("Translate to", pair.to, (to) => setPair({ ...pair, to }))}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <textarea id={`${id}-src`} aria-label="Text to translate" value={source} onChange={(e) => onSourceChange?.(e.target.value)} placeholder="Type or paste text" rows={5} className={`resize-none rounded-[14px] bg-subtle p-3 text-[14px] leading-6 text-fg placeholder:text-fg-subtle ${ring}`} />
        <div className="relative rounded-[14px] bg-select-soft p-3">
          {loading ? (
            <div role="status" aria-label="Translating" className="grid gap-2 pt-1"><span className="h-3 animate-pulse rounded-full bg-track" /><span className="h-3 w-3/4 animate-pulse rounded-full bg-track" /></div>
          ) : (
            <output aria-label="Translation" aria-live="polite" className="block min-h-[7.5rem] whitespace-pre-wrap pr-8 text-[14px] leading-6 text-fg">{translated}</output>
          )}
          <button type="button" onClick={copy} disabled={!translated} aria-label={copied ? "Copied" : "Copy translation"} className={`absolute right-2 top-2 grid size-7 place-items-center rounded-full text-fg-muted hover:bg-surface disabled:opacity-30 ${ring}`}>{copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}</button>
        </div>
      </div>
    </section>
  );
}
