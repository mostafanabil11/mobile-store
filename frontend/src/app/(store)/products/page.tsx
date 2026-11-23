import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { type FilterState, Filters } from "@/components/store/filters";
import { ProductCard, ProductGridSkeleton } from "@/components/store/product-card";
import { ChevronLeft, ChevronRight } from "@/components/ui/icons";
import { getFacets, getProducts, getSettings } from "@/lib/api";
import { CATEGORY_LABELS, CONDITION_LABELS, cn, formatPrice } from "@/lib/format";
import { CATEGORIES, type Category, type Condition } from "@/lib/types";

export const metadata: Metadata = { title: "Shop" };

const CATEGORY_INTRO: Record<Category, string> = {
  iphone: "New, open box and pre-owned iPhone. Every unit inspected, every detail on the page.",
  ipad: "iPad for drawing, studying, work and everything in between.",
  mac: "MacBook and Mac, ready to take home today.",
  watch: "Apple Watch for health, fitness and staying connected.",
  airpods: "AirPods and AirPods Max, sealed and open box.",
  accessories: "Chargers, cases, MagSafe and the extras that go with them.",
};

const CONDITION_INTRO: Record<Condition, string> = {
  new: "Sealed devices with full Apple warranty.",
  "open-box": "Opened, barely used, and priced below new.",
  used: "Checked, tested and honestly described — battery health included.",
};

type Search = Record<string, string | string[] | undefined>;
const pick = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

export default function ProductsPage(props: PageProps<"/products">) {
  return (
    <div className="mx-auto max-w-[1120px] px-5 pb-24 pt-12 sm:pt-16">
      <Suspense fallback={<CatalogSkeleton />}>
        <Catalog searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function Catalog({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const current: FilterState = {
    q: pick(sp.q),
    category: pick(sp.category),
    condition: pick(sp.condition),
    storage: pick(sp.storage),
    sort: pick(sp.sort),
  };
  const page = Math.max(1, Number(pick(sp.page)) || 1);

  const [settings, facets, data] = await Promise.all([
    getSettings(),
    getFacets().catch(() => null),
    getProducts({ ...current, page: String(page), limit: "24" }).catch(() => null),
  ]);

  const category = CATEGORIES.includes(current.category as Category) ? (current.category as Category) : undefined;
  const condition = current.condition as Condition | undefined;
  const title = category ? CATEGORY_LABELS[category] : condition ? CONDITION_LABELS[condition] ?? "Shop" : "Shop all";
  const intro = category
    ? CATEGORY_INTRO[category]
    : condition
      ? CONDITION_INTRO[condition]
      : "New, open box and pre-owned Apple devices — all in stock and ready to see in store.";
  const from = category ? facets?.categoryFrom?.[category] : facets?.price.min;

  return (
    <>
      <header className="mb-8 flex items-center justify-between gap-6 rounded-[28px] bg-bg-soft px-6 py-7 sm:px-10 sm:py-10">
        <div className="min-w-0">
          <h1 className="display text-[38px] sm:text-[52px]">{title}</h1>
          <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-muted sm:text-[17px]">{intro}</p>
          {data && data.total > 0 && (
            <p className="mt-3 text-[13px] font-medium text-ink-2">
              {data.total} {data.total === 1 ? "device" : "devices"} in store
              {from != null && <> · from {formatPrice(from, settings.currency)}</>}
            </p>
          )}
        </div>
        {category && (
          <div className="relative hidden h-32 w-32 shrink-0 sm:block lg:h-40 lg:w-40">
            <Image src={`/categories/${category}.webp`} alt="" fill unoptimized className="object-contain mix-blend-multiply" />
          </div>
        )}
      </header>
      <Filters current={current} facets={facets} total={data?.total ?? 0} />

      <div className="mt-8">
        {!data ? (
          <Empty title="We couldn't load products." body="Please refresh in a moment." />
        ) : data.items.length === 0 ? (
          <Empty title="Nothing matches — yet." body="Try a different filter, or message us and we'll source it for you." />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {data.items.map((p, i) => (
              <ProductCard key={p.id} product={p} settings={settings} eager={i < 4} />
            ))}
          </div>
        )}
      </div>

      {data && data.pages > 1 && <Pagination page={page} pages={data.pages} sp={sp} />}
    </>
  );
}

function Pagination({ page, pages, sp }: { page: number; pages: number; sp: Search }) {
  const href = (p: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) {
      const value = pick(v);
      if (value && k !== "page") params.set(k, value);
    }
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/products${qs ? `?${qs}` : ""}`;
  };
  const btn = "grid h-10 min-w-10 place-items-center rounded-full px-3 text-[14px] font-medium";
  return (
    <nav className="mt-14 flex items-center justify-center gap-1" aria-label="Pagination">
      <Link
        href={href(page - 1)}
        aria-disabled={page <= 1}
        className={cn(btn, page <= 1 ? "pointer-events-none text-line" : "hover:bg-bg-soft")}
      >
        <ChevronLeft size={16} />
      </Link>
      {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
        <Link key={p} href={href(p)} className={cn(btn, p === page ? "bg-ink text-white" : "hover:bg-bg-soft")}>
          {p}
        </Link>
      ))}
      <Link
        href={href(page + 1)}
        aria-disabled={page >= pages}
        className={cn(btn, page >= pages ? "pointer-events-none text-line" : "hover:bg-bg-soft")}
      >
        <ChevronRight size={16} />
      </Link>
    </nav>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[28px] bg-bg-soft px-6 py-20 text-center">
      <p className="text-xl font-semibold tracking-tight">{title}</p>
      <p className="mt-2 text-muted">{body}</p>
    </div>
  );
}

function CatalogSkeleton() {
  return (
    <>
      <div className="skeleton mb-8 h-40 rounded-[28px]" />
      <div className="mb-8 flex gap-2">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="skeleton h-9 w-20 rounded-full" />
        ))}
      </div>
      <ProductGridSkeleton />
    </>
  );
}
