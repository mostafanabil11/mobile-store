"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button, Card, Input, Notice, PageHeader, Select } from "@/components/admin/ui";
import { ProductMedia } from "@/components/store/product-media";
import { SearchIcon } from "@/components/ui/icons";
import { adminApi } from "@/lib/admin-api";
import { CATEGORY_LABELS, CONDITION_LABELS, STATUS_LABELS, cn, formatPrice, variantLine } from "@/lib/format";
import { CATEGORIES, STATUSES, type Paginated, type Product, type Status } from "@/lib/types";

const STATUS_SELECT: Record<Status, string> = {
  available: "text-success",
  reserved: "text-warn",
  sold: "text-muted",
  hidden: "text-faint",
};

export default function AdminProductsPage() {
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<Product> | null>(null);
  const [currency, setCurrency] = useState("EGP");
  const [error, setError] = useState<string | null>(null);
  const [filling, setFilling] = useState(false);
  const [fillResult, setFillResult] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(q.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(() => {
    adminApi
      .products({ q: search, status, category, page: String(page), limit: "20" })
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [search, status, category, page]);

  useEffect(load, [load]);
  useEffect(() => {
    adminApi.settings().then((s) => setCurrency(s.currency)).catch(() => {});
  }, []);

  async function changeStatus(p: Product, next: Status) {
    setData((d) => d && { ...d, items: d.items.map((x) => (x.id === p.id ? { ...x, status: next } : x)) });
    try {
      await adminApi.setStatus(p.id, next);
    } catch (e) {
      setError((e as Error).message);
      load();
    }
  }

  async function fillPhotos() {
    setFilling(true);
    setFillResult(null);
    setError(null);
    try {
      const { updated, skipped } = await adminApi.fillMissingPhotos();
      setFillResult(
        updated.length
          ? `Added catalog photos to ${updated.length} ${updated.length === 1 ? "product" : "products"}.` +
              (skipped.length ? ` No catalog match for: ${skipped.join(", ")}.` : "")
          : skipped.length
            ? `No catalog match for: ${skipped.join(", ")}.`
            : "Every product already has photos.",
      );
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setFilling(false);
    }
  }

  async function remove(p: Product) {
    if (!confirm(`Delete “${p.name}”? This can't be undone.`)) return;
    try {
      await adminApi.deleteProduct(p.id);
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <>
      <PageHeader
        title="Products"
        description={data ? `${data.total} ${data.total === 1 ? "product" : "products"}` : "Loading…"}
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              loading={filling}
              onClick={fillPhotos}
              title="Download catalog photos for products that have none"
            >
              Fill missing photos
            </Button>
            <Link href="/admin/products/new">
              <Button>Add product</Button>
            </Link>
          </div>
        }
      />

      {fillResult && (
        <div className="mb-4">
          <Notice tone="success">{fillResult}</Notice>
        </div>
      )}

      {error && (
        <div className="mb-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}

      <Card>
        <div className="flex flex-col gap-3 border-b border-line-soft p-4 sm:flex-row">
          <label className="relative flex-1">
            <SearchIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, colour, storage…" className="pl-9" />
          </label>
          <Select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="sm:w-44"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </Select>
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="sm:w-40"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-[14px]">
            <thead className="text-[12px] text-muted">
              <tr className="border-b border-line-soft">
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Condition</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Updated</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {!data &&
                Array.from({ length: 6 }, (_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3" colSpan={6}>
                      <div className="skeleton h-10 rounded-xl" />
                    </td>
                  </tr>
                ))}
              {data?.items.map((p) => (
                <tr key={p.id} className="hover:bg-bg-soft/60">
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${p.id}`} className="flex min-w-[260px] items-center gap-3">
                      <div className="relative h-11 w-11 shrink-0 rounded-xl bg-bg-soft">
                        <div className="absolute inset-1">
                          <ProductMedia product={p} sizes="44px" iconSize={16} />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 font-medium">
                          {p.name}
                          {p.featured && <span className="text-[11px] text-warn" title="Featured">★</span>}
                        </p>
                        <p className="text-[12px] text-muted">
                          {[CATEGORY_LABELS[p.category], variantLine(p)].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {CONDITION_LABELS[p.condition]}
                    {p.condition !== "new" && p.batteryHealth != null && (
                      <span className="ml-1 text-[12px] text-muted">· {p.batteryHealth}%</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{formatPrice(p.price, currency)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={p.status}
                      onChange={(e) => changeStatus(p, e.target.value as Status)}
                      aria-label="Status"
                      className={cn(
                        "rounded-full bg-bg-soft px-3 py-1.5 text-[13px] font-medium outline-none focus:ring-2 focus:ring-accent/40",
                        STATUS_SELECT[p.status],
                      )}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-muted">
                    {new Date(p.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Link href={`/admin/products/${p.id}`}>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm" className="text-danger" onClick={() => remove(p)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {data && data.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-muted">
                    No products match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {data && data.pages > 1 && (
          <div className="flex items-center justify-between border-t border-line-soft px-4 py-3 text-[13px] text-muted">
            <span>
              Page {data.page} of {data.pages}
            </span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button variant="secondary" size="sm" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
