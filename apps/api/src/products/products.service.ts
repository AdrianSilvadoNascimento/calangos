import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { eq, and, ilike, sql, desc } from 'drizzle-orm';
import { products, rooms, profiles } from '@enxoval/db/schema';
import { DB_TOKEN } from '../database/database.module';
import type { DB } from '../database/database.module';
import type {
  CreateProductInput,
  UpdateProductInput,
  Paginated,
  ActivityType,
} from '@enxoval/contracts';
import { extractDomain } from '@enxoval/utils';
import { PusherService } from '../realtime/pusher.service';
import { ScrapingService } from '../scraping/scraping.service';
import { ActivityService } from '../activity/activity.service';
import { MilestonesService } from '../milestones/milestones.service';
import { NotificationsService } from '../notifications/notifications.service';

type Product = typeof products.$inferSelect;

const STATUS_TO_ACTIVITY: Record<Product['status'], ActivityType> = {
  wishlist: 'product.wishlisted',
  purchased: 'product.purchased',
  received: 'product.received',
  cancelled: 'product.cancelled',
};

@Injectable()
export class ProductsService {
  constructor(
    @Inject(DB_TOKEN) private db: DB,
    private readonly pusherService: PusherService,
    private readonly scrapingService: ScrapingService,
    private readonly activityService: ActivityService,
    private readonly milestonesService: MilestonesService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findByRoom(
    roomId: string,
    { limit, offset }: { limit: number; offset: number },
  ): Promise<Paginated<Product>> {
    const items = await this.db.query.products.findMany({
      where: eq(products.roomId, roomId),
      orderBy: desc(products.createdAt),
      limit,
      offset,
    });

    return {
      items,
      nextOffset: items.length < limit ? null : offset + limit,
    };
  }

  async findAllByCouple(
    coupleId: string,
    filters: { status?: string; search?: string; limit: number; offset: number },
  ): Promise<Paginated<Product>> {
    const coupleRooms = await this.db.query.rooms.findMany({
      where: eq(rooms.coupleId, coupleId),
    });
    const roomIds = coupleRooms.map((r) => r.id);

    if (roomIds.length === 0) {
      return { items: [], nextOffset: null };
    }

    const conditions = [sql`${products.roomId} IN ${roomIds}`];

    if (filters.status) {
      conditions.push(eq(products.status, filters.status as Product['status']));
    }

    if (filters.search) {
      conditions.push(ilike(products.title, `%${filters.search}%`));
    }

    const items = await this.db.query.products.findMany({
      where: and(...conditions),
      orderBy: desc(products.createdAt),
      limit: filters.limit,
      offset: filters.offset,
    });

    return {
      items,
      nextOffset: items.length < filters.limit ? null : filters.offset + filters.limit,
    };
  }

  async create(dto: CreateProductInput, userId: string, excludeSocketId?: string) {
    const targetRoom = await this.db.query.rooms.findFirst({
      where: eq(rooms.id, dto.roomId),
    });
    if (!targetRoom) throw new NotFoundException('Room not found');

    const coupleRooms = await this.db.query.rooms.findMany({
      where: eq(rooms.coupleId, targetRoom.coupleId),
    });
    const coupleRoomIds = coupleRooms.map((r) => r.id);

    if (coupleRoomIds.length > 0) {
      const existing = await this.db.query.products.findFirst({
        where: and(
          eq(products.url, dto.url),
          sql`${products.roomId} IN ${coupleRoomIds}`,
        ),
      });
      if (existing) {
        throw new ConflictException('Esse link já existe na lista do casal.');
      }
    }

    const defaultStoreName = extractDomain(dto.url);
    const metadata = await this.scrapingService.scrape(dto.url);

    const storeNameFromDto = dto.storeName?.trim();
    const descriptionFromDto = dto.description?.trim();

    const [product] = await this.db
      .insert(products)
      .values({
        url: dto.url,
        roomId: dto.roomId,
        addedBy: userId,
        title: dto.title ?? metadata.title ?? null,
        description: descriptionFromDto || metadata.description || null,
        imageUrl: metadata.image ?? null,
        priceCents: dto.priceCents ?? metadata.priceCents ?? null,
        notes: dto.notes ?? null,
        storeName: storeNameFromDto || metadata.storeName || defaultStoreName,
      })
      .returning();

    if (targetRoom.coupleId) {
      await this.pusherService.broadcast(
        targetRoom.coupleId,
        { type: 'product.created', payload: product },
        excludeSocketId,
      );

      await this.activityService.record({
        coupleId: targetRoom.coupleId,
        actorUserId: userId,
        type: 'product.added',
        targetType: 'product',
        targetId: product.id,
        metadata: {
          title: product.title ?? product.storeName,
          roomId: product.roomId,
          roomName: targetRoom.name,
        },
        excludeSocketId,
      });

      await this.notificationsService.notifyCouple(
        targetRoom.coupleId,
        {
          type: 'product.added',
          title: 'Novo item no enxoval ♥',
          body: product.title ?? product.storeName ?? 'Item adicionado',
          data: { productId: product.id, roomId: product.roomId },
        },
        { exceptUserId: userId, respectPreference: 'notifyOnPartnerAdd' },
      );

      await this.milestonesService.evaluate(targetRoom.coupleId, userId, excludeSocketId);
    }

    return product;
  }

  async update(id: string, dto: UpdateProductInput, userId: string, excludeSocketId?: string) {
    const before = await this.db.query.products.findFirst({
      where: eq(products.id, id),
    });
    if (!before) throw new NotFoundException('Product not found');

    const [product] = await this.db
      .update(products)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();

    const room = await this.db.query.rooms.findFirst({
      where: eq(rooms.id, product.roomId),
    });

    if (room?.coupleId) {
      await this.pusherService.broadcast(
        room.coupleId,
        { type: 'product.updated', payload: product },
        excludeSocketId,
      );

      const statusChanged = dto.status && dto.status !== before.status;
      if (statusChanged) {
        const activityType = STATUS_TO_ACTIVITY[product.status];
        await this.activityService.record({
          coupleId: room.coupleId,
          actorUserId: userId,
          type: activityType,
          targetType: 'product',
          targetId: product.id,
          metadata: {
            title: product.title ?? product.storeName,
            roomId: product.roomId,
            roomName: room.name,
            from: before.status,
            to: product.status,
          },
          excludeSocketId,
        });

        await this.notificationsService.notifyCouple(
          room.coupleId,
          {
            type: product.status === 'received' ? 'product.received' : 'product.purchased',
            title:
              product.status === 'received'
                ? 'Item recebido em casa 🦎'
                : product.status === 'purchased'
                  ? 'Item comprado 🛒'
                  : 'Status atualizado',
            body: product.title ?? product.storeName ?? 'Item',
            data: {
              productId: product.id,
              roomId: product.roomId,
              status: product.status,
            },
          },
          { exceptUserId: userId, respectPreference: 'notifyOnStatusChange' },
        );

        await this.milestonesService.evaluate(room.coupleId, userId, excludeSocketId);
      }
    }

    return product;
  }

  async remove(id: string, userId: string, excludeSocketId?: string) {
    const [product] = await this.db
      .delete(products)
      .where(eq(products.id, id))
      .returning();

    if (!product) throw new NotFoundException('Product not found');

    const room = await this.db.query.rooms.findFirst({
      where: eq(rooms.id, product.roomId),
    });

    if (room?.coupleId) {
      await this.pusherService.broadcast(
        room.coupleId,
        { type: 'product.deleted', payload: { id, roomId: product.roomId } },
        excludeSocketId,
      );

      // Re-evaluate milestones — removing a product can't unlock new ones, but it
      // also can't un-unlock; safe to skip the call here for performance.
    }

    return { deleted: true };
  }

  async assertCoupleOwnership(roomId: string, userId: string) {
    const room = await this.db.query.rooms.findFirst({
      where: eq(rooms.id, roomId),
    });
    if (!room) throw new NotFoundException('Room not found');

    const profile = await this.db.query.profiles.findFirst({
      where: eq(profiles.userId, userId),
    });
    if (!profile?.coupleId || room.coupleId !== profile.coupleId) {
      throw new ForbiddenException('Not your room');
    }
  }

  async assertProductOwnership(productId: string, userId: string) {
    const product = await this.db.query.products.findFirst({
      where: eq(products.id, productId),
    });
    if (!product) throw new NotFoundException('Product not found');
    await this.assertCoupleOwnership(product.roomId, userId);
  }
}
