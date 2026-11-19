"use client";

import { CircleAlert, RotateCw } from "lucide-react";
import { useState } from "react";

/* Image generations: a grid of images the model produced for a prompt; pending tiles shimmer, failed tiles offer retry, and a ready tile can be selected. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface GeneratedImage {
  id: string;
  /** Image URL; ready tiles without one show a gradient placeholder. */
  src?: string;
  alt: string;
  status?: "loading" | "ready" | "error";
}

export interface ImageGenerationsProps {
  prompt?: string;
  images: GeneratedImage[];
  selectedId?: string;
  defaultSelectedId?: string;
  onSelect?: (id: string) => void;
  onRetry?: (id: string) => void;
  columns?: 2 | 3 | 4;
  className?: string;
}

const COLS = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" } as const;

/** Stable placeholder gradient for an id, so demo tiles differ without real images. */
export function placeholderGradient(id: string): string {
  const hue = [...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 0);
  return `linear-gradient(135deg, hsl(${hue} 70% 70%), hsl(${(hue + 60) % 360} 70% 55%))`;
}

export function ImageGenerations({ prompt, images, selectedId, defaultSelectedId, onSelect, onRetry, columns = 2, className = "" }: ImageGenerationsProps) {
  const [inner, setInner] = useState(defaultSelectedId);
  const selected = selectedId ?? inner;
  const pick = (id: string) => {
    if (selectedId === undefined) setInner(id);
    onSelect?.(id);
  };
  const pending = images.filter((i) => i.status === "loading").length;

  return (
    <section aria-label="Generated images" className={`w-full max-w-md ${className}`}>
      {prompt && <p className="mb-2 line-clamp-2 text-[13px] text-fg-muted">{prompt}</p>}
      <ul className={`grid gap-2 ${COLS[columns]}`}>
        {images.map((img) => {
          const status = img.status ?? "ready";
          return (
            <li key={img.id} className="relative aspect-square overflow-hidden rounded-[14px] bg-subtle">
              {status === "loading" && <div role="status" aria-label={`Generating ${img.alt}`} className="size-full animate-pulse bg-track" />}
              {status === "error" && (
                <div className="grid size-full place-items-center gap-1 p-2 text-center text-xs text-danger-text">
                  <CircleAlert size={18} aria-hidden />
                  Failed
                  <button type="button" onClick={() => onRetry?.(img.id)} aria-label={`Retry ${img.alt}`} className={`inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-fg shadow-[var(--shadow-btn-secondary)] ${ring}`}><RotateCw size={12} aria-hidden /> Retry</button>
                </div>
              )}
              {status === "ready" && (
                <button type="button" aria-pressed={selected === img.id} aria-label={img.alt} onClick={() => pick(img.id)} className={`group block size-full ${ring} ${selected === img.id ? "ring-2 ring-[var(--select)] ring-inset" : ""}`}>
                  {img.src ? <img src={img.src} alt="" className="size-full object-cover" /> : <span aria-hidden className="block size-full" style={{ background: placeholderGradient(img.id) }} />}
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <p role="status" className="sr-only">{pending > 0 ? `${pending} images generating` : "Images ready"}</p>
    </section>
  );
}
