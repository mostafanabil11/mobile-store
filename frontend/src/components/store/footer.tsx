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
  const chat = s.whatsappNumber ? whatsappLink(s.whatsappNumber, `Hello ${s.storeName}!`) : "";
  const hasVisit = !!(s.address || s.workingHours || s.phone);

  const heading = "mb-4 text-[13px] font-semibold text-ink";
  const link = "transition-colors hover:text-ink";

  return (
    <footer className="bg-bg-soft text-[13px] text-muted">
      <div className="mx-auto max-w-[1120px] px-5">
        <div className="grid gap-10 border-t border-line py-14 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.3fr]">
          {/* Brand */}
          <div>
            <p className="flex items-center gap-2 text-[17px] font-semibold tracking-tight text-ink">
              <span className="grid h-7 w-7 place-items-center rounded-[8px] bg-ink text-[13px] text-white">
                {s.storeName.charAt(0).toUpperCase()}
              </span>
              {s.storeName}
            </p>
            <p className="mt-3 max-w-xs leading-relaxed">{s.tagline}</p>
            <div className="mt-5 flex gap-2">
              {chat && (
                <SocialButton href={chat} label="WhatsApp">
                  <WhatsAppIcon size={17} />
                </SocialButton>
              )}
              {instagram && (
                <SocialButton href={`https://instagram.com/${instagram}`} label="Instagram">
                  <InstagramIcon size={17} />
                </SocialButton>
              )}
            </div>
          </div>

          {/* Shop */}
          <div>
            <p className={heading}>Shop</p>
            <ul className="space-y-2.5">
              <li>
                <Link href="/products" className={link}>
                  All products
                </Link>
              </li>
              {CATEGORIES.map((c) => (
                <li key={c}>
                  <Link href={`/products?category=${c}`} className={link}>
                    {CATEGORY_LABELS[c]}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/products?condition=used" className={link}>
                  Pre-owned
                </Link>
              </li>
            </ul>
          </div>

          {/* How buying works */}
          <div>
            <p className={heading}>How it works</p>
            <ol className="space-y-2.5">
              <li>1. Find a device you like</li>
              <li>2. Ask about it on WhatsApp</li>
              <li>3. Reserve it, or visit to try it</li>
              <li>4. Pay in store and take it home</li>
            </ol>
          </div>

          {/* Visit */}
          {hasVisit && (
            <div>
              <p className={heading}>Visit</p>
              <ul className="space-y-3">
                {s.address && (
                  <li>
                    <a
                      href={s.mapUrl || "/#visit"}
                      target={s.mapUrl ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className={`flex gap-2.5 ${link}`}
                    >
                      <PinIcon size={15} className="mt-0.5 shrink-0" /> {s.address}
                    </a>
                  </li>
                )}
                {s.workingHours && (
                  <li className="flex gap-2.5">
                    <ClockIcon size={15} className="mt-0.5 shrink-0" /> {s.workingHours}
                  </li>
                )}
                {s.phone && (
                  <li>
                    <a href={`tel:${s.phone.replace(/\s/g, "")}`} className={`flex gap-2.5 ${link}`}>
                      <PhoneIcon size={15} className="mt-0.5 shrink-0" /> {s.phone}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-line py-6 text-[12px] text-faint sm:flex-row sm:justify-between">
          <p>
            © {year} {s.storeName}. All rights reserved.
          </p>
          <p>Independent reseller. Apple, iPhone, iPad, Mac and AirPods are trademarks of Apple Inc.</p>
        </div>
      </div>
    </footer>
  );
}

function SocialButton({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="grid h-9 w-9 place-items-center rounded-full bg-white text-ink-2 ring-1 ring-line-soft transition-colors hover:bg-ink hover:text-white"
    >
      {children}
    </a>
  );
}
