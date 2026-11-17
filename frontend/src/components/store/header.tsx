import Link from "next/link";
import { Suspense } from "react";
import { getSettings } from "@/lib/api";
import { SearchIcon } from "../ui/icons";
import { MobileMenu } from "./mobile-menu";

export const NAV = [
  { href: "/products?category=iphone", label: "iPhone" },
  { href: "/products?category=ipad", label: "iPad" },
  { href: "/products?category=mac", label: "Mac" },
  { href: "/products?category=watch", label: "Watch" },
  { href: "/products?category=airpods", label: "AirPods" },
  { href: "/products?category=accessories", label: "Accessories" },
  { href: "/products?condition=used", label: "Pre-owned" },
];

async function Brand() {
  const { storeName } = await getSettings();
  return (
    <>
      <span className="grid h-6 w-6 place-items-center rounded-[7px] bg-ink text-[12px] font-semibold text-white">
        {storeName.charAt(0).toUpperCase()}
      </span>
      {storeName}
    </>
  );
}

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-[17px] font-semibold tracking-tight">
      <Suspense fallback={<span className="h-6 w-24 rounded-[7px] bg-bg-soft" />}>
        <Brand />
      </Suspense>
    </Link>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-black/[0.06] bg-white/72 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-12 max-w-[1120px] items-center justify-between px-5">
        <Logo />
        <nav className="hidden items-center gap-7 text-[13px] text-ink-2 md:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="transition-colors hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <Link
            href="/products"
            aria-label="Search products"
            className="grid h-9 w-9 place-items-center rounded-full text-ink-2 transition-colors hover:bg-black/5 hover:text-ink"
          >
            <SearchIcon />
          </Link>
          <MobileMenu items={NAV} />
        </div>
      </div>
    </header>
  );
}
