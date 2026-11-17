"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CloseIcon, MenuIcon } from "../ui/icons";

export function MobileMenu({ items }: { items: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="grid h-9 w-9 place-items-center rounded-full text-ink-2 hover:bg-black/5 md:hidden"
      >
        {open ? <CloseIcon /> : <MenuIcon />}
      </button>
      {open && (
        <div className="fixed inset-x-0 top-12 bottom-0 z-40 bg-white/95 backdrop-blur-xl md:hidden">
          <nav className="mx-auto flex max-w-[1120px] flex-col px-8 pt-6">
            {[{ href: "/products", label: "All products" }, ...items].map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rise display border-b border-line-soft py-3.5 text-[28px]"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
