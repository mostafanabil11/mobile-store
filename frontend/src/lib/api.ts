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

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`, { cache: "no-store" });
  if (!res.ok) throw new ApiError(res.status, `API ${res.status} on ${path}`);
  return res.json() as Promise<T>;
}

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "Orchard",
  tagline: "Apple devices. Curated.",
  whatsappNumber: "",
  currency: "USD",
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

/** Store settings, deduplicated per request. Falls back to defaults if the API is down. */
export const getSettings = cache(async (): Promise<StoreSettings> => {
  try {
    return { ...DEFAULT_SETTINGS, ...(await get<Partial<StoreSettings>>("/settings")) };
  } catch {
    return DEFAULT_SETTINGS;
  }
});

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
