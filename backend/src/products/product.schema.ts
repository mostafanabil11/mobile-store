import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export const CATEGORIES = ['iphone', 'ipad', 'mac', 'watch', 'airpods', 'accessories'] as const;
export const CONDITIONS = ['new', 'open-box', 'used'] as const;
export const STATUSES = ['available', 'reserved', 'sold', 'hidden'] as const;

export type Category = (typeof CATEGORIES)[number];
export type Condition = (typeof CONDITIONS)[number];
export type Status = (typeof STATUSES)[number];

@Schema({ _id: false })
export class Spec {
  @Prop({ required: true, trim: true })
  label: string;

  @Prop({ required: true, trim: true })
  value: string;
}
const SpecSchema = SchemaFactory.createForClass(Spec);

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, index: true })
  slug: string;

  @Prop({ required: true, enum: CATEGORIES, index: true })
  category: Category;

  @Prop({ required: true, enum: CONDITIONS, index: true })
  condition: Condition;

  @Prop({ trim: true })
  storage?: string;

  @Prop({ trim: true })
  color?: string;

  @Prop({ trim: true })
  colorHex?: string;

  /** Battery health percentage (mostly for used devices). */
  @Prop({ min: 0, max: 100 })
  batteryHealth?: number;

  @Prop({ required: true, min: 0, index: true })
  price: number;

  /** Optional original price, shown struck through. */
  @Prop({ min: 0 })
  compareAtPrice?: number;

  /** e.g. "Apple warranty until Mar 2027" or "3 months store warranty". */
  @Prop({ trim: true })
  warranty?: string;

  /** Region / SIM version, e.g. "US · eSIM only", "Middle East · Dual SIM". */
  @Prop({ trim: true })
  region?: string;

  /** What comes with it, e.g. "Original box & cable". */
  @Prop({ trim: true })
  inTheBox?: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: [SpecSchema], default: [] })
  specs: Spec[];

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ required: true, enum: STATUSES, default: 'available', index: true })
  status: Status;

  @Prop({ default: false, index: true })
  featured: boolean;

  @Prop({ default: 1, min: 0 })
  quantity: number;

  createdAt: Date;
  updatedAt: Date;
}

export type ProductDocument = HydratedDocument<Product>;
export const ProductSchema = SchemaFactory.createForClass(Product);
ProductSchema.index({ name: 'text', description: 'text', color: 'text', storage: 'text' });
