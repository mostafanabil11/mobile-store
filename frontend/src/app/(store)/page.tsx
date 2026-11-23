import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ProductCard, ProductCardSkeleton, ProductGridSkeleton } from "@/components/store/product-card";
import { ProductMedia } from "@/components/store/product-media";
import { Rail } from "@/components/store/rail";
import { CheckIcon, ChevronRight, ClockIcon, PhoneIcon, PinIcon, WhatsAppIcon } from "@/components/ui/icons";
import { getFacets, getProducts, getSettings } from "@/lib/api";
import { CATEGORY_LABELS, cn, formatPrice, variantLine } from "@/lib/format";
import type { Category, Facets, StoreSettings } from "@/lib/types";
import { productMessage, whatsappLink } from "@/lib/whatsapp";

export default function HomePage() {
  return (
    <>
      <Hero />

      <section className="mx-auto max-w-[1120px] px-5 pt-20 sm:pt-28">
        <Heading eyebrow="Shop by category" title="Everything Apple. Nothing else." />
        <Suspense fallback={<CategoryGridSkeleton />}>
          <CategoryGrid />
        </Suspense>
      </section>

      <section className="mx-auto max-w-[1120px] px-5 pt-20 sm:pt-28">
        <Suspense fallback={<RailSkeleton />}>
          <FeaturedRail />
        </Suspense>
      </section>

      <Suspense fallback={<div className="mt-14 h-[640px] bg-night sm:mt-20" />}>
        <PreOwnedSpotlight />
      </Suspense>

      <section className="mx-auto max-w-[1120px] px-5 py-20 sm:py-28">
        <Heading
          eyebrow="Just arrived"
          title="New in store."
          link={{ href: "/products?sort=newest", label: "See everything" }}
        />
        <Suspense fallback={<ProductGridSkeleton count={4} />}>
          <NewArrivals />
        </Suspense>
      </section>

      <Suspense fallback={null}>
        <VisitStore />
      </Suspense>
    </>
  );
}

/* --------------------------------- Shared --------------------------------- */

function Heading({
  eyebrow,
  title,
  link,
  className,
}: {
  eyebrow: string;
  title: string;
  link?: { href: string; label: string };
  className?: string;
}) {
  return (
    <div className={cn("mb-8 flex flex-wrap items-end justify-between gap-4 sm:mb-10", className)}>
      <div>
        <p className="eyebrow mb-2 text-muted">{eyebrow}</p>
        <h2 className="display text-[32px] sm:text-[44px]">{title}</h2>
      </div>
      {link && <MoreLink {...link} />}
    </div>
  );
}

