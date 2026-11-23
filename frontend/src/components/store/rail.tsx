"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "../ui/icons";

/**
 * Horizontal, snap-scrolling row of cards. Renders the section heading on the left and
 * two quiet arrow buttons on the right for mouse users; touch users just swipe.
 */
export function Rail({
  heading,
  label,
  children,
}: {
  heading: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  const track = useRef<HTMLDivElement>(null);

  const scroll = (dir: 1 | -1) => {
    const el = track.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 sm:mb-10">
        {heading}
        <div className="hidden gap-2 sm:flex">
          <ArrowButton label={`Scroll ${label} back`} onClick={() => scroll(-1)}>
            <ChevronLeft size={16} />
          </ArrowButton>
          <ArrowButton label={`Scroll ${label} forward`} onClick={() => scroll(1)}>
            <ChevronRight size={16} />
          </ArrowButton>
        </div>
      </div>
      <div
        ref={track}
        role="region"
        aria-label={label}
        className="no-scrollbar -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-6 pt-1 sm:gap-5"
      >
        {children}
      </div>
    </div>
  );
}

function ArrowButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid h-10 w-10 place-items-center rounded-full bg-bg-soft text-ink-2 transition-colors hover:bg-bg-sunken hover:text-ink"
    >
      {children}
    </button>
  );
}
