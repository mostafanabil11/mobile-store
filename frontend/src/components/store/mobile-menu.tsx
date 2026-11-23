"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/format";
import { ChevronRight, PinIcon, SearchIcon } from "../ui/icons";

interface Item {
  href: string;
  label: string;
}

/** true in the browser, false during server render (no setState-in-effect needed). */
const useIsClient = () =>
  useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

/** Thumbnail for a nav item: its category render, or the iPhone render for "Pre-owned". */
function thumbFor(href: string) {
  const params = new URL(href, "http://x").searchParams;
  const category = params.get("category");
  if (category) return `/categories/${category}.webp`;
  if (params.get("condition")) return "/categories/iphone.webp";
  return null;
}

function isActive(href: string) {
  if (typeof window === "undefined" || window.location.pathname !== "/products") return false;
  const current = new URLSearchParams(window.location.search);
  const target = new URL(href, "http://x").searchParams;
  return [...target].every(([k, v]) => current.get(k) === v);
}

/**
 * Phone navigation. The panel is portalled to <body>: the header uses backdrop-filter,
 * which would otherwise trap a `position: fixed` child inside the 48px header.
 */
export function MobileMenu({ items }: { items: Item[] }) {
  const [open, setOpen] = useState(false);
  const [activeHref, setActiveHref] = useState<string | null>(null);
  const isClient = useIsClient();
  const panelId = useId();
  const firstLink = useRef<HTMLAnchorElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpen(false), []);

  function onToggle() {
    if (!open) setActiveHref(items.find((i) => isActive(i.href))?.href ?? null);
    setOpen((v) => !v);
  }

  // Lock page scroll, close on Escape / back button / growing to desktop width, and move focus.
  useEffect(() => {
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    // Wait a frame: the panel only becomes focusable once it's no longer `visibility: hidden`.
    const frame = requestAnimationFrame(() => firstLink.current?.focus({ preventScroll: true }));

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        toggle.current?.focus();
      }
    };
    const desktop = window.matchMedia("(min-width: 768px)");
    const onWide = () => desktop.matches && close();

    window.addEventListener("keydown", onKey);
    window.addEventListener("popstate", close);
    desktop.addEventListener("change", onWide);
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", close);
      desktop.removeEventListener("change", onWide);
    };
  }, [open, close]);

  const links = [{ href: "/products", label: "All products" }, ...items];

  const panel = (
    <div
      id={panelId}
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      aria-hidden={!open}
      inert={!open}
      className={cn(
        "fixed inset-x-0 bottom-0 top-12 z-30 flex flex-col bg-white transition-[opacity,visibility] duration-300 ease-apple md:hidden",
        open ? "visible opacity-100" : "invisible opacity-0",
      )}
    >
      <nav className="flex-1 overflow-y-auto overscroll-contain px-5 pb-6 pt-3">
        <ul>
          {links.map((item, i) => {
            const thumb = thumbFor(item.href);
            const active = item.href === activeHref;
            return (
              <li
                key={item.href}
                className={cn(
                  "transition-[opacity,transform] duration-500 ease-apple",
                  open ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0",
                )}
                style={{ transitionDelay: open ? `${60 + i * 35}ms` : "0ms" }}
              >
                <Link
                  ref={i === 0 ? firstLink : undefined}
                  href={item.href}
                  onClick={close}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group -mx-2 flex items-center gap-4 rounded-2xl px-2 py-2.5 outline-none transition-colors focus-visible:bg-bg-soft",
                    active ? "bg-bg-soft" : "active:bg-bg-soft",
                  )}
                >
                  <span className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-[14px] bg-bg-soft">
                    {thumb ? (
                      <Image src={thumb} alt="" fill unoptimized sizes="48px" className="object-contain p-1.5 mix-blend-multiply" />
                    ) : (
                      <SearchIcon size={18} className="text-ink-2" />
                    )}
                  </span>
                  <span className={cn("flex-1 text-[20px] tracking-tight", active ? "font-semibold" : "font-medium")}>
                    {item.label}
                  </span>
                  <ChevronRight size={16} className="text-faint transition-transform group-active:translate-x-0.5" />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div
        className={cn(
          "border-t border-line-soft px-5 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-4 transition-opacity duration-500",
          open ? "opacity-100 delay-300" : "opacity-0",
        )}
      >
        <Link
          href="/#visit"
          onClick={close}
          className="flex h-12 items-center justify-center gap-2 rounded-full bg-ink text-[15px] font-medium text-white"
        >
          <PinIcon size={17} /> Visit the store
        </Link>
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={toggle}
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="relative grid h-9 w-9 place-items-center rounded-full text-ink-2 transition-colors hover:bg-black/5 md:hidden"
      >
        {/* Two bars that rotate into an X. */}
        <span
          aria-hidden
          className={cn(
            "absolute h-[1.5px] w-[17px] rounded-full bg-current transition-transform duration-300 ease-apple",
            open ? "rotate-45" : "-translate-y-[4px]",
          )}
        />
        <span
          aria-hidden
          className={cn(
            "absolute h-[1.5px] w-[17px] rounded-full bg-current transition-transform duration-300 ease-apple",
            open ? "-rotate-45" : "translate-y-[4px]",
          )}
        />
      </button>
      {isClient && createPortal(panel, document.body)}
    </>
  );
}
