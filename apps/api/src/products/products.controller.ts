import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Headers,
} from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { ProductsService } from './products.service';
import { ProfilesService } from '../profiles/profiles.service';
import { ScrapingService } from '../scraping/scraping.service';
import { ZodValidationPipe } from '../common/pipes';
import {
  createProductSchema,
  updateProductSchema,
  paginationQuerySchema,
  productPreviewQuerySchema,
} from '@enxoval/contracts';
import type {
  CreateProductInput,
  UpdateProductInput,
  PaginationQuery,
  ProductPreviewQuery,
  ProductPreviewResponse,
} from '@enxoval/contracts';

@Controller()
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly profilesService: ProfilesService,
    private readonly scrapingService: ScrapingService,
  ) {}

  @Get('products/preview')
  async preview(
    @Query(new ZodValidationPipe(productPreviewQuerySchema))
    query: ProductPreviewQuery,
  ): Promise<ProductPreviewResponse> {
    const metadata = await this.scrapingService.scrape(query.url);
    return {
      title: metadata.title,
      description: metadata.description,
      image: metadata.image,
      priceCents: metadata.priceCents,
      storeName: metadata.storeName,
      storeNameConfident: metadata.storeNameConfident,
    };
  }

  @Get('rooms/:roomId/products')
  findByRoom(
    @Param('roomId') roomId: string,
    @Query(new ZodValidationPipe(paginationQuerySchema))
    pagination: PaginationQuery,
  ) {
    return this.productsService.findByRoom(roomId, pagination);
  }

  @Get('products')
  async findAll(
    @Session() session: UserSession,
    @Query(new ZodValidationPipe(paginationQuerySchema))
    pagination: PaginationQuery,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const profile = await this.profilesService.getByUserId(session.user.id);
    if (!profile?.coupleId) {
      return { items: [], nextOffset: null };
    }
    return this.productsService.findAllByCouple(profile.coupleId, {
      status,
      search,
      ...pagination,
    });
  }

  @Post('products')
  async create(
    @Body(new ZodValidationPipe(createProductSchema)) dto: CreateProductInput,
    @Session() session: UserSession,
    @Headers('x-pusher-socket-id') socketId?: string,
  ) {
    await this.productsService.assertCoupleOwnership(dto.roomId, session.user.id);
    return this.productsService.create(dto, session.user.id, socketId);
  }

  @Patch('products/:id')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateProductSchema)) dto: UpdateProductInput,
    @Session() session: UserSession,
    @Headers('x-pusher-socket-id') socketId?: string,
  ) {
    await this.productsService.assertProductOwnership(id, session.user.id);
    return this.productsService.update(id, dto, session.user.id, socketId);
  }

  @Delete('products/:id')
  async remove(
    @Param('id') id: string,
    @Session() session: UserSession,
    @Headers('x-pusher-socket-id') socketId?: string,
  ) {
    await this.productsService.assertProductOwnership(id, session.user.id);
    return this.productsService.remove(id, session.user.id, socketId);
  }
}
