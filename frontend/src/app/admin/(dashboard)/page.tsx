"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, Card, CardHeader, Notice, PageHeader, StatusBadge } from "@/components/admin/ui";
import { ProductMedia } from "@/components/store/product-media";
import { adminApi } from "@/lib/admin-api";
import { CATEGORY_LABELS, formatPrice, variantLine } from "@/lib/format";
import { CATEGORIES, type Stats, type StoreSettings } from "@/lib/types";

export default function OverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([adminApi.stats(), adminApi.settings()])
      .then(([s, st]) => {
        setStats(s);
        setSettings(st);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  const currency = settings?.currency ?? "USD";
  const cards = [
    { label: "Listed in store", value: stats ? (stats.byStatus.available ?? 0) + (stats.byStatus.reserved ?? 0) : null },
    { label: "Available", value: stats?.byStatus.available ?? (stats ? 0 : null) },
    { label: "Reserved", value: stats?.byStatus.reserved ?? (stats ? 0 : null) },
    { label: "Sold", value: stats?.byStatus.sold ?? (stats ? 0 : null) },
  ];
  const maxCat = Math.max(1, ...Object.values(stats?.byCategory ?? {}).map(Number));

  return (
    <>
      <PageHeader
        title="Overview"
        description="A quick look at your inventory."
        action={
          <Link href="/admin/products/new">
            <Button>Add product</Button>
          </Link>
        }
      />

      {error && <Notice tone="error">{error}</Notice>}
      {settings && !settings.whatsappNumber && (
        <div className="mb-6">
          <Notice>
            Add your WhatsApp number in{" "}
            <Link href="/admin/settings" className="font-medium underline">
              Settings
            </Link>{" "}
            so customers can message you about products.
          </Notice>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {cards.map((c) => (
          <Card key={c.label} className="p-5">
            <p className="text-[13px] text-muted">{c.label}</p>
            <p className="mt-2 text-[28px] font-semibold tracking-tight">
              {c.value ?? <span className="skeleton inline-block h-7 w-10 rounded-lg" />}
            </p>
          </Card>
        ))}
        <Card className="col-span-2 bg-ink p-5 text-white ring-0 lg:col-span-1">
          <p className="text-[13px] text-white/60">Available stock value</p>
          <p className="mt-2 text-[24px] font-semibold tracking-tight">
            {stats ? formatPrice(stats.inventoryValue, currency) : "—"}
          </p>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <CardHeader title="By category" description="Listed products (available + reserved)" />
          <div className="space-y-4 p-6">
            {CATEGORIES.map((c) => {
              const n = stats?.byCategory[c] ?? 0;
              return (
                <div key={c}>
                  <div className="mb-1.5 flex justify-between text-[13px]">
                    <span className="font-medium">{CATEGORY_LABELS[c]}</span>
                    <span className="text-muted">{n}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-bg-soft">
                    <div className="h-full rounded-full bg-ink transition-[width] duration-700" style={{ width: `${(n / maxCat) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Recently updated"
            action={
              <Link href="/admin/products" className="text-[13px] font-medium text-accent">
                All products
              </Link>
            }
          />
          <ul className="divide-y divide-line-soft">
            {!stats &&
              Array.from({ length: 4 }, (_, i) => (
                <li key={i} className="flex items-center gap-4 px-6 py-3">
                  <div className="skeleton h-12 w-12 rounded-xl" />
                  <div className="skeleton h-4 w-40 rounded-full" />
                </li>
              ))}
            {stats?.recent.map((p) => (
              <li key={p.id}>
                <Link href={`/admin/products/${p.id}`} className="flex items-center gap-4 px-6 py-3 hover:bg-bg-soft">
                  <div className="relative h-12 w-12 shrink-0 rounded-xl bg-bg-soft">
                    <div className="absolute inset-1">
                      <ProductMedia product={p} sizes="48px" iconSize={16} />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium">{p.name}</p>
                    <p className="truncate text-[12px] text-muted">{variantLine(p)}</p>
                  </div>
                  <span className="hidden text-[14px] font-medium sm:block">{formatPrice(p.price, currency)}</span>
                  <StatusBadge status={p.status} />
                </Link>
              </li>
            ))}
            {stats && stats.recent.length === 0 && (
              <li className="px-6 py-10 text-center text-[14px] text-muted">No products yet.</li>
            )}
          </ul>
        </Card>
      </div>
    </>
  );
}
