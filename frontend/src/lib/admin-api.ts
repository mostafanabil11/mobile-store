"use client";

import type { AdminUser, CatalogDevice, CatalogListing, Paginated, Product, Stats, StoreSettings } from "./types";

export class AdminApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isForm = init.body instanceof FormData;
  const res = await fetch(`/api${path}`, {
    ...init,
    credentials: "include",
    headers: isForm ? init.headers : { "Content-Type": "application/json", ...init.headers },
  });

  if (res.status === 401 && !path.startsWith("/auth/login")) {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
    // Full reload on purpose: clears all client state after the session ends.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/admin/login";
    throw new AdminApiError(401, "Session expired");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = Array.isArray(data?.message) ? data.message.join(", ") : data?.message;
    throw new AdminApiError(res.status, message || `Request failed (${res.status})`);
  }
  return data as T;
}

const json = (body: unknown) => JSON.stringify(body);

export type ProductPayload = Omit<Product, "id" | "slug" | "createdAt" | "updatedAt" | "batteryHealth" | "compareAtPrice"> & {
  batteryHealth: number | null;
  compareAtPrice: number | null;
};

export const adminApi = {
  login: (email: string, password: string) =>
    request<{ admin: AdminUser }>("/auth/login", { method: "POST", body: json({ email, password }) }),
  logout: () => request<{ ok: true }>("/auth/logout", { method: "POST" }),
  me: () => request<AdminUser>("/auth/me"),
  updateProfile: (body: Partial<Pick<AdminUser, "name" | "email">>) =>
    request<AdminUser>("/auth/me", { method: "PATCH", body: json(body) }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ ok: true }>("/auth/password", { method: "PATCH", body: json({ currentPassword, newPassword }) }),

  stats: () => request<Stats>("/admin/products/stats"),
  products: (query: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) if (v) params.set(k, v);
    return request<Paginated<Product>>(`/admin/products?${params}`);
  },
  product: (id: string) => request<Product>(`/admin/products/${id}`),
  createProduct: (body: ProductPayload) =>
    request<Product>("/admin/products", { method: "POST", body: json(body) }),
  updateProduct: (id: string, body: Partial<ProductPayload>) =>
    request<Product>(`/admin/products/${id}`, { method: "PATCH", body: json(body) }),
  setStatus: (id: string, status: Product["status"]) =>
    request<Product>(`/admin/products/${id}/status`, { method: "PATCH", body: json({ status }) }),
  deleteProduct: (id: string) => request<{ ok: true }>(`/admin/products/${id}`, { method: "DELETE" }),

  upload: (files: File[]) => {
    const form = new FormData();
    for (const f of files) form.append("files", f);
    return request<{ urls: string[] }>("/admin/uploads", { method: "POST", body: form });
  },

  catalogSearch: (q: string) => request<CatalogListing[]>(`/admin/catalog/search?q=${encodeURIComponent(q)}`),
  catalogDevice: (slug: string) => request<CatalogDevice>(`/admin/catalog/devices/${encodeURIComponent(slug)}`),
  importCatalogImages: (urls: string[]) =>
    request<{ urls: string[] }>("/admin/catalog/import-images", { method: "POST", body: json({ urls }) }),
  fillMissingPhotos: () =>
    request<{ updated: string[]; skipped: string[] }>("/admin/catalog/fill-missing", { method: "POST" }),

  settings: () => request<StoreSettings>("/settings"),
  updateSettings: (body: Partial<StoreSettings>) =>
    request<StoreSettings>("/admin/settings", { method: "PUT", body: json(body) }),
};