function MoreLink({ href, label, className }: { href: string; label: string; className?: string }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-1 text-[15px] font-medium text-accent", className)}>
      {label}
      <ChevronRight size={15} className="transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

/* ---------------------------------- Hero ---------------------------------- */

/** Default banner: Unsplash photo by Igor Omilaev (Unsplash License); its backdrop is #dddddd. */
const DEFAULT_HERO = "/hero.jpg";

function Hero() {
  return (
    <section className="overflow-hidden bg-[#dddddd]">
      <div className="mx-auto max-w-[1120px] px-5 pt-12 text-center sm:pt-20">
        <p className="eyebrow rise mb-4 text-ink-2/70">New · Open box · Pre-owned</p>
        <Suspense
          fallback={
            <div className="space-y-4">
              <div className="mx-auto h-12 w-3/4 rounded-2xl bg-black/5 sm:h-16" />
              <div className="mx-auto h-12 w-1/2 rounded-2xl bg-black/5 sm:h-16" />
            </div>
          }
        >
          <HeroCopy />
        </Suspense>
        <div className="rise rise-2 mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/products?category=iphone"
            className="rounded-full bg-ink px-6 py-3 text-[15px] font-medium text-white transition-colors hover:bg-black"
          >
            Shop iPhone
          </Link>
          <Link
            href="/products?condition=used"
            className="rounded-full bg-white/70 px-6 py-3 text-[15px] font-medium text-ink backdrop-blur transition-colors hover:bg-white"
          >
            Pre-owned deals
          </Link>
        </div>
        <Suspense fallback={<div className="mt-6 h-5" />}>
          <HeroPrices />
        </Suspense>
      </div>

      <Suspense fallback={<div className="mx-auto aspect-[4/3] max-w-[1440px] sm:aspect-[2/1]" />}>
        <HeroImage />
      </Suspense>
    </section>
  );
}

async function HeroCopy() {
  const s = await getSettings();
  return (
    <>
      <h1 className="display whitespace-pre-line text-[40px] sm:text-[64px] lg:text-[76px]">{s.heroTitle}</h1>
      <p className="mx-auto mt-4 max-w-xl text-[17px] leading-relaxed text-ink-2 sm:text-xl">{s.heroSubtitle}</p>
    </>
  );
}

/** "New iPhone from … · Pre-owned from …", straight from the live inventory. */
async function HeroPrices() {
  const [s, fresh, used] = await Promise.all([
    getSettings(),
    getProducts({ category: "iphone", condition: "new", sort: "price-asc", limit: "1" }).catch(() => null),
    getProducts({ category: "iphone", condition: "used", sort: "price-asc", limit: "1" }).catch(() => null),
  ]);
  const items = [
    fresh?.items[0] && { label: "New iPhone from", price: fresh.items[0].price, href: "/products?category=iphone&condition=new" },
    used?.items[0] && { label: "Pre-owned from", price: used.items[0].price, href: "/products?category=iphone&condition=used" },
  ].filter(Boolean) as { label: string; price: number; href: string }[];
  if (!items.length) return <div className="mt-6 h-5" />;
  return (
    <p className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[14px] text-ink-2">
      {items.map((i, n) => (
        <span key={i.label} className="flex items-center gap-4">
          {n > 0 && <span className="hidden h-3 w-px bg-ink/20 sm:block" />}
          <Link href={i.href} className="hover:text-ink">
            {i.label} <span className="font-semibold text-ink">{formatPrice(i.price, s.currency)}</span>
          </Link>
        </span>
      ))}
    </p>
  );
}

async function HeroImage() {
  const s = await getSettings();
  return (
    <div className="relative mx-auto -mt-2 aspect-[4/3] max-w-[1440px] sm:aspect-[2/1]">
      <Image
        src={s.heroImage || DEFAULT_HERO}
        alt=""
        fill
        loading="eager"
        fetchPriority="high"
        unoptimized={!!s.heroImage}
        sizes="(max-width: 1440px) 100vw, 1440px"
        className="object-cover"
      />
    </div>
  );
}

/* ------------------------------ Category grid ------------------------------ */

const CATEGORY_COPY: Record<Category, string> = {
  iphone: "New, open box and pre-owned — every unit inspected.",
  ipad: "For drawing, studying and everything in between.",
  mac: "Laptops that last.",
  watch: "Health, fitness, notifications.",
  airpods: "Sound, without the wires.",
  accessories: "Chargers, cases and MagSafe.",
};

async function CategoryGrid() {
  const [s, facets] = await Promise.all([getSettings(), getFacets().catch(() => null)]);
  const small: Category[] = ["ipad", "mac", "watch", "airpods"];
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:grid-rows-[repeat(2,minmax(0,250px))]">
      <CategoryTile category="iphone" facets={facets} currency={s.currency} big />
      {small.map((c) => (
        <CategoryTile key={c} category={c} facets={facets} currency={s.currency} />
      ))}
      <CategoryTile category="accessories" facets={facets} currency={s.currency} wide />
    </div>
  );
}

function CategoryTile({
  category,
  facets,
  currency,
  big,
  wide,
}: {
  category: Category;
  facets: Facets | null;
  currency: string;
  big?: boolean;
  wide?: boolean;
}) {
  const count = facets?.categories[category] ?? 0;
  const from = facets?.categoryFrom?.[category];
  const meta = count ? (from != null ? `From ${formatPrice(from, currency)}` : `${count} available`) : "Coming soon";

  return (
    <Link
      href={`/products?category=${category}`}
      className={cn(
        "group relative flex overflow-hidden rounded-[24px] bg-bg-soft transition-[transform,box-shadow] duration-500 ease-apple hover:-translate-y-1 hover:shadow-[0_24px_48px_-24px_rgba(0,0,0,0.2)] sm:rounded-[28px]",
        big && "col-span-2 min-h-[460px] flex-col p-6 sm:min-h-[420px] sm:p-8 lg:row-span-2 lg:min-h-0",
        wide && "col-span-2 min-h-[150px] items-center p-6 sm:p-8 lg:col-span-4",
        !big && !wide && "min-h-[210px] flex-col p-5 sm:p-6",
      )}
    >
      <div className={cn("relative z-10", wide && "max-w-[60%]")}>
        <h3 className={cn("font-semibold tracking-tight", big ? "display text-[34px] sm:text-[44px]" : "text-[19px] sm:text-[21px]")}>
          {CATEGORY_LABELS[category]}
        </h3>
        <p className={cn("mt-1 text-muted", big ? "text-[15px] sm:text-[17px]" : "text-[13px]")}>
          {big || wide ? CATEGORY_COPY[category] : meta}
        </p>
        {(big || wide) && <p className="mt-3 text-[14px] font-semibold">{meta}</p>}
        {big && (
          <span className="mt-5 inline-flex items-center gap-1 text-[15px] font-medium text-accent">
            Shop iPhone <ChevronRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        )}
      </div>
      <div
        className={cn(
          "pointer-events-none absolute bg-bg-soft transition-transform duration-700 ease-apple group-hover:scale-[1.05]",
          big && "inset-x-6 bottom-0 top-[50%] sm:inset-x-10 sm:top-[42%]",
          wide && "bottom-2 right-4 top-2 w-[38%] sm:right-10 sm:w-[30%]",
          !big && !wide && "inset-x-[10%] bottom-3 h-[58%]",
        )}
      >
        {/* Demo renders from DummyJSON; replace files in public/categories with your own. */}
        <Image
          src={`/categories/${category}.webp`}
          alt=""
          fill
          unoptimized
          className={cn("object-contain mix-blend-multiply", big ? "object-bottom" : "object-center")}
        />
      </div>
    </Link>
  );
}

function CategoryGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:grid-rows-[repeat(2,250px)]">
      <div className="skeleton col-span-2 min-h-[460px] rounded-[28px] sm:min-h-[420px] lg:row-span-2 lg:min-h-0" />
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="skeleton min-h-[210px] rounded-[28px]" />
      ))}
    </div>
  );
}

/* -------------------------------- Featured -------------------------------- */

const railCard = "w-[72%] shrink-0 snap-start sm:w-[300px]";

async function FeaturedRail() {
  const [s, data] = await Promise.all([getSettings(), getProducts({ featured: "true", limit: "12" }).catch(() => null)]);
  if (!data?.items.length) return null;
  return (
    <Rail
      label="Featured products"
      heading={
        <div>
          <p className="eyebrow mb-2 text-muted">Featured</p>
          <h2 className="display text-[32px] sm:text-[44px]">The lineup, hand-picked.</h2>
          <MoreLink href="/products" label="Shop all" className="mt-3" />
        </div>
      }
    >
      {data.items.map((p) => (
        <ProductCard key={p.id} product={p} settings={s} className={railCard} />
      ))}
    </Rail>
  );
}

function RailSkeleton() {
  return (
    <>
      <div className="skeleton mb-10 h-20 w-80 rounded-2xl" />
      <div className="flex gap-5 overflow-hidden">
        {Array.from({ length: 4 }, (_, i) => (
          <ProductCardSkeleton key={i} className={railCard} />
        ))}
      </div>
    </>
  );
}

/* --------------------------- Pre-owned spotlight --------------------------- */

const PROMISES = [
  "Exact battery health on every listing",
  "Face ID, cameras, display and ports tested",
  "Store warranty on every pre-owned device",
  "See it, hold it, then decide",
];

