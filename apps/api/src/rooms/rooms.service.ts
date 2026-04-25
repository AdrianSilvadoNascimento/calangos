import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { eq, inArray, sql, asc } from 'drizzle-orm';
import { rooms, products, profiles } from '@enxoval/db/schema';
import { DB_TOKEN } from '../database/database.module';
import type { DB } from '../database/database.module';
import type { CreateRoomInput, UpdateRoomInput } from '@enxoval/contracts';

@Injectable()
export class RoomsService {
  constructor(@Inject(DB_TOKEN) private db: DB) {}

  async findAllByCouple(coupleId: string) {
    const result = await this.db
      .select({
        id: rooms.id,
        name: rooms.name,
        icon: rooms.icon,
        orderIndex: rooms.orderIndex,
        coupleId: rooms.coupleId,
        createdAt: rooms.createdAt,
        productCount: sql<number>`count(${products.id})::int`,
      })
      .from(rooms)
      .leftJoin(products, eq(products.roomId, rooms.id))
      .where(eq(rooms.coupleId, coupleId))
      .groupBy(rooms.id)
      .orderBy(asc(rooms.orderIndex));

    return result;
  }

  async create(dto: CreateRoomInput, coupleId: string) {
    const existing = await this.db.query.rooms.findMany({
      where: eq(rooms.coupleId, coupleId),
    });
    const maxOrder = existing.reduce((max, r) => Math.max(max, r.orderIndex), -1);

    const [room] = await this.db
      .insert(rooms)
      .values({
        ...dto,
        coupleId,
        orderIndex: maxOrder + 1,
      })
      .returning();

    return room;
  }

  async update(id: string, dto: UpdateRoomInput, userId: string) {
    await this.assertMembership(id, userId);

    const [room] = await this.db
      .update(rooms)
      .set(dto)
      .where(eq(rooms.id, id))
      .returning();

    if (!room) throw new NotFoundException('Room not found');
    return room;
  }

  async remove(id: string, userId: string) {
    await this.assertMembership(id, userId);

    const [room] = await this.db
      .delete(rooms)
      .where(eq(rooms.id, id))
      .returning();

    if (!room) throw new NotFoundException('Room not found');
    return { deleted: true };
  }

  async reorder(ids: string[], userId: string) {
    if (ids.length === 0) return { reordered: true };

    const profile = await this.db.query.profiles.findFirst({
      where: eq(profiles.userId, userId),
    });
    if (!profile?.coupleId) throw new ForbiddenException('No couple linked');

    const target = await this.db.query.rooms.findMany({
      where: inArray(rooms.id, ids),
    });
    if (target.length !== ids.length) throw new NotFoundException('Room not found');
    if (target.some((r) => r.coupleId !== profile.coupleId)) {
      throw new ForbiddenException('Not your room');
    }

    await this.db.transaction(async (tx) => {
      for (let i = 0; i < ids.length; i++) {
        await tx
          .update(rooms)
          .set({ orderIndex: i })
          .where(eq(rooms.id, ids[i]));
      }
    });
    return { reordered: true };
  }

  private async assertMembership(roomId: string, userId: string) {
    const room = await this.db.query.rooms.findFirst({
      where: eq(rooms.id, roomId),
    });
    if (!room) throw new NotFoundException('Room not found');

    const profile = await this.db.query.profiles.findFirst({
      where: eq(profiles.userId, userId),
    });
    if (!profile?.coupleId || profile.coupleId !== room.coupleId) {
      throw new ForbiddenException('Not your room');
    }
  }
}
