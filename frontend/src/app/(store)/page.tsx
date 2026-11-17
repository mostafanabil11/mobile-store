import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ProductCard, ProductGridSkeleton } from "@/components/store/product-card";
import { BatteryIcon, ChevronRight, ShieldIcon, SparkleIcon, WhatsAppIcon } from "@/components/ui/icons";
import { getProducts, getSettings } from "@/lib/api";
import { CATEGORY_LABELS } from "@/lib/format";
import { CATEGORIES } from "@/lib/types";
import { whatsappLink } from "@/lib/whatsapp";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Categories />

      <Section
        eyebrow="Featured"
        title="The lineup, hand-picked."
        link={{ href: "/products", label: "Shop all" }}
      >
        <Suspense fallback={<ProductGridSkeleton count={4} />}>
          <ProductRow query={{ featured: "true", limit: "8" }} />
        </Suspense>
      </Section>

      <PreOwnedPromise />

      <Section
        eyebrow="Just arrived"
        title="Latest in store."
        link={{ href: "/products?sort=newest", label: "See everything" }}
      >
        <Suspense fallback={<ProductGridSkeleton count={8} />}>
          <ProductRow query={{ sort: "newest", limit: "8" }} />
        </Suspense>
      </Section>

      <Suspense fallback={null}>
        <ContactBand />
      </Suspense>
    </>
  );
}

/* ---------------------------------- Hero ---------------------------------- */

async function HeroCopy() {
  const s = await getSettings();
  return (
    <>
      <h1 className="display rise whitespace-pre-line text-[44px] sm:text-[64px] lg:text-[80px]">{s.heroTitle}</h1>
      <p className="rise rise-1 mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
        {s.heroSubtitle}
      </p>
    </>
  );
}

/** Default banner: Unsplash photo by Igor Omilaev (Unsplash License), backdrop extended to 16:9. */
const DEFAULT_HERO = "/hero.jpg";

async function HeroImage() {
  const s = await getSettings();
  return (
    <div className="rise rise-3 relative mx-auto mt-14 aspect-[16/9] max-w-[1040px] overflow-hidden rounded-[32px] bg-[#dddddd] sm:rounded-[40px]">
      <Image
        src={s.heroImage || DEFAULT_HERO}
        alt=""
        fill
        priority
        unoptimized={!!s.heroImage}
        sizes="(max-width: 1080px) 100vw, 1040px"
        className="object-cover"
      />
    </div>
  );
}

function Hero() {
  return (
    <section className="overflow-hidden bg-bg">
      <div className="mx-auto max-w-[1120px] px-5 pt-16 text-center sm:pt-24">
        <p className="eyebrow rise mb-5 text-muted">New · Open box · Pre-owned</p>
        <Suspense
          fallback={
            <div className="space-y-4">
              <div className="skeleton mx-auto h-14 w-3/4 rounded-2xl" />
              <div className="skeleton mx-auto h-14 w-1/2 rounded-2xl" />
            </div>
          }
        >
          <HeroCopy />
        </Suspense>
        <div className="rise rise-2 mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
          <Link
            href="/products?category=iphone"
            className="rounded-full bg-ink px-6 py-3 text-[15px] font-medium text-white transition-colors hover:bg-black"
          >
            Shop iPhone
          </Link>
          <Link href="/products" className="group flex items-center gap-1 text-[15px] font-medium text-accent">
            Browse everything
            <ChevronRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <Suspense fallback={<div className="skeleton mx-auto mt-14 aspect-[16/9] max-w-[1040px] rounded-[32px] sm:rounded-[40px]" />}>
          <HeroImage />
        </Suspense>
      </div>
    </section>
  );
}

/* ------------------------------- Categories ------------------------------- */

