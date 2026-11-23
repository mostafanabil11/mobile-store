import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Gallery } from "@/components/store/gallery";
import { ProductCard } from "@/components/store/product-card";
import { ShareButton } from "@/components/store/share-button";
import {
  BatteryIcon,
  BoxIcon,
  ChevronRight,
  GlobeIcon,
  PinIcon,
  ShieldIcon,
  SparkleIcon,
  WhatsAppIcon,
} from "@/components/ui/icons";
import { getProduct, getRelated, getSettings } from "@/lib/api";
import { CATEGORY_LABELS, CONDITION_LABELS, batteryTone, cn, formatPrice, variantLine } from "@/lib/format";
import type { Product, StoreSettings } from "@/lib/types";
import { productMessage, whatsappLink } from "@/lib/whatsapp";

export async function generateMetadata(props: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProduct(slug).catch(() => null);
  if (!product) return { title: "Product not found" };
  const variant = variantLine(product);
  return {
    title: `${product.name}${variant ? ` — ${variant}` : ""}`,
    description: `${CONDITION_LABELS[product.condition]} ${product.name}${variant ? `, ${variant}` : ""}.`,
  };
}

export default function ProductPage(props: PageProps<"/products/[slug]">) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <ProductDetail params={props.params} />
    </Suspense>
  );
}

async function ProductDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([getProduct(slug), getSettings()]);
  if (!product) notFound();

  return (
    <>
      <div className="mx-auto max-w-[1120px] px-5 pt-6">
        <nav className="flex items-center gap-1 text-[13px] text-muted" aria-label="Breadcrumb">
          <Link href="/products" className="hover:text-ink">
            Shop
          </Link>
          <ChevronRight size={12} />
          <Link href={`/products?category=${product.category}`} className="hover:text-ink">
            {CATEGORY_LABELS[product.category]}
          </Link>
          <ChevronRight size={12} />
          <span className="truncate text-ink">{product.name}</span>
        </nav>
      </div>

      <section className="mx-auto grid max-w-[1120px] gap-10 px-5 pb-20 pt-8 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <div className="lg:sticky lg:top-20 lg:self-start">
          <Gallery product={product} />
        </div>
        <Info product={product} settings={settings} />
      </section>

      <Suspense fallback={null}>
        <Related slug={product.slug} settings={settings} />
      </Suspense>

      <MobileBuyBar product={product} settings={settings} />
    </>
  );
}

