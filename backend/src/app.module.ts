import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module.js';
import { CatalogModule } from './catalog/catalog.module.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthController } from './health/health.controller.js';
import { MediaModule } from './media/media.module.js';
import { ProductsModule } from './products/products.module.js';
import { SettingsModule } from './settings/settings.module.js';
import { UploadsModule } from './uploads/uploads.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    DatabaseModule,
    MediaModule,
    AuthModule,
    ProductsModule,
    SettingsModule,
    UploadsModule,
    CatalogModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
