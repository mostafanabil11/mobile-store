import { BadGatewayException, BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Product } from '../products/product.schema.js';
import { type CatalogDevice, displayName, mapDevice, nameKey, type RawDevice } from './catalog.mapper.js';
import { fetchDummyJsonDevices, SLUG_PREFIX } from './dummyjson.source.js';

export interface ListedDevice {
  slug: string;
  name: string;
  image: string;
}

const LIST_TTL = 12 * 60 * 60 * 1000;
const IMAGE_HOSTS = /(^|\.)(gsmarena\.com|dummyjson\.com)$/i;
const UPLOAD_DIR = join(process.cwd(), 'uploads');
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/**
 * Apple device catalog used to prefill product specs and photos. Two free sources:
 *  - phone-specs-api (GSMArena data): iPhone, iPad, Apple Watch with specs and photos
 *  - DummyJSON: a few Macs, AirPods and accessories with studio renders
 * Demo/dev use only: swap the photos for your own or licensed images before going live.
 */
@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);
  private readonly base: string;
  private list?: { at: number; ttl: number; devices: ListedDevice[] };
  private readonly details = new Map<string, CatalogDevice>();

  constructor(
    config: ConfigService,
    @InjectModel(Product.name) private readonly products: Model<Product>,
  ) {
    this.base = (config.get<string>('CATALOG_API_URL') ?? 'https://phone-specs-api.vercel.app').replace(/\/$/, '');
  }

  private async getJson<T>(path: string): Promise<T> {
    let res: Response;
    try {
      res = await fetch(`${this.base}${path}`, { signal: AbortSignal.timeout(20_000) });
    } catch {
      throw new BadGatewayException('Catalog service is unreachable');
    }
    if (!res.ok) throw new BadGatewayException(`Catalog service error (${res.status})`);
    const body = (await res.json()) as { status: boolean; data: T };
    if (!body.status) throw new BadGatewayException('Catalog service returned an error');
    return body.data;
  }

  /** All Apple devices (phones newest first, then Macs/AirPods/accessories), cached in memory. */
  async devices(): Promise<ListedDevice[]> {
    if (this.list && Date.now() - this.list.at < this.list.ttl) return this.list.devices;
    const [phones, extras] = await Promise.all([
      this.phoneDevices(),
      fetchDummyJsonDevices().catch((e: Error) => {
        this.logger.warn(`DummyJSON unavailable: ${e.message}`);
        return [];
      }),
    ]);
    for (const extra of extras) this.details.set(extra.slug, extra);
    const devices = [...phones, ...extras.map((d) => ({ slug: d.slug, name: d.name, image: d.thumbnail }))];
    // If a source came back empty, retry soon instead of caching the gap for hours.
    this.list = { at: Date.now(), ttl: extras.length ? LIST_TTL : 60_000, devices };
    return devices;
  }

  private async phoneDevices(): Promise<ListedDevice[]> {
    type Page = { last_page: number; phones: { phone_name: string; slug: string; image: string }[] };
    const path = (page: number) => `/brands/apple-phones-48?page=${page}`;
    const first = await this.getJson<Page>(path(1));
    const rest = await Promise.all(
      Array.from({ length: Math.min(first.last_page, 20) - 1 }, (_, i) => this.getJson<Page>(path(i + 2))),
    );
    return [first, ...rest]
      .flatMap((p) => p.phones)
      .map((p) => ({ slug: p.slug, name: displayName(p.phone_name), image: p.image }));
  }

  async search(q = '', limit = 12) {
    const devices = await this.devices();
    const terms = q.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    // Every query term must start a word in the name, so "16 pro" doesn't match "iPad Pro (2016)".
    return devices
      .filter((d) => {
        const words = d.name.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
        return terms.every((t) => words.some((w) => w.startsWith(t)));
      })
      .slice(0, limit);
  }

  async device(slug: string): Promise<CatalogDevice> {
    if (!/^[\w().-]+$/.test(slug)) throw new NotFoundException('Unknown model');
    const cached = this.details.get(slug);
    if (cached) return cached;
    if (slug.startsWith(SLUG_PREFIX)) {
      await this.devices(); // DummyJSON items are loaded with the list
      const extra = this.details.get(slug);
      if (!extra) throw new NotFoundException('Unknown model');
      return extra;
    }
    const raw = await this.getJson<RawDevice>(`/${encodeURIComponent(slug)}`);
    if (!raw?.phone_name) throw new NotFoundException('Unknown model');
    const device = mapDevice(slug, raw);
    this.details.set(slug, device);
    return device;
  }

  /** Downloads catalog photos (in parallel) into /uploads so the store serves its own copies. */
  async importImages(urls: string[]): Promise<string[]> {
    const targets = urls.slice(0, 10).map((url) => {
      let parsed: URL;
      try {
        parsed = new URL(url);
      } catch {
        throw new BadRequestException('Invalid image URL');
      }
      if (parsed.protocol !== 'https:' || !IMAGE_HOSTS.test(parsed.hostname)) {
        throw new BadRequestException('Images can only be imported from the catalog');
      }
      return parsed;
    });
    await mkdir(UPLOAD_DIR, { recursive: true });
    const results = await Promise.all(targets.map((url) => this.download(url)));
    return results.filter((u): u is string => !!u);
  }

  private async download(url: URL): Promise<string | null> {
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000) }).catch(() => null);
    const type = res?.headers.get('content-type') ?? '';
    if (!res?.ok || !type.startsWith('image/')) {
      this.logger.warn(`Skipped image ${url.href}`);
      return null;
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length > MAX_IMAGE_BYTES) return null;
    const ext = type.includes('png') ? '.png' : type.includes('webp') ? '.webp' : '.jpg';
    const file = `${randomUUID()}${ext}`;
    await writeFile(join(UPLOAD_DIR, file), buffer);
    return `/uploads/${file}`;
  }

  /** Best catalog match for a store product name, e.g. "iPad Pro 13″ (M5)" -> "iPad Pro 13 (2025)". */
  async match(name: string) {
    const key = nameKey(name);
    const devices = await this.devices();
    return (
      devices.find((d) => nameKey(d.name) === key) ??
      devices.find((d) => nameKey(d.name).startsWith(`${key} `)) ??
      devices.find((d) => key.startsWith(`${nameKey(d.name)} `))
    );
  }

  /** Adds catalog photos (and specs, when empty) to every product that has no photos yet. */
  async fillMissing() {
    const targets = await this.products.find({ $or: [{ images: { $size: 0 } }, { images: { $exists: false } }] });
    await this.devices(); // warm the model list once before matching in parallel
    const updated: string[] = [];
    const skipped: string[] = [];

    // A few products at a time keeps this quick without hammering the catalog.
    const queue = [...targets];
    const worker = async () => {
      for (let product = queue.shift(); product; product = queue.shift()) {
        const found = await this.match(product.name);
        const device = found ? await this.device(found.slug).catch(() => null) : null;
        const images = device ? await this.importImages(device.images) : [];
        if (!device || !images.length) {
          skipped.push(product.name);
          continue;
        }
        product.images = images;
        if (!product.specs?.length) product.specs = device.specs;
        await product.save();
        updated.push(product.name);
      }
    };
    await Promise.all(Array.from({ length: 4 }, worker));
    return { updated, skipped };
  }
}
