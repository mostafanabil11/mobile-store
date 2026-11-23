import type { Category, Condition, Product, Status } from "./types";

export const CATEGORY_LABELS: Record<Category, string> = {
  iphone: "iPhone",
  ipad: "iPad",
  mac: "Mac",
  watch: "Watch",
  airpods: "AirPods",
  accessories: "Accessories",
};

export const CONDITION_LABELS: Record<Condition, string> = {
  new: "New",
  "open-box": "Open box",
  used: "Pre-owned",
};

export const STATUS_LABELS: Record<Status, string> = {
  available: "Available",
  reserved: "Reserved",
  sold: "Sold",
  hidden: "Hidden",
};

export function formatPrice(value: number, currency = "EGP") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString("en-US")}`;
  }
}

/** "256GB · Desert Titanium" */
export function variantLine(p: Pick<Product, "storage" | "color">) {
  return [p.storage, p.color].filter(Boolean).join(" · ");
}

export function batteryTone(health: number) {
  if (health >= 90) return "text-success";
  if (health >= 80) return "text-ink";
  return "text-warn";
}

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
