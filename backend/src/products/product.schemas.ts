import { z } from 'zod';
import { CATEGORIES, CONDITIONS, STATUSES } from './product.schema.js';

/** Empty string or null -> null (clears the field on update); undefined -> untouched. */
const clearable = <T>(v: T | null | undefined) => (v === undefined ? undefined : v ? v : null);

const optionalText = (max: number) => z.string().trim().max(max).nullish().transform(clearable);

const productFields = z.object({
  name: z.string().trim().min(1).max(120),
  category: z.enum(CATEGORIES),
  condition: z.enum(CONDITIONS),
  storage: optionalText(40),
  color: optionalText(60),
  colorHex: z
    .union([z.string().regex(/^#[0-9a-fA-F]{6}$/), z.literal('')])
    .nullish()
    .transform(clearable),
  batteryHealth: z.number().int().min(0).max(100).nullish(),
  price: z.number().min(0),
  compareAtPrice: z.number().min(0).nullish(),
  warranty: optionalText(120),
  region: optionalText(120),
  inTheBox: optionalText(200),
  description: optionalText(4000),
  specs: z
    .array(z.object({ label: z.string().trim().min(1).max(60), value: z.string().trim().min(1).max(200) }))
    .max(40),
  images: z.array(z.string().max(500)).max(20),
  status: z.enum(STATUSES),
  featured: z.boolean(),
  quantity: z.number().int().min(0),
});

export const productInputSchema = productFields.extend({
  specs: productFields.shape.specs.default([]),
  images: productFields.shape.images.default([]),
  status: productFields.shape.status.default('available'),
  featured: productFields.shape.featured.default(false),
  quantity: productFields.shape.quantity.default(1),
});
export type ProductInput = z.infer<typeof productInputSchema>;

/** No defaults here, so a partial update never resets fields it didn't send. */
export const productUpdateSchema = productFields.partial();
export type ProductUpdate = z.infer<typeof productUpdateSchema>;

const sortValues = ['newest', 'price-asc', 'price-desc'] as const;

export const listQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.enum(CATEGORIES).optional(),
  condition: z.enum(CONDITIONS).optional(),
  storage: z.string().trim().max(40).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  featured: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  sort: z.enum(sortValues).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
});
export type ListQuery = z.infer<typeof listQuerySchema>;

export const adminListQuerySchema = listQuerySchema.extend({
  status: z.enum(STATUSES).optional(),
});
export type AdminListQuery = z.infer<typeof adminListQuerySchema>;

export const statusUpdateSchema = z.object({ status: z.enum(STATUSES) });
export type StatusUpdate = z.infer<typeof statusUpdateSchema>;
