"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin-api";
import { cn } from "@/lib/format";
import type { AdminUser } from "@/lib/types";
import { CloseIcon, MenuIcon } from "../ui/icons";

const NAV = [
  {
    href: "/admin",
    label: "Overview",
    icon: <path d="M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z" />,
  },
  {
    href: "/admin/products",
    label: "Products",
    icon: (
      <>
        <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
        <path d="M10.5 5h3" />
      </>
    ),
  },
  {
    href: "/admin/products/new",
    label: "Add product",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v8M8 12h8" />
      </>
    ),
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
      </>
    ),
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  if (href === "/admin/products") return pathname.startsWith("/admin/products") && pathname !== "/admin/products/new";
  return pathname.startsWith(href);
}

/** Sidebar navigation. Rendered inside <Suspense> because it reads the pathname. */
export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [me, setMe] = useState<AdminUser | null>(null);

  useEffect(() => {
    adminApi.me().then(setMe).catch(() => {});
  }, []);

  async function logout() {
    await adminApi.logout().catch(() => {});
    router.replace("/admin/login");
    router.refresh();
  }

  const links = (
    <nav className="space-y-0.5">
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2 text-[14px] font-medium transition-colors",
            isActive(pathname, item.href) ? "bg-ink text-white" : "text-ink-2 hover:bg-black/5",
          )}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            {item.icon}
          </svg>
          {item.label}
        </Link>
      ))}
    </nav>
  );

  const footer = (
    <div className="space-y-1 border-t border-line-soft pt-4">
      <Link href="/" target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2 text-[14px] text-ink-2 hover:bg-black/5">
        View store ↗
      </Link>
      <div className="flex items-center justify-between gap-2 rounded-xl px-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium">{me?.name ?? " "}</p>
          <p className="truncate text-[12px] text-muted">{me?.email ?? " "}</p>
        </div>
        <button type="button" onClick={logout} className="shrink-0 text-[12px] font-medium text-muted hover:text-danger">
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line-soft bg-white/80 px-4 backdrop-blur-xl lg:hidden">
        <span className="text-[15px] font-semibold">Admin</span>
        <button type="button" aria-label="Menu" onClick={() => setOpen((v) => !v)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-black/5">
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>
      {open && (
        <div className="fixed inset-x-0 top-14 bottom-0 z-30 flex flex-col justify-between bg-white p-4 lg:hidden">
          {links}
          {footer}
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col justify-between border-r border-line-soft bg-white p-4 lg:flex">
        <div>
          <p className="mb-6 px-3 pt-2 text-[15px] font-semibold tracking-tight">Store admin</p>
          {links}
        </div>
        {footer}
      </aside>
    </>
  );
}

export function AdminNavFallback() {
  return <aside className="hidden h-screen w-60 shrink-0 border-r border-line-soft bg-white lg:block" />;
}