async function PreOwnedSpotlight() {
  const [s, data] = await Promise.all([
    getSettings(),
    getProducts({ condition: "used", featured: "true", limit: "8" }).catch(() => null),
  ]);
  const fallback = data?.items.length ? null : await getProducts({ condition: "used", limit: "8" }).catch(() => null);
  const pick = (data?.items.length ? data : fallback)?.items.find((p) => p.images.length && p.batteryHealth != null);

  return (
    <section className="mt-14 bg-night text-white sm:mt-20">
      <div className="mx-auto grid max-w-[1120px] items-center gap-12 px-5 py-20 sm:py-28 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
        <div>
          <p className="eyebrow mb-3 text-white/50">Pre-owned</p>
          <h2 className="display text-[36px] sm:text-[52px]">Pre-owned, without the guesswork.</h2>
          <p className="mt-4 max-w-md text-[17px] leading-relaxed text-white/60">
            Every used device is checked before it&apos;s listed, and everything we find is written on the page.
          </p>
          <ul className="mt-8 space-y-3">
            {PROMISES.map((t) => (
              <li key={t} className="flex items-center gap-3 text-[15px] text-white/85">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/10">
                  <CheckIcon size={14} />
                </span>
                {t}
              </li>
            ))}
          </ul>
          <Link
            href="/products?condition=used"
            className="mt-10 inline-flex items-center gap-1 rounded-full bg-white px-6 py-3 text-[15px] font-medium text-ink transition-colors hover:bg-white/90"
          >
            Shop pre-owned
          </Link>
        </div>

        {pick && (
          <div className="rounded-[32px] bg-night-2 p-4 ring-1 ring-white/10 sm:p-5">
            <Link href={`/products/${pick.slug}`} className="group block">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[24px] bg-bg-soft">
                <div className="absolute inset-6 bg-bg-soft transition-transform duration-700 ease-apple group-hover:scale-[1.03] sm:inset-10">
                  <ProductMedia product={pick} sizes="(max-width: 1024px) 100vw, 560px" />
                </div>
                <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-ink">
                  Inspected
                </span>
              </div>
            </Link>
            <div className="px-2 pb-2 pt-5 sm:px-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-[20px] font-semibold tracking-tight">{pick.name}</h3>
                <p className="text-[18px] font-semibold">{formatPrice(pick.price, s.currency)}</p>
              </div>
              <p className="mt-0.5 text-[14px] text-white/50">{variantLine(pick)}</p>
              <div className="mt-5">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-white/60">Battery health</span>
                  <span className={cn("font-semibold", pick.batteryHealth! >= 90 ? "text-[#4cd27e]" : "text-white")}>
                    {pick.batteryHealth}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-white" style={{ width: `${pick.batteryHealth}%` }} />
                </div>
              </div>
              <div className="mt-6 flex gap-2">
                <Link
                  href={`/products/${pick.slug}`}
                  className="flex h-11 flex-1 items-center justify-center rounded-full bg-white/10 text-[14px] font-medium transition-colors hover:bg-white/15"
                >
                  View details
                </Link>
                {s.whatsappNumber && (
                  <a
                    href={whatsappLink(s.whatsappNumber, productMessage(pick, s))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-white text-[14px] font-medium text-ink transition-colors hover:bg-white/90"
                  >
                    <WhatsAppIcon size={16} /> Ask about it
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ------------------------------ New arrivals ------------------------------ */

async function NewArrivals() {
  const [s, data] = await Promise.all([getSettings(), getProducts({ sort: "newest", limit: "4" }).catch(() => null)]);
  if (!data?.items.length) {
    return <p className="rounded-3xl bg-bg-soft p-10 text-center text-muted">New arrivals are on their way.</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
      {data.items.map((p) => (
        <ProductCard key={p.id} product={p} settings={s} />
      ))}
    </div>
  );
}

/* ------------------------------- Visit store ------------------------------- */

async function VisitStore() {
  const s = await getSettings();
  const hasPlace = !!s.address;
  return (
    <section id="visit" className="scroll-mt-12 bg-bg-soft">
      <div className={cn("mx-auto grid max-w-[1120px] gap-10 px-5 py-20 sm:py-28", hasPlace && "lg:grid-cols-2 lg:items-center")}>
        <div className={cn(!hasPlace && "text-center")}>
          <p className="eyebrow mb-3 text-muted">{hasPlace ? "Visit us" : "Talk to us"}</p>
          <h2 className="display text-[36px] sm:text-[48px]">{hasPlace ? "Come see it in person." : "Questions? Just ask."}</h2>
          <p className={cn("mt-4 max-w-md text-[17px] leading-relaxed text-muted", !hasPlace && "mx-auto")}>
            {hasPlace
              ? "Try any device before you buy, check its condition yourself, and leave with it the same day."
              : "Message us about any product on WhatsApp. We usually reply within minutes."}
          </p>

          {hasPlace && <StoreDetails s={s} />}

          <div className={cn("mt-8 flex flex-wrap gap-3", !hasPlace && "justify-center")}>
            {hasPlace && s.mapUrl && (
              <a
                href={s.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-ink px-6 py-3 text-[15px] font-medium text-white transition-colors hover:bg-black"
              >
                Get directions
              </a>
            )}
            {s.whatsappNumber && (
              <a
                href={whatsappLink(s.whatsappNumber, `Hello ${s.storeName}! I have a question.`)}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-6 py-3 text-[15px] font-medium transition-colors",
                  hasPlace && s.mapUrl ? "bg-white text-ink ring-1 ring-line hover:bg-bg-sunken/50" : "bg-ink text-white hover:bg-black",
                )}
              >
                <WhatsAppIcon size={17} /> Chat on WhatsApp
              </a>
            )}
          </div>
        </div>

        {hasPlace && (
          <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] bg-bg-sunken ring-1 ring-black/5">
            <iframe
              title={`Map showing ${s.storeName}`}
              src={`https://maps.google.com/maps?q=${encodeURIComponent(s.address)}&z=15&output=embed`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0 h-full w-full grayscale-[85%] contrast-[1.05]"
            />
          </div>
        )}
      </div>
    </section>
  );
}

function StoreDetails({ s }: { s: StoreSettings }) {
  const rows = [
    s.address && { icon: PinIcon, text: s.address },
    s.workingHours && { icon: ClockIcon, text: s.workingHours },
    s.phone && { icon: PhoneIcon, text: s.phone, href: `tel:${s.phone.replace(/\s/g, "")}` },
  ].filter(Boolean) as { icon: typeof PinIcon; text: string; href?: string }[];
  return (
    <dl className="mt-8 divide-y divide-line-soft border-y border-line-soft">
      {rows.map(({ icon: Icon, text, href }) => (
        <div key={text} className="flex items-center gap-3 py-3.5 text-[15px]">
          <Icon size={18} className="shrink-0 text-muted" />
          {href ? (
            <a href={href} className="hover:text-accent">
              {text}
            </a>
          ) : (
            <span>{text}</span>
          )}
        </div>
      ))}
    </dl>
  );
}
