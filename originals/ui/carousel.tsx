"use client";

import { Children, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/* Carousel: a scroll-snap slider with previous/next buttons and dot indicators; arrow keys move between slides and the dots follow native scrolling. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export function clampIndex(index: number, count: number): number {
  return Math.min(Math.max(index, 0), Math.max(count - 1, 0));
}

/** Slide closest to the current scroll offset. */
export function slideIndex(scrollLeft: number, slideWidth: number, count: number): number {
  return slideWidth > 0 ? clampIndex(Math.round(scrollLeft / slideWidth), count) : 0;
}

export interface CarouselProps {
  children: ReactNode;
  label?: string;
  onIndexChange?: (index: number) => void;
  className?: string;
}

const nav = `absolute top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-surface text-fg shadow-[var(--shadow-card)] transition-opacity disabled:pointer-events-none disabled:opacity-0 ${ring}`;

export function Carousel({ children, label = "Carousel", onIndexChange, className = "" }: CarouselProps) {
  const slides = Children.toArray(children);
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const goTo = (next: number) => {
    const target = clampIndex(next, slides.length);
    setIndex(target);
    onIndexChange?.(target);
    const el = track.current;
    el?.scrollTo?.({ left: target * el.clientWidth, behavior: "smooth" });
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label={label}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          e.preventDefault();
          goTo(index + (e.key === "ArrowRight" ? 1 : -1));
        }
      }}
      className={`relative w-full max-w-xl ${className}`}
    >
      <div
        ref={track}
        tabIndex={0}
        aria-live="polite"
        onScroll={(e) => {
          const el = e.currentTarget;
          const next = slideIndex(el.scrollLeft, el.clientWidth, slides.length);
          if (next !== index) {
            setIndex(next);
            onIndexChange?.(next);
          }
        }}
        className={`flex snap-x snap-mandatory overflow-x-auto rounded-[20px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${ring}`}
      >
        {slides.map((slide, i) => (
          <div key={i} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${slides.length}`} className="w-full shrink-0 snap-center">{slide}</div>
        ))}
      </div>
      <button type="button" aria-label="Previous slide" disabled={index === 0} onClick={() => goTo(index - 1)} className={`${nav} left-3`}><ChevronLeft size={18} aria-hidden /></button>
      <button type="button" aria-label="Next slide" disabled={index >= slides.length - 1} onClick={() => goTo(index + 1)} className={`${nav} right-3`}><ChevronRight size={18} aria-hidden /></button>
      <div className="mt-3 flex justify-center gap-1.5">
        {slides.map((_, i) => (
          <button key={i} type="button" aria-label={`Go to slide ${i + 1}`} aria-current={i === index} onClick={() => goTo(i)} className={`h-1.5 rounded-full transition-all ${ring} ${i === index ? "w-5 bg-select" : "w-1.5 bg-track-strong"}`} />
        ))}
      </div>
    </section>
  );
}
