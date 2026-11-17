import type { Category } from '../products/product.schema.js';
import type { CatalogColor, CatalogDevice } from './catalog.mapper.js';

/**
 * Second catalog source: DummyJSON's free demo products. It only has a handful of
 * Apple items (MacBook Pro, AirPods, AirPods Max, chargers…), but they come as
 * clean 1000×1000 studio renders, which fills the Mac / AirPods / accessories gap
 * left by the phone database.
 */

const BASE = 'https://dummyjson.com';
const CATEGORIES = ['laptops', 'mobile-accessories'];
export const SLUG_PREFIX = 'dj-';

interface RawProduct {
  id: number;
  title: string;
  brand?: string;
  images: string[];
  thumbnail: string;
}

const COLOR_SUFFIXES: Record<string, string> = {
  'space grey': '#5e5e62',
  'cosmic grey': '#5e5e62',
  silver: '#e3e4e6',
  gold: '#e8d5b5',
};

function clean(title: string): { name: string; color?: CatalogColor } {
  let name = title.replace(/^Apple\s+/i, '');
  let color: CatalogColor | undefined;
  for (const [suffix, hex] of Object.entries(COLOR_SUFFIXES)) {
    const rx = new RegExp(`\\s+${suffix}$`, 'i');
    if (rx.test(name)) {
      name = name.replace(rx, '');
      const label = suffix.replace(/\b\w/g, (c) => c.toUpperCase()).replace('Grey', 'Gray');
      color = { name: label, hex };
    }
  }
  name = name
    .replace(/\bAirpods\b/gi, 'AirPods')
    .replace(/\bAirpower\b/gi, 'AirPower')
    .replace(/\bHomePod Mini\b/gi, 'HomePod mini')
    .replace(/\bIphone\b/gi, 'iPhone')
    .replace(/\s+(\d+)\s+Inch\b/i, ' $1″');
  return { name, color };
}

function categorize(name: string): Category {
  if (/\b(macbook|imac|mac mini|mac studio)\b/i.test(name)) return 'mac';
  if (/\bairpods\b/i.test(name)) return 'airpods';
  return 'accessories';
}

function map(p: RawProduct): CatalogDevice & { thumbnail: string } {
  const { name, color } = clean(p.title);
  return {
    slug: `${SLUG_PREFIX}${p.id}`,
    name,
    category: categorize(name),
    storageOptions: [],
    colors: color ? [color] : [],
    specs: [],
    images: p.images,
    thumbnail: p.thumbnail,
  };
}

export async function fetchDummyJsonDevices(): Promise<(CatalogDevice & { thumbnail: string })[]> {
  const pages = await Promise.all(
    CATEGORIES.map(async (category) => {
      const res = await fetch(`${BASE}/products/category/${category}?limit=0&select=title,brand,images,thumbnail`, {
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) throw new Error(`DummyJSON ${category} returned ${res.status}`);
      return ((await res.json()) as { products: RawProduct[] }).products;
    }),
  );
  return pages
    .flat()
    .filter((p) => p.brand === 'Apple' && !/\b(watch|ipad|iphone \d)/i.test(p.title))
    .map(map);
}
