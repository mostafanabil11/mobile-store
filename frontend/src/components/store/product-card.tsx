import Link from "next/link";
import { CONDITION_LABELS, batteryTone, cn, formatPrice, variantLine } from "@/lib/format";
import type { Product } from "@/lib/types";
import { BatteryIcon } from "../ui/icons";
import { ProductMedia } from "./product-media";

export function ProductCard({ product, currency }: { product: Product; currency: string }) {
  const used = product.condition !== "new";
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-[22px] bg-bg-soft transition-[transform,box-shadow] duration-500 sm:rounded-[28px] ease-apple hover:-translate-y-1 hover:shadow-[0_24px_48px_-24px_rgba(0,0,0,0.22)]"
    >
      <div className="relative aspect-square">
        <div className="absolute inset-5 bg-bg-soft transition-transform duration-700 sm:inset-8 ease-apple group-hover:scale-[1.04]">
          <ProductMedia product={product} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" />
        </div>
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5 sm:left-5 sm:top-5">
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide",
              product.condition === "new" ? "bg-ink text-white" : "bg-white text-ink ring-1 ring-line-soft",
            )}
          >
            {CONDITION_LABELS[product.condition]}
          </span>
          {product.status === "reserved" && (
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-warn ring-1 ring-line-soft">
              Reserved
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 px-4 pb-4 sm:px-6 sm:pb-6">
        <h3 className="text-[15px] font-semibold leading-snug tracking-tight sm:text-[17px]">{product.name}</h3>
        <p className="text-[13px] text-muted sm:text-sm">{variantLine(product) || " "}</p>
        <div className="mt-auto flex flex-wrap items-end justify-between gap-x-3 gap-y-1 pt-3 sm:pt-4">
          <div className="flex items-baseline gap-2">
            <span className="text-[15px] font-semibold sm:text-[17px]">{formatPrice(product.price, currency)}</span>
            {product.compareAtPrice && product.compareAtPrice > product.price ? (
              <span className="text-[13px] text-faint line-through sm:text-sm">{formatPrice(product.compareAtPrice, currency)}</span>
            ) : null}
          </div>
          {used && product.batteryHealth != null && (
            <span className={cn("flex items-center gap-1 text-xs font-medium", batteryTone(product.batteryHealth))}>
              <BatteryIcon size={16} />
              {product.batteryHealth}%
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[28px] bg-bg-soft">
      <div className="skeleton aspect-square" />
      <div className="space-y-2 px-6 pb-6">
        <div className="skeleton h-4 w-2/3 rounded-full bg-bg-sunken" />
        <div className="skeleton h-3 w-1/3 rounded-full bg-bg-sunken" />
        <div className="skeleton mt-5 h-4 w-1/4 rounded-full bg-bg-sunken" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
