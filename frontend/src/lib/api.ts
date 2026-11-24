import "server-only";
import { cache } from "react";
import type { Facets, Paginated, Product, StoreSettings } from "./types";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/**
 * How long a page waits for the API. Render's free plan sleeps after 15 idle minutes and takes
 * ~30-50s to wake; rather than leave visitors staring at an empty page, we give up after this and
 * show a "waking up" notice that reloads the page once the API answers (see WakeBanner).
 */
const TIMEOUT_MS = 8_000;

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`, { cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new ApiError(res.status, `API ${res.status} on ${path}`);
  return res.json() as Promise<T>;
}

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "Orchard",
  tagline: "Apple devices. Curated.",
  whatsappNumber: "",
  currency: "EGP",
  phone: "",
  email: "",
  address: "",
  mapUrl: "",
  instagram: "",
  workingHours: "",
  heroTitle: "The latest iPhone.\nIn your hands today.",
  heroSubtitle: "New and certified pre-owned Apple devices — every unit inspected, every detail disclosed.",
  heroImage: "",
  whatsappGreeting: "Hello! I'm interested in this item:",
};

/** Settings plus whether the API answered, deduplicated per request. */
export const getSettingsState = cache(async (): Promise<{ settings: StoreSettings; online: boolean }> => {
  try {
    return { settings: { ...DEFAULT_SETTINGS, ...(await get<Partial<StoreSettings>>("/settings")) }, online: true };
  } catch {
    return { settings: DEFAULT_SETTINGS, online: false };
  }
});

/** Store settings, deduplicated per request. Falls back to defaults if the API is down. */
export async function getSettings(): Promise<StoreSettings> {
  return (await getSettingsState()).settings;
}

export type ProductQuery = Partial<
  Record<"q" | "category" | "condition" | "storage" | "sort" | "page" | "limit" | "featured" | "minPrice" | "maxPrice", string>
>;

export function getProducts(query: ProductQuery = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) if (value) params.set(key, value);
  const qs = params.toString();
  return get<Paginated<Product>>(`/products${qs ? `?${qs}` : ""}`);
}

export const getProduct = cache(async (slug: string) => {
  try {
    return await get<Product>(`/products/${encodeURIComponent(slug)}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
});

export function getRelated(slug: string) {
  return get<Product[]>(`/products/${encodeURIComponent(slug)}/related`).catch(() => []);
}

export function getFacets() {
  return get<Facets>("/products/facets");
}
