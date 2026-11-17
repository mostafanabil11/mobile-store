import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/auth.guard.js';
import {
  type AdminListQuery,
  adminListQuerySchema,
  type ListQuery,
  listQuerySchema,
  type ProductInput,
  productInputSchema,
  type ProductUpdate,
  productUpdateSchema,
  type StatusUpdate,
  statusUpdateSchema,
} from './product.schemas.js';
import { ProductsService } from './products.service.js';

/** Public storefront endpoints. Sold and hidden products are never returned. */
@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  list(@Query({ schema: listQuerySchema }) query: ListQuery) {
    return this.products.listPublic(query);
  }

  @Get('facets')
  facets() {
    return this.products.facets();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.products.findPublicBySlug(slug);
  }

  @Get(':slug/related')
  related(@Param('slug') slug: string) {
    return this.products.related(slug);
  }
}

@Controller('admin/products')
@UseGuards(AdminGuard)
export class AdminProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  list(@Query({ schema: adminListQuerySchema }) query: AdminListQuery) {
    return this.products.listAdmin(query);
  }

  @Get('stats')
  stats() {
    return this.products.stats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.products.findById(id);
  }

  @Post()
  create(@Body({ schema: productInputSchema }) dto: ProductInput) {
    return this.products.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body({ schema: productUpdateSchema }) dto: ProductUpdate) {
    return this.products.update(id, dto);
  }

  @Patch(':id/status')
  setStatus(@Param('id') id: string, @Body({ schema: statusUpdateSchema }) dto: StatusUpdate) {
    return this.products.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.products.remove(id);
  }
}
