import Link from "next/link";
import { connection } from "next/server";
import { getSettings } from "@/lib/api";
import { CATEGORY_LABELS } from "@/lib/format";
import { CATEGORIES } from "@/lib/types";
import { whatsappLink } from "@/lib/whatsapp";
import { ClockIcon, InstagramIcon, PhoneIcon, PinIcon, WhatsAppIcon } from "../ui/icons";

export async function Footer() {
  await connection(); // footer renders per request, so the current year is safe to read
  const s = await getSettings();
  const year = new Date().getFullYear();
  const instagram = s.instagram.replace(/^@/, "");

  return (
    <footer className="border-t border-line-soft bg-bg-soft text-[13px] text-muted">
      <div className="mx-auto grid max-w-[1120px] gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-3">
          <p className="text-[15px] font-semibold text-ink">{s.storeName}</p>
          <p className="max-w-xs leading-relaxed">{s.tagline}</p>
          <p className="max-w-xs leading-relaxed">
            We don&apos;t take online orders — message us on WhatsApp to check availability, reserve a device or
            arrange a visit.
          </p>
        </div>

        <div>
          <p className="mb-3 font-semibold text-ink">Shop</p>
          <ul className="space-y-2">
            <li>
              <Link href="/products" className="hover:text-ink">
                All products
              </Link>
            </li>
            {CATEGORIES.map((c) => (
              <li key={c}>
                <Link href={`/products?category=${c}`} className="hover:text-ink">
                  {CATEGORY_LABELS[c]}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-3 font-semibold text-ink">Visit &amp; contact</p>
          <ul className="space-y-3">
            {s.whatsappNumber && (
              <li>
                <a
                  href={whatsappLink(s.whatsappNumber, `Hello ${s.storeName}!`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-ink"
                >
                  <WhatsAppIcon size={15} /> WhatsApp us
                </a>
              </li>
            )}
            {s.phone && (
              <li>
                <a href={`tel:${s.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 hover:text-ink">
                  <PhoneIcon size={15} /> {s.phone}
                </a>
              </li>
            )}
            {s.address && (
              <li>
                {s.mapUrl ? (
                  <a href={s.mapUrl} target="_blank" rel="noopener noreferrer" className="flex gap-2 hover:text-ink">
                    <PinIcon size={15} className="mt-0.5 shrink-0" /> {s.address}
                  </a>
                ) : (
                  <span className="flex gap-2">
                    <PinIcon size={15} className="mt-0.5 shrink-0" /> {s.address}
                  </span>
                )}
              </li>
            )}
            {s.workingHours && (
              <li className="flex gap-2">
                <ClockIcon size={15} className="mt-0.5 shrink-0" /> {s.workingHours}
              </li>
            )}
            {instagram && (
              <li>
                <a
                  href={`https://instagram.com/${instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-ink"
                >
                  <InstagramIcon size={15} /> @{instagram}
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="mx-auto flex max-w-[1120px] flex-col gap-2 border-t border-line px-5 py-5 text-xs text-faint sm:flex-row sm:justify-between">
        <p>
          © {year} {s.storeName}. All rights reserved.
        </p>
        <p>Independent reseller. Apple, iPhone, iPad, Mac and AirPods are trademarks of Apple Inc.</p>
      </div>
    </footer>
  );
}
