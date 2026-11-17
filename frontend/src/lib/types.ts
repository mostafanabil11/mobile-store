export const CATEGORIES = ["iphone", "ipad", "mac", "watch", "airpods", "accessories"] as const;
export const CONDITIONS = ["new", "open-box", "used"] as const;
export const STATUSES = ["available", "reserved", "sold", "hidden"] as const;

export type Category = (typeof CATEGORIES)[number];
export type Condition = (typeof CONDITIONS)[number];
export type Status = (typeof STATUSES)[number];

export interface Spec {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: Category;
  condition: Condition;
  storage?: string;
  color?: string;
  colorHex?: string;
  batteryHealth?: number;
  price: number;
  compareAtPrice?: number;
  warranty?: string;
  region?: string;
  inTheBox?: string;
  description?: string;
  specs: Spec[];
  images: string[];
  status: Status;
  featured: boolean;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface Facets {
  categories: Partial<Record<Category, number>>;
  conditions: Partial<Record<Condition, number>>;
  storages: string[];
  price: { min: number; max: number };
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  whatsappNumber: string;
  currency: string;
  phone: string;
  email: string;
  address: string;
  mapUrl: string;
  instagram: string;
  workingHours: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  whatsappGreeting: string;
}

export interface Stats {
  total: number;
  byStatus: Partial<Record<Status, number>>;
  byCategory: Partial<Record<Category, number>>;
  inventoryValue: number;
  recent: Product[];
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
}

export interface CatalogListing {
  slug: string;
  name: string;
  image: string;
}

export interface CatalogDevice {
  slug: string;
  name: string;
  category: Category;
  released?: string;
  storageOptions: string[];
  colors: { name: string; hex?: string }[];
  specs: Spec[];
  images: string[];
}
