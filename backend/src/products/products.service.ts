import { Injectable, Logger, NotFoundException, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import type { QueryFilter, Model, SortOrder } from 'mongoose';
import { isValidObjectId } from 'mongoose';
import { slugify, uniqueSuffix } from '../common/slug.js';
import { demoProducts } from './demo-products.js';
import { Product, type Status } from './product.schema.js';
import type { AdminListQuery, ListQuery, ProductInput, ProductUpdate } from './product.schemas.js';

const PUBLIC_STATUSES: Status[] = ['available', 'reserved'];

const SORTS: Record<ListQuery['sort'], Record<string, SortOrder>> = {
  newest: { featured: -1, createdAt: -1 },
  'price-asc': { price: 1, createdAt: -1 },
  'price-desc': { price: -1, createdAt: -1 },
};

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@Injectable()
export class ProductsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectModel(Product.name) private readonly products: Model<Product>,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    if (this.config.get('SEED_DEMO') !== 'true') return;
    if ((await this.products.estimatedDocumentCount()) > 0) return;
    for (const item of demoProducts) await this.create(item);
    this.logger.log(`Seeded ${demoProducts.length} demo products`);
  }

  // ---------- Public ----------

  listPublic(query: ListQuery) {
    return this.list(query, { status: { $in: PUBLIC_STATUSES } });
  }

  async findPublicBySlug(slug: string) {
    const product = await this.products
      .findOne({ slug, status: { $in: PUBLIC_STATUSES } })
      .lean();
    if (!product) throw new NotFoundException('Product not found');
    return this.serialize(product);
  }

  async related(slug: string, limit = 4) {
    const product = await this.products.findOne({ slug }).lean();
    if (!product) return [];
    const items = await this.products
      .find({ category: product.category, slug: { $ne: slug }, status: 'available' })
      .sort({ featured: -1, createdAt: -1 })
      .limit(limit)
      .lean();
    return items.map((p) => this.serialize(p));
  }

  async facets() {
    const match = { status: { $in: PUBLIC_STATUSES } };
    const [categories, conditions, storages, price] = await Promise.all([
      this.products.aggregate([{ $match: match }, { $group: { _id: '$category', count: { $sum: 1 } } }]),
      this.products.aggregate([{ $match: match }, { $group: { _id: '$condition', count: { $sum: 1 } } }]),
      this.products.distinct('storage', match),
      this.products.aggregate([
        { $match: match },
        { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } },
      ]),
    ]);
    const toMap = (rows: Array<{ _id: string; count: number }>) =>
      Object.fromEntries(rows.map((r) => [r._id, r.count]));
    return {
      categories: toMap(categories),
      conditions: toMap(conditions),
      storages: (storages.filter(Boolean) as string[]).sort(
        (a, b) => parseStorage(a) - parseStorage(b),
      ),
      price: { min: price[0]?.min ?? 0, max: price[0]?.max ?? 0 },
    };
  }

  // ---------- Admin ----------

  listAdmin({ status, ...query }: AdminListQuery) {
    return this.list(query, status ? { status } : {});
  }

  async findById(id: string) {
    if (!isValidObjectId(id)) throw new NotFoundException('Product not found');
    const product = await this.products.findById(id).lean();
    if (!product) throw new NotFoundException('Product not found');
    return this.serialize(product);
  }

  async create(input: ProductInput) {
    const slug = `${slugify(input.name, input.storage, input.color, input.condition)}-${uniqueSuffix()}`;
    const { set } = splitNulls(normalize(input));
    const doc = await this.products.create({ ...set, slug });
    return this.serialize(doc.toObject());
  }

  async update(id: string, input: ProductUpdate) {
    if (!isValidObjectId(id)) throw new NotFoundException('Product not found');
    const { set, unset } = splitNulls(normalize(input));
    const product = await this.products
      .findByIdAndUpdate(id, { $set: set, ...(unset ? { $unset: unset } : {}) }, { returnDocument: 'after', runValidators: true })
      .lean();
    if (!product) throw new NotFoundException('Product not found');
    return this.serialize(product);
  }

  async remove(id: string) {
    if (!isValidObjectId(id)) throw new NotFoundException('Product not found');
    const res = await this.products.findByIdAndDelete(id);
    if (!res) throw new NotFoundException('Product not found');
    return { ok: true };
  }

  async stats() {
    const [byStatus, byCategory, value, recent] = await Promise.all([
      this.products.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      this.products.aggregate([
        { $match: { status: { $in: PUBLIC_STATUSES } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),
      this.products.aggregate([
        { $match: { status: 'available' } },
        { $group: { _id: null, total: { $sum: { $multiply: ['$price', { $max: ['$quantity', 1] }] } } } },
      ]),
      this.products.find().sort({ updatedAt: -1 }).limit(6).lean(),
    ]);
    const statusMap = Object.fromEntries(byStatus.map((r) => [r._id, r.count])) as Record<string, number>;
    return {
      total: Object.values(statusMap).reduce((a, b) => a + b, 0),
      byStatus: statusMap,
      byCategory: Object.fromEntries(byCategory.map((r) => [r._id, r.count])),
      inventoryValue: value[0]?.total ?? 0,
      recent: recent.map((p) => this.serialize(p)),
    };
  }

  // ---------- Helpers ----------

  private async list(query: ListQuery, base: QueryFilter<Product>) {
    const filter: QueryFilter<Product> = { ...base };
    if (query.category) filter.category = query.category;
    if (query.condition) filter.condition = query.condition;
    if (query.storage) filter.storage = query.storage;
    if (query.featured !== undefined) filter.featured = query.featured;
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      filter.price = {
        ...(query.minPrice !== undefined ? { $gte: query.minPrice } : {}),
        ...(query.maxPrice !== undefined ? { $lte: query.maxPrice } : {}),
      };
    }
    if (query.q) {
      const rx = new RegExp(escapeRegex(query.q), 'i');
      filter.$or = [{ name: rx }, { color: rx }, { storage: rx }, { description: rx }];
    }

    const skip = (query.page - 1) * query.limit;
    const [items, total] = await Promise.all([
      this.products.find(filter).sort(SORTS[query.sort]).skip(skip).limit(query.limit).lean(),
      this.products.countDocuments(filter),
    ]);
    return {
      items: items.map((p) => this.serialize(p)),
      total,
      page: query.page,
      limit: query.limit,
      pages: Math.max(1, Math.ceil(total / query.limit)),
    };
  }

  private serialize(p: Record<string, any>) {
    const { _id, __v, ...rest } = p;
    return { id: String(_id), ...rest };
  }
}

function parseStorage(value: string) {
  const n = parseFloat(value);
  if (Number.isNaN(n)) return Number.MAX_SAFE_INTEGER;
  return /tb/i.test(value) ? n * 1024 : n;
}

function normalize<T extends Partial<ProductInput>>(input: T): T {
  // Battery health is only meaningful for used/open-box devices.
  if (input.condition === 'new') return { ...input, batteryHealth: null };
  return input;
}

/** Turns null values into $unset so optional fields can be cleared. */
function splitNulls(input: Record<string, unknown>) {
  const set: Record<string, unknown> = {};
  const unset: Record<string, ''> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === null) unset[key] = '';
    else if (value !== undefined) set[key] = value;
  }
  return { set, unset: Object.keys(unset).length ? unset : undefined };
}
