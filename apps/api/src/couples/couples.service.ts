import { Injectable, Inject, ConflictException, NotFoundException } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { couples, profiles, rooms, products } from '@enxoval/db/schema';
import { DEFAULT_ROOMS } from '@enxoval/db';
import { DB_TOKEN } from '../database/database.module';
import type { DB } from '../database/database.module';
import type {
  CreateCoupleInput,
  JoinCoupleInput,
  UpdateCoupleInput,
  CoupleProgress,
} from '@enxoval/contracts';

@Injectable()
export class CouplesService {
  constructor(@Inject(DB_TOKEN) private db: DB) {}

  /**
   * Creates a new couple, seeds default rooms, and links the creator's profile.
   */
  async create(dto: CreateCoupleInput, userId: string, userName: string) {
    const inviteCode = this.generateInviteCode();

    const [couple] = await this.db
      .insert(couples)
      .values({ name: dto.name ?? null, inviteCode })
      .returning();

    await this.db.insert(rooms).values(
      DEFAULT_ROOMS.map((room) => ({
        ...room,
        coupleId: couple.id,
      })),
    );

    await this.db
      .insert(profiles)
      .values({
        userId,
        coupleId: couple.id,
        displayName: userName || 'Parceiro(a)',
      })
      .onConflictDoUpdate({
        target: profiles.userId,
        set: { coupleId: couple.id },
      });

    return { ...couple, inviteCode };
  }

  async countMembers(coupleId: string) {
    const members = await this.db.query.profiles.findMany({
      where: eq(profiles.coupleId, coupleId),
    });
    return members.length;
  }

  async getMembersDetails(coupleId: string) {
    return this.db.query.profiles.findMany({
      where: eq(profiles.coupleId, coupleId),
      columns: {
        userId: true,
        displayName: true,
      },
    });
  }

  /**
   * Joins an existing couple via invite code.
   */
  async join(dto: JoinCoupleInput, userId: string) {
    const couple = await this.db.query.couples.findFirst({
      where: eq(couples.inviteCode, dto.inviteCode),
    });

    if (!couple) {
      throw new NotFoundException('Código não encontrado. Confira com seu parceiro(a).');
    }

    // Check if couple already has 2 members
    const members = await this.db.query.profiles.findMany({
      where: eq(profiles.coupleId, couple.id),
    });

    if (members.length >= 2) {
      throw new ConflictException('Este enxoval já está completo.');
    }

    // Check if user is already in this couple
    const existing = members.find((m) => m.userId === userId);
    if (existing) {
      return couple;
    }

    await this.db.insert(profiles).values({
      userId,
      coupleId: couple.id,
      displayName: 'Parceiro(a)',
    });

    return couple;
  }

  /**
   * Updates the couple linked to a given user (only if the user is a member).
   */
  async updateByUserId(userId: string, dto: UpdateCoupleInput) {
    const profile = await this.db.query.profiles.findFirst({
      where: eq(profiles.userId, userId),
    });
    if (!profile?.coupleId) throw new NotFoundException('No couple linked');

    const [updated] = await this.db
      .update(couples)
      .set({ name: dto.name ?? null })
      .where(eq(couples.id, profile.coupleId))
      .returning();

    if (!updated) throw new NotFoundException('Couple not found');
    return updated;
  }

  /**
   * Aggregate progress for the couple — totals, items by status, per-room split,
   * planned spend in cents. Receives roomIds via DB filter (no privacy issue
   * since we already gate on coupleId).
   */
  async getProgress(coupleId: string): Promise<CoupleProgress> {
    const coupleRooms = await this.db.query.rooms.findMany({
      where: eq(rooms.coupleId, coupleId),
    });

    if (coupleRooms.length === 0) {
      return {
        totalItems: 0,
        totalPlannedCents: 0,
        currency: 'BRL',
        byStatus: { wishlist: 0, purchased: 0, received: 0, cancelled: 0 },
        byRoom: [],
        percentReceived: 0,
      };
    }

    const roomIds = coupleRooms.map((r) => r.id);
    const rows = await this.db.query.products.findMany({
      where: sql`${products.roomId} IN ${roomIds}`,
      columns: {
        id: true,
        roomId: true,
        status: true,
        priceCents: true,
        currency: true,
      },
    });

    const byStatus = { wishlist: 0, purchased: 0, received: 0, cancelled: 0 };
    let totalPlannedCents = 0;
    let currency = 'BRL';
    const perRoom = new Map<string, { total: number; received: number }>();

    for (const r of rows) {
      byStatus[r.status]++;
      if (r.status !== 'cancelled') {
        if (r.priceCents != null) {
          totalPlannedCents += r.priceCents;
          currency = r.currency || currency;
        }
        const slot = perRoom.get(r.roomId) ?? { total: 0, received: 0 };
        slot.total += 1;
        if (r.status === 'received') slot.received += 1;
        perRoom.set(r.roomId, slot);
      }
    }

    const totalAlive = byStatus.wishlist + byStatus.purchased + byStatus.received;
    const percentReceived = totalAlive === 0
      ? 0
      : Math.round((byStatus.received / totalAlive) * 100);

    const byRoom = coupleRooms.map((room) => {
      const agg = perRoom.get(room.id) ?? { total: 0, received: 0 };
      const pct = agg.total === 0 ? 0 : Math.round((agg.received / agg.total) * 100);
      return {
        roomId: room.id,
        name: room.name,
        icon: room.icon,
        total: agg.total,
        received: agg.received,
        percentReceived: pct,
      };
    });

    return {
      totalItems: byStatus.wishlist + byStatus.purchased + byStatus.received + byStatus.cancelled,
      totalPlannedCents,
      currency,
      byStatus,
      byRoom,
      percentReceived,
    };
  }

  /**
   * Finds the couple associated with a user.
   */
  async findByUserId(userId: string) {
    const profile = await this.db.query.profiles.findFirst({
      where: eq(profiles.userId, userId),
    });

    if (!profile?.coupleId) return null;

    return this.db.query.couples.findFirst({
      where: eq(couples.id, profile.coupleId),
    });
  }

  private generateInviteCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No 0/O, 1/I confusion
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }
}
