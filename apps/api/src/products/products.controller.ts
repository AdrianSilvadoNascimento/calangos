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
import { ZodValidationPipe } from '../common/pipes';
import { createProductSchema, updateProductSchema } from '@enxoval/contracts';
import type { CreateProductInput, UpdateProductInput } from '@enxoval/contracts';

@Controller()
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly profilesService: ProfilesService,
  ) {}

  @Get('rooms/:roomId/products')
  findByRoom(@Param('roomId') roomId: string) {
    return this.productsService.findByRoom(roomId);
  }

  @Get('products')
  async findAll(
    @Session() session: UserSession,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const profile = await this.profilesService.getByUserId(session.user.id);
    if (!profile?.coupleId) return [];
    return this.productsService.findAllByCouple(profile.coupleId, { status, search });
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
    return this.productsService.update(id, dto, socketId);
  }

  @Delete('products/:id')
  async remove(
    @Param('id') id: string,
    @Session() session: UserSession,
    @Headers('x-pusher-socket-id') socketId?: string,
  ) {
    await this.productsService.assertProductOwnership(id, session.user.id);
    return this.productsService.remove(id, socketId);
  }
}