function Info({ product, settings }: { product: Product; settings: StoreSettings }) {
  const used = product.condition !== "new";
  const message = productMessage(product, settings);
  const savings =
    product.compareAtPrice && product.compareAtPrice > product.price ? product.compareAtPrice - product.price : 0;

  const facts = [
    product.storage && { icon: SparkleIcon, label: product.category === "watch" ? "Case size" : "Capacity", value: product.storage },
    product.warranty && { icon: ShieldIcon, label: "Warranty", value: product.warranty },
    product.region && { icon: GlobeIcon, label: "Version", value: product.region },
    product.inTheBox && { icon: BoxIcon, label: "In the box", value: product.inTheBox },
  ].filter(Boolean) as { icon: typeof ShieldIcon; label: string; value: string }[];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "rounded-full px-3 py-1 text-[12px] font-semibold",
            used ? "bg-bg-soft text-ink" : "bg-ink text-white",
          )}
        >
          {CONDITION_LABELS[product.condition]}
        </span>
        {product.status === "reserved" ? (
          <span className="rounded-full bg-[#fff4e0] px-3 py-1 text-[12px] font-semibold text-warn">Reserved</span>
        ) : (
          <span className="flex items-center gap-1.5 text-[12px] font-medium text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success" /> In store now
          </span>
        )}
      </div>

      <h1 className="display mt-4 text-[38px] sm:text-[48px]">{product.name}</h1>
      {variantLine(product) && (
        <p className="mt-2 flex items-center gap-2 text-lg text-muted">
          {product.colorHex && (
            <span
              className="inline-block h-4 w-4 rounded-full ring-1 ring-black/10"
              style={{ background: product.colorHex }}
            />
          )}
          {variantLine(product)}
        </p>
      )}

      <div className="mt-7 flex items-baseline gap-3">
        <span className="text-[30px] font-semibold tracking-tight">{formatPrice(product.price, settings.currency)}</span>
        {savings > 0 && (
          <>
            <span className="text-lg text-faint line-through">
              {formatPrice(product.compareAtPrice!, settings.currency)}
            </span>
            <span className="text-sm font-medium text-success">Save {formatPrice(savings, settings.currency)}</span>
          </>
        )}
      </div>

      {used && product.batteryHealth != null && <BatteryMeter value={product.batteryHealth} />}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <a
          href={whatsappLink(settings.whatsappNumber, message)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-[52px] shrink-0 items-center justify-center gap-2.5 rounded-full sm:flex-1 bg-ink px-6 text-[16px] font-medium text-white transition-colors hover:bg-black"
        >
          <WhatsAppIcon size={20} />
          {product.status === "reserved" ? "Ask about availability" : "Ask on WhatsApp"}
        </a>
        <ShareButton title={product.name} />
      </div>
      <p className="mt-3 text-[13px] text-muted">
        No online checkout — your WhatsApp message already includes this device&apos;s details.
      </p>

      <TrustRow product={product} />

      {facts.length > 0 && (
        <dl className="mt-10 divide-y divide-line-soft border-y border-line-soft">
          {facts.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-4 py-4">
              <Icon size={20} className="mt-0.5 shrink-0 text-muted" />
              <dt className="w-28 shrink-0 text-[14px] text-muted">{label}</dt>
              <dd className="text-[15px] font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {product.description && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold tracking-tight">Overview</h2>
          <p className="mt-2 whitespace-pre-line leading-relaxed text-ink-2">{product.description}</p>
        </div>
      )}

      {product.specs.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold tracking-tight">Tech specs</h2>
          <dl className="mt-3 overflow-hidden rounded-3xl bg-bg-soft">
            {product.specs.map((s, i) => (
              <div key={i} className="flex gap-4 px-5 py-3.5 text-[14px] odd:bg-bg-sunken/50">
                <dt className="w-32 shrink-0 text-muted">{s.label}</dt>
                <dd className="font-medium">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}

function BatteryMeter({ value }: { value: number }) {
  const label = value >= 90 ? "Excellent" : value >= 85 ? "Very good" : value >= 80 ? "Good" : "Fair";
  return (
    <div className="mt-7 rounded-3xl bg-bg-soft p-5">
      <div className="flex items-center justify-between text-[14px]">
        <span className="flex items-center gap-2 font-medium">
          <BatteryIcon size={20} className={batteryTone(value)} /> Battery health
        </span>
        <span>
          <span className={cn("text-[17px] font-semibold", batteryTone(value))}>{value}%</span>
          <span className="ml-2 text-muted">{label}</span>
        </span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-bg-sunken">
        <div
          className={cn("h-full rounded-full", value >= 90 ? "bg-success" : value >= 80 ? "bg-ink" : "bg-warn")}
          style={{ width: `${value}%` }}
        />
      </div>
      <p className="mt-3 text-[12px] text-muted">Maximum capacity relative to new, as reported by the device.</p>
    </div>
  );
}

async function Related({ slug, settings }: { slug: string; settings: StoreSettings }) {
  const items = await getRelated(slug);
  if (!items.length) return null;
  return (
    <section className="border-t border-line-soft">
      <div className="mx-auto max-w-[1120px] px-5 py-20">
        <h2 className="display mb-8 text-[32px]">You may also like.</h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} settings={settings} />
          ))}
        </div>
      </div>
    </section>
  );
}

function DetailSkeleton() {
  return (
    <div className="mx-auto grid max-w-[1120px] gap-10 px-5 pb-20 pt-14 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
      <div className="skeleton aspect-square rounded-[32px]" />
      <div className="space-y-4">
        <div className="skeleton h-6 w-24 rounded-full" />
        <div className="skeleton h-12 w-3/4 rounded-2xl" />
        <div className="skeleton h-5 w-1/2 rounded-full" />
        <div className="skeleton mt-6 h-9 w-32 rounded-xl" />
        <div className="skeleton mt-6 h-[52px] w-full rounded-full" />
      </div>
    </div>
  );
}

/** Small reassurance grid under the main button. */
function TrustRow({ product }: { product: Product }) {
  const items = [
    { icon: SparkleIcon, title: "Inspected & tested", body: "Checked before it was listed" },
    { icon: ShieldIcon, title: "Warranty", body: product.warranty || "Store warranty included" },
    { icon: WhatsAppIcon, title: "Reserve on WhatsApp", body: "We hold it for you" },
    { icon: PinIcon, title: "Try it in store", body: "See it before you pay" },
  ];
  return (
    <ul className="mt-8 grid grid-cols-2 gap-2">
      {items.map(({ icon: Icon, title, body }) => (
        <li key={title} className="flex gap-3 rounded-2xl bg-bg-soft p-3.5 sm:p-4">
          <Icon size={18} className="mt-0.5 shrink-0 text-ink-2" />
          <span className="min-w-0">
            <span className="block text-[13px] font-semibold">{title}</span>
            <span className="block truncate text-[12px] text-muted">{body}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Phones only: price + WhatsApp button pinned to the bottom of the screen. */
function MobileBuyBar({ product, settings }: { product: Product; settings: StoreSettings }) {
  if (!settings.whatsappNumber) return null;
  return (
    <div className="buy-bar fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white/90 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex max-w-[640px] items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] text-muted">{product.name}</p>
          <p className="text-[17px] font-semibold">{formatPrice(product.price, settings.currency)}</p>
        </div>
        <a
          href={whatsappLink(settings.whatsappNumber, productMessage(product, settings))}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-11 shrink-0 items-center gap-2 rounded-full bg-ink px-5 text-[15px] font-medium text-white"
        >
          <WhatsAppIcon size={17} /> Ask on WhatsApp
        </a>
      </div>
    </div>
  );
}
