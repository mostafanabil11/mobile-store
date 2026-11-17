import { Body, Controller, Get, Module, Param, Post, Query, UseGuards } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { z } from 'zod';
import { AdminGuard } from '../auth/auth.guard.js';
import { Product, ProductSchema } from '../products/product.schema.js';
import { CatalogService } from './catalog.service.js';

const searchSchema = z.object({ q: z.string().trim().max(60).default('') });
const importSchema = z.object({ urls: z.array(z.url()).min(1).max(10) });

@Controller('admin/catalog')
@UseGuards(AdminGuard)
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('search')
  search(@Query({ schema: searchSchema }) { q }: z.infer<typeof searchSchema>) {
    return this.catalog.search(q);
  }

  @Post('fill-missing')
  fillMissing() {
    return this.catalog.fillMissing();
  }

  @Post('import-images')
  async importImages(@Body({ schema: importSchema }) { urls }: z.infer<typeof importSchema>) {
    return { urls: await this.catalog.importImages(urls) };
  }

  @Get('devices/:slug')
  device(@Param('slug') slug: string) {
    return this.catalog.device(slug);
  }
}

@Module({
  imports: [MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }])],
  controllers: [CatalogController],
  providers: [CatalogService],
})
export class CatalogModule {}
