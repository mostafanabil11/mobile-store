import Link from "next/link";
import { CONDITION_LABELS, batteryTone, cn, formatPrice } from "@/lib/format";
import type { Product, StoreSettings } from "@/lib/types";
import { productMessage, whatsappLink } from "@/lib/whatsapp";
import { BatteryIcon, WhatsAppIcon } from "../ui/icons";
import { ProductMedia } from "./product-media";

interface Props {
  product: Product;
  settings: Pick<StoreSettings, "currency" | "whatsappNumber" | "whatsappGreeting">;
  eager?: boolean;
  className?: string;
}

/**
 * Product tile. The whole card links to the product (via a stretched link), while the
 * WhatsApp button sits above it so it can be tapped on its own.
 */
export function ProductCard({ product, settings, eager, className }: Props) {
  const used = product.condition !== "new";
  const hasSecond = product.images.length > 1;
  const href = `/products/${product.slug}`;

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[22px] bg-bg-soft transition-[transform,box-shadow] duration-500 ease-apple hover:-translate-y-1 hover:shadow-[0_24px_48px_-24px_rgba(0,0,0,0.22)] sm:rounded-[28px]",
        className,
      )}
    >
      <div className="relative aspect-square">
        <div className="absolute inset-5 bg-bg-soft transition-transform duration-700 ease-apple group-hover:scale-[1.04] sm:inset-8">
          <div className={cn("absolute inset-0 transition-opacity duration-500", hasSecond && "group-hover:opacity-0")}>
            <ProductMedia product={product} eager={eager} sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />
          </div>
          {hasSecond && (
            <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
              <ProductMedia product={product} index={1} sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />
            </div>
          )}
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

      <div className="flex flex-1 flex-col px-4 pb-4 sm:px-6 sm:pb-6">
        <h3 className="text-[15px] font-semibold leading-snug tracking-tight sm:text-[17px]">
          <Link href={href} className="after:absolute after:inset-0 after:content-['']">
            {product.name}
          </Link>
        </h3>
        <p className="mt-0.5 truncate text-[13px] text-muted sm:text-sm">{product.color || " "}</p>

        {(product.storage || (used && product.batteryHealth != null)) && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {product.storage && <Chip>{product.storage}</Chip>}
            {used && product.batteryHealth != null && (
              <Chip className={batteryTone(product.batteryHealth)}>
                <BatteryIcon size={14} />
                {product.batteryHealth}%
              </Chip>
            )}
          </div>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <div className="min-w-0">
            <p className="whitespace-nowrap text-[15px] font-semibold sm:text-[17px]">
              {formatPrice(product.price, settings.currency)}
            </p>
            {product.compareAtPrice && product.compareAtPrice > product.price ? (
              <p className="whitespace-nowrap text-[12px] text-faint line-through sm:text-[13px]">
                {formatPrice(product.compareAtPrice, settings.currency)}
              </p>
            ) : null}
          </div>
          {settings.whatsappNumber && (
            <a
              href={whatsappLink(settings.whatsappNumber, productMessage(product, settings))}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Ask about ${product.name} on WhatsApp`}
              title="Ask on WhatsApp"
              className="relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-ink ring-1 ring-line-soft transition-colors hover:bg-ink hover:text-white sm:h-10 sm:w-10"
            >
              <WhatsAppIcon size={17} />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

function Chip({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-ink-2 ring-1 ring-line-soft sm:text-[12px]",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-[22px] bg-bg-soft sm:rounded-[28px]", className)}>
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