function Categories() {
  return (
    <section className="border-b border-line-soft">
      <div className="no-scrollbar mx-auto flex max-w-[1120px] gap-2 overflow-x-auto px-5 py-10 sm:justify-center sm:gap-6">
        {CATEGORIES.map((category) => (
          <Link
            key={category}
            href={`/products?category=${category}`}
            className="group flex w-24 shrink-0 flex-col items-center gap-2 text-center sm:w-28"
          >
            <span className="relative h-20 w-20 overflow-hidden rounded-[22px] bg-bg-soft transition-transform duration-500 ease-apple group-hover:-translate-y-1 sm:h-24 sm:w-24">
              {/* Demo renders from DummyJSON; replace files in public/categories with your own. */}
              <Image
                src={`/categories/${category}.webp`}
                alt=""
                fill
                unoptimized
                className="object-contain p-2 mix-blend-multiply"
              />
            </span>
            <span className="text-[13px] font-medium text-ink-2 group-hover:text-ink">{CATEGORY_LABELS[category]}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------- Sections -------------------------------- */

function Section({
  eyebrow,
  title,
  link,
  children,
}: {
  eyebrow: string;
  title: string;
  link?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-[1120px] px-5 py-20">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2 text-muted">{eyebrow}</p>
          <h2 className="display text-[32px] sm:text-[44px]">{title}</h2>
        </div>
        {link && (
          <Link href={link.href} className="group flex items-center gap-1 text-[15px] font-medium text-accent">
            {link.label}
            <ChevronRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

async function ProductRow({ query }: { query: Record<string, string> }) {
  const [settings, data] = await Promise.all([getSettings(), getProducts(query).catch(() => null)]);
  if (!data) {
    return <p className="rounded-3xl bg-bg-soft p-10 text-center text-muted">Products are unavailable right now.</p>;
  }
  if (!data.items.length) {
    return <p className="rounded-3xl bg-bg-soft p-10 text-center text-muted">New arrivals are on their way.</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
      {data.items.map((p) => (
        <ProductCard key={p.id} product={p} currency={settings.currency} />
      ))}
    </div>
  );
}

function PreOwnedPromise() {
  const pillars = [
    {
      icon: BatteryIcon,
      title: "Battery health, disclosed.",
      body: "Every pre-owned device lists its exact battery health — no rounding, no surprises.",
    },
    {
      icon: SparkleIcon,
      title: "Inspected end to end.",
      body: "Face ID, cameras, speakers, display and ports are tested before a device is listed.",
    },
    {
      icon: ShieldIcon,
      title: "Covered after you leave.",
      body: "New devices carry Apple's warranty. Pre-owned ones come with our own store warranty.",
    },
  ];
  return (
    <section className="bg-night text-white">
      <div className="mx-auto max-w-[1120px] px-5 py-24">
        <p className="eyebrow mb-3 text-white/50">Pre-owned</p>
        <h2 className="display max-w-2xl text-[36px] sm:text-[56px]">Pre-owned, without the guesswork.</h2>
        <div className="mt-14 grid gap-px overflow-hidden rounded-[28px] bg-white/10 md:grid-cols-3">
          {pillars.map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-night-2 p-8 sm:p-10">
              <Icon size={28} className="text-white/80" />
              <h3 className="mt-6 text-xl font-semibold tracking-tight">{title}</h3>
              <p className="mt-2 leading-relaxed text-white/60">{body}</p>
            </div>
          ))}
        </div>
        <Link
          href="/products?condition=used"
          className="mt-10 inline-flex items-center gap-1 text-[15px] font-medium text-[#2997ff]"
        >
          Shop pre-owned <ChevronRight size={15} />
        </Link>
      </div>
    </section>
  );
}

async function ContactBand() {
  const s = await getSettings();
  return (
    <section className="mx-auto max-w-[1120px] px-5 pb-24">
      <div className="flex flex-col items-center rounded-[36px] bg-bg-soft px-6 py-16 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-ink text-white">
          <WhatsAppIcon size={26} />
        </span>
        <h2 className="display mt-6 text-[32px] sm:text-[44px]">Questions? Just ask.</h2>
        <p className="mt-3 max-w-md text-lg text-muted">
          Tap any product to message us about it on WhatsApp. We usually reply within minutes.
        </p>
        {s.whatsappNumber && (
          <a
            href={whatsappLink(s.whatsappNumber, `Hello ${s.storeName}! I have a question.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 rounded-full bg-ink px-6 py-3 text-[15px] font-medium text-white hover:bg-black"
          >
            Chat with us
          </a>
        )}
      </div>
    </section>
  );
}
