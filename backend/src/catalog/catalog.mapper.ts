import type { Category } from '../products/product.schema.js';

/** Raw device payload from phone-specs-api (GSMArena data). */
export interface RawDevice {
  brand: string;
  phone_name: string;
  thumbnail: string;
  phone_images: string[];
  release_date: string;
  storage: string;
  os: string;
  specifications: { title: string; specs: { key: string; val: string[] }[] }[];
}

export interface CatalogColor {
  name: string;
  hex?: string;
}

export interface CatalogDevice {
  slug: string;
  name: string;
  category: Category;
  released?: string;
  storageOptions: string[];
  colors: CatalogColor[];
  specs: { label: string; value: string }[];
  images: string[];
}

/** Approximate finishes for Apple colour names, used for the swatch next to the colour. */
const COLOR_HEX: Record<string, string> = {
  black: '#1d1d1f',
  white: '#f4f4f2',
  silver: '#e3e4e6',
  gold: '#e8d5b5',
  'rose gold': '#e6c7c2',
  'space gray': '#5e5e62',
  'space grey': '#5e5e62',
  'space black': '#2b2b2d',
  'jet black': '#1d1d1f',
  graphite: '#4a4a4c',
  midnight: '#232a35',
  starlight: '#efe8dc',
  red: '#c8102e',
  '(product)red': '#c8102e',
  blue: '#a9bfd9',
  'sierra blue': '#a7c1d9',
  'pacific blue': '#2f4f63',
  'deep blue': '#2e3a52',
  'mist blue': '#a8b9cc',
  'sky blue': '#c7d6e4',
  ultramarine: '#5b6fd6',
  teal: '#7fb6b0',
  green: '#c9d8c5',
  'alpine green': '#4c5c4b',
  sage: '#b9c3a8',
  yellow: '#f5e39a',
  purple: '#cfc4dd',
  'deep purple': '#4f4458',
  lavender: '#d8cfe6',
  pink: '#f2d4d7',
  'black titanium': '#3b3b3d',
  'white titanium': '#e9e7e2',
  'natural titanium': '#c9c2b6',
  'desert titanium': '#bfa48f',
  'blue titanium': '#4a5463',
  'cosmic orange': '#d9773b',
  'light gold': '#e8dcc5',
  'cloud white': '#f2f1ed',
  slate: '#5c6066',
  natural: '#c9c2b6',
};

const spec = (raw: RawDevice, section: string, key: string): string | undefined =>
  raw.specifications
    .find((s) => s.title === section)
    ?.specs.find((s) => s.key === key)
    ?.val.join(' / ')
    .trim() || undefined;

const firstSpecIn = (raw: RawDevice, section: string) =>
  raw.specifications.find((s) => s.title === section)?.specs[0];

const stripParens = (v: string) => v.replace(/\s*\([^)]*\)/g, '').trim();

export function categorize(name: string): Category {
  const n = name.toLowerCase();
  if (n.startsWith('iphone')) return 'iphone';
  if (n.startsWith('ipad')) return 'ipad';
  if (n.startsWith('watch')) return 'watch';
  if (n.startsWith('airpods')) return 'airpods';
  if (n.startsWith('mac')) return 'mac';
  return 'accessories';
}

export function displayName(name: string) {
  return name.startsWith('Watch') ? `Apple ${name}` : name;
}

export function mapDevice(slug: string, raw: RawDevice): CatalogDevice {
  const category = categorize(raw.phone_name);

  // Storage: "128GB 8GB RAM, 256GB 8GB RAM, ..." -> ["128GB", "256GB", ...]
  const internal = spec(raw, 'Memory', 'Internal') ?? '';
  const storageOptions =
    category === 'watch'
      ? []
      : [...new Set(internal.split(',').map((p) => p.trim().split(/\s+/)[0]).filter((p) => /^\d+(GB|TB)$/i.test(p)))];

  const colors: CatalogColor[] = (spec(raw, 'Misc', 'Colors') ?? '')
    .split(/,\s*/)
    .map((c) => c.trim())
    .filter(Boolean)
    .map((name) => ({ name, hex: COLOR_HEX[name.toLowerCase()] }));

  const specs: { label: string; value: string }[] = [];
  const push = (label: string, value?: string) => value && specs.push({ label, value });

  const size = spec(raw, 'Display', 'Size')?.split(',')[0];
  const panel = spec(raw, 'Display', 'Type')?.split(',').slice(0, 2).join(',');
  push('Display', [size?.replace(' inches', '″'), panel].filter(Boolean).join(' '));
  push('Chip', spec(raw, 'Platform', 'Chipset') && stripParens(spec(raw, 'Platform', 'Chipset')!));

  const main = firstSpecIn(raw, 'Main Camera');
  if (main && main.key !== 'Features' && main.key !== 'Video') {
    push('Camera', `${main.key} camera, ${main.val[0]?.split(',')[0]} main`);
  }
  const selfie = firstSpecIn(raw, 'Selfie camera');
  if (selfie && selfie.key !== 'Features' && selfie.key !== 'Video') {
    push('Front camera', selfie.val[0]?.split(',')[0]);
  }
  const mah = [...new Set([...(spec(raw, 'Battery', 'Type') ?? '').matchAll(/(\d{3,5})\s*mAh/gi)].map((m) => Number(m[1])))].sort((a, b) => a - b);
  push('Battery', mah.length > 1 ? `${mah[0]} – ${mah[mah.length - 1]} mAh` : mah.length ? `${mah[0]} mAh` : undefined);
  const water = spec(raw, 'Body', 'Other')?.match(/IP\d{2}/)?.[0];
  push('Water resistance', water);
  push('Weight', spec(raw, 'Body', 'Weight')?.split('(')[0].trim());
  push('Software', spec(raw, 'Platform', 'OS'));
  push('Released', spec(raw, 'Launch', 'Announced')?.split(',')[0]);

  // Product shots live under /vv/pics/; skip lifestyle/review photos.
  const shots = raw.phone_images.filter((u) => u.includes('/vv/pics/'));

  return {
    slug,
    name: displayName(raw.phone_name),
    category,
    released: spec(raw, 'Launch', 'Announced'),
    storageOptions,
    colors,
    specs,
    images: shots.length ? shots : [raw.thumbnail].filter(Boolean),
  };
}

/** Loose name key used to match store products to catalog models. */
export function nameKey(name: string) {
  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/^apple\s+/, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
