import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { type FilterState, Filters } from "@/components/store/filters";
import { ProductCard, ProductGridSkeleton } from "@/components/store/product-card";
import { ChevronLeft, ChevronRight } from "@/components/ui/icons";
import { getFacets, getProducts, getSettings } from "@/lib/api";
import { CATEGORY_LABELS, CONDITION_LABELS, cn } from "@/lib/format";
import type { Category, Condition } from "@/lib/types";

export const metadata: Metadata = { title: "Shop" };

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

  const title = current.category
    ? CATEGORY_LABELS[current.category as Category] ?? "Shop"
    : current.condition
      ? CONDITION_LABELS[current.condition as Condition] ?? "Shop"
      : "Shop all";

  return (
    <>
      <h1 className="display rise mb-8 text-[44px] sm:text-[56px]">{title}</h1>
      <Filters current={current} facets={facets} total={data?.total ?? 0} />

      <div className="mt-8">
        {!data ? (
          <Empty title="We couldn't load products." body="Please refresh in a moment." />
        ) : data.items.length === 0 ? (
          <Empty title="Nothing matches — yet." body="Try a different filter, or message us and we'll source it for you." />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {data.items.map((p) => (
              <ProductCard key={p.id} product={p} currency={settings.currency} />
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
      <div className="skeleton mb-8 h-14 w-48 rounded-2xl" />
      <div className="mb-8 flex gap-2">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="skeleton h-9 w-20 rounded-full" />
        ))}
      </div>
      <ProductGridSkeleton />
    </>
  );
}
