import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { z } from 'zod';

/** A single document holding store-wide settings shown on the storefront. */
@Schema({ timestamps: true, collection: 'settings' })
export class Settings {
  @Prop({ default: 'Orchard' }) storeName: string;
  @Prop({ default: 'Apple devices. Curated.' }) tagline: string;
  /** International format, digits only, e.g. 201001234567 */
  @Prop({ default: '' }) whatsappNumber: string;
  @Prop({ default: 'USD' }) currency: string;
  @Prop({ default: '' }) phone: string;
  @Prop({ default: '' }) email: string;
  @Prop({ default: '' }) address: string;
  @Prop({ default: '' }) mapUrl: string;
  @Prop({ default: '' }) instagram: string;
  @Prop({ default: '' }) workingHours: string;
  @Prop({ default: 'The latest iPhone.\nIn your hands today.' }) heroTitle: string;
  @Prop({
    default: 'New and certified pre-owned Apple devices — every unit inspected, every detail disclosed.',
  })
  heroSubtitle: string;
  /** Uploaded hero banner (/uploads/...). Empty = the storefront's built-in default image. */
  @Prop({ default: '' }) heroImage: string;
  @Prop({ default: "Hello! I'm interested in this item:" }) whatsappGreeting: string;
}

export const SettingsSchema = SchemaFactory.createForClass(Settings);

const text = (max: number) => z.string().trim().max(max);

export const settingsUpdateSchema = z
  .object({
    storeName: text(60).min(1),
    tagline: text(120),
    whatsappNumber: z
      .string()
      .trim()
      .transform((v) => v.replace(/[^\d]/g, ''))
      .pipe(z.string().max(20)),
    currency: text(8).min(1),
    phone: text(40),
    email: z.union([z.email(), z.literal('')]),
    address: text(240),
    mapUrl: z.union([z.url(), z.literal('')]),
    instagram: text(80),
    workingHours: text(160),
    heroTitle: text(160),
    heroSubtitle: text(300),
    heroImage: z.union([z.string().regex(/^\/uploads\/[\w.-]+$/), z.literal('')]),
    whatsappGreeting: text(200),
  })
  .partial();
export type SettingsUpdate = z.infer<typeof settingsUpdateSchema>;
