import { CONDITION_LABELS, formatPrice } from "./format";
import type { Product, StoreSettings } from "./types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "";

/** Builds the prefilled WhatsApp message for a product enquiry. */
export function productMessage(product: Product, settings: StoreSettings) {
  const lines = [
    settings.whatsappGreeting || "Hello! I'm interested in this item:",
    "",
    `*${product.name}*`,
  ];
  const variant = [product.storage, product.color].filter(Boolean).join(", ");
  if (variant) lines.push(variant);

  let condition = `Condition: ${CONDITION_LABELS[product.condition]}`;
  if (product.condition !== "new" && product.batteryHealth != null) {
    condition += ` · Battery ${product.batteryHealth}%`;
  }
  lines.push(condition);
  lines.push(`Price: ${formatPrice(product.price, settings.currency)}`);
  if (SITE_URL) lines.push("", `${SITE_URL}/products/${product.slug}`);
  lines.push("", "Is it still available?");
  return lines.join("\n");
}

export function whatsappLink(number: string, message: string) {
  const digits = number.replace(/\D/g, "");
  const base = digits ? `https://wa.me/${digits}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(message)}`;
}
