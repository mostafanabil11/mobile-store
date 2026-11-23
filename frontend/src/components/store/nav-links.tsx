"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/format";

export interface NavItem {
  href: string;
  label: string;
}

const linkClass =
  "relative z-10 rounded-full px-3 py-1.5 transition-colors duration-300 hover:text-ink";

/** Which item matches the current URL: every query param in the item's href must match. */
function useActiveHref(items: NavItem[]) {
  const pathname = usePathname();
  const params = useSearchParams();
  if (pathname !== "/products") return undefined;
  return items.find((item) => {
    const url = new URL(item.href, "http://x");
    return [...url.searchParams].every(([key, value]) => params.get(key) === value);
  })?.href;
}

/**
 * Desktop header links with a soft pill that slides to the active item.
 * The pill is positioned by writing styles directly (no re-render per frame) and
 * re-measured when the nav resizes, e.g. after fonts load.
 */
export function NavLinks({ items }: { items: NavItem[] }) {
  const active = useActiveHref(items);
  const nav = useRef<HTMLElement>(null);
  const pill = useRef<HTMLSpanElement>(null);
  const shown = useRef(false);

  // useLayoutEffect so the pill is placed before paint and never flashes at the wrong spot.
  useLayoutEffect(() => {
    const place = (animate: boolean) => {
      const el = pill.current;
      const link = active ? nav.current?.querySelector<HTMLAnchorElement>(`a[data-href="${active}"]`) : null;
      if (!el) return;
      if (!link) {
        el.style.opacity = "0";
        shown.current = false;
        return;
      }
      // First appearance fades in at its spot; later changes slide from the previous item.
      el.style.transitionProperty = animate && shown.current ? "transform, width, opacity" : "opacity";
      el.style.transform = `translateX(${link.offsetLeft}px)`;
      el.style.width = `${link.offsetWidth}px`;
      el.style.opacity = "1";
      shown.current = true;
    };

    place(true);
    const observer = new ResizeObserver(() => place(false));
    if (nav.current) observer.observe(nav.current);
    return () => observer.disconnect();
  }, [active]);

  return (
    <nav ref={nav} className="relative hidden items-center gap-1 text-[13px] text-ink-2 md:flex">
      <span
        ref={pill}
        aria-hidden
        className="absolute left-0 top-1/2 h-7 -translate-y-1/2 rounded-full bg-black/[0.06] opacity-0 duration-500 ease-apple motion-reduce:transition-none"
        style={{ transform: "translateX(0)", width: 0 }}
      />
      {items.map((item) => {
        const isActive = item.href === active;
        return (
          <Link
            key={item.href}
            href={item.href}
            data-href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(linkClass, isActive && "font-medium text-ink")}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Same links without the highlight, shown while the URL is being read. */
export function NavLinksStatic({ items }: { items: NavItem[] }) {
  return (
    <nav className="relative hidden items-center gap-1 text-[13px] text-ink-2 md:flex">
      {items.map((item) => (
        <Link key={item.href} href={item.href} className={linkClass}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
