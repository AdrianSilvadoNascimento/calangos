import { Injectable, Inject, Logger } from '@nestjs/common';
import { eq, and, ne, sql, desc } from 'drizzle-orm';
import {
  milestones,
  rooms,
  products,
  profiles,
} from '@enxoval/db/schema';
import { DB_TOKEN } from '../database/database.module';
import type { DB } from '../database/database.module';
import type {
  MilestoneType,
  MilestoneResponse,
  MilestonesResponse,
  UpcomingMilestone,
} from '@enxoval/contracts';
import { PusherService } from '../realtime/pusher.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ITEM_THRESHOLDS, COPY } from './milestone-rules';

interface RoomAggregate {
  roomId: string;
  name: string;
  total: number;
  received: number;
}

@Injectable()
export class MilestonesService {
  private readonly logger = new Logger(MilestonesService.name);

  constructor(
    @Inject(DB_TOKEN) private db: DB,
    private readonly pusherService: PusherService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async listForCouple(coupleId: string): Promise<MilestonesResponse> {
    const unlockedRows = await this.db.query.milestones.findMany({
      where: eq(milestones.coupleId, coupleId),
      orderBy: desc(milestones.unlockedAt),
    });

    const unlocked: MilestoneResponse[] = unlockedRows.map((m) => ({
      id: m.id,
      type: m.type,
      scopeId: m.scopeId,
      metadata: (m.metadata as Record<string, unknown> | null) ?? null,
      unlockedAt: m.unlockedAt.toISOString(),
    }));

    const upcoming = await this.computeUpcoming(coupleId, unlockedRows);
    return { unlocked, upcoming };
  }

  /**
   * Re-evaluate all milestones for a couple. Idempotent — uses unique constraint
   * on (couple_id, type, scope_id) to skip already-unlocked ones.
   *
   * Returns the list of milestones unlocked *this call* (for the caller to
   * trigger celebrations).
   */
  async evaluate(coupleId: string, actorUserId: string, excludeSocketId?: string) {
    const candidates = await this.computeCandidates(coupleId);
    if (candidates.length === 0) return [];

    const inserted: typeof milestones.$inferSelect[] = [];

    for (const c of candidates) {
      try {
        const [row] = await this.db
          .insert(milestones)
          .values({
            coupleId,
            type: c.type,
            scopeId: c.scopeId,
            metadata: c.metadata ?? null,
          })
          .onConflictDoNothing({
            target: [milestones.coupleId, milestones.type, milestones.scopeId],
          })
          .returning();
        if (row) inserted.push(row);
      } catch (err) {
        this.logger.error(`Failed to insert milestone ${c.type} for ${coupleId}`, err);
      }
    }

    // Side effects per newly unlocked milestone
    for (const m of inserted) {
      const copy = COPY[m.type];

      const payload: MilestoneResponse = {
        id: m.id,
        type: m.type,
        scopeId: m.scopeId,
        metadata: (m.metadata as Record<string, unknown> | null) ?? null,
        unlockedAt: m.unlockedAt.toISOString(),
      };

      await this.pusherService.broadcast(
        coupleId,
        { type: 'milestone.unlocked', payload },
        excludeSocketId,
      );

      // Notify both partners (caller's choice; we notify the partner only —
      // the actor sees the celebratory modal locally).
      await this.notificationsService.notifyCouple(
        coupleId,
        {
          type: 'milestone.unlocked',
          title: copy.title,
          body: copy.body,
          data: { milestoneType: m.type, scopeId: m.scopeId },
        },
        { exceptUserId: actorUserId, respectPreference: 'notifyOnMilestone' },
      );
    }

    return inserted;
  }

  // ── Internal: compute candidates from current state ──────

  private async computeCandidates(
    coupleId: string,
  ): Promise<Array<{ type: MilestoneType; scopeId: string; metadata?: Record<string, unknown> }>> {
    const candidates: Array<{ type: MilestoneType; scopeId: string; metadata?: Record<string, unknown> }> = [];

    // Member count → partner_joined
    const members = await this.db.query.profiles.findMany({
      where: eq(profiles.coupleId, coupleId),
    });
    if (members.length >= 2) {
      candidates.push({ type: 'partner_joined', scopeId: '' });
    }

    // All non-cancelled product counts
    const productAgg = await this.aggregateProducts(coupleId);

    // items_X thresholds (count NOT cancelled)
    for (const [type, threshold] of Object.entries(ITEM_THRESHOLDS) as Array<
      [keyof typeof ITEM_THRESHOLDS, number]
    >) {
      if (productAgg.totalAlive >= threshold) {
        candidates.push({ type, scopeId: '' });
      }
    }

    // First purchased / first received (any product with that status)
    if (productAgg.firstPurchasedId) {
      candidates.push({
        type: 'first_purchased',
        scopeId: '',
        metadata: { productId: productAgg.firstPurchasedId },
      });
    }
    if (productAgg.firstReceivedId) {
      candidates.push({
        type: 'first_received',
        scopeId: '',
        metadata: { productId: productAgg.firstReceivedId },
      });
    }

    // Per-room: 50% / 100% received (only if room has ≥ 1 item)
    for (const room of productAgg.byRoom) {
      const denom = room.total;
      if (denom === 0) continue;
      const ratio = room.received / denom;
      if (ratio >= 0.5) {
        candidates.push({
          type: 'room_50_percent',
          scopeId: room.roomId,
          metadata: { roomName: room.name },
        });
      }
      if (ratio >= 1) {
        candidates.push({
          type: 'room_100_percent',
          scopeId: room.roomId,
          metadata: { roomName: room.name },
        });
      }
    }

    return candidates;
  }

  private async aggregateProducts(coupleId: string) {
    const coupleRooms = await this.db.query.rooms.findMany({
      where: eq(rooms.coupleId, coupleId),
    });

    if (coupleRooms.length === 0) {
      return {
        totalAlive: 0,
        firstPurchasedId: null as string | null,
        firstReceivedId: null as string | null,
        byRoom: [] as RoomAggregate[],
      };
    }

    const roomIds = coupleRooms.map((r) => r.id);
    const allProducts = await this.db.query.products.findMany({
      where: sql`${products.roomId} IN ${roomIds}`,
    });

    const alive = allProducts.filter((p) => p.status !== 'cancelled');
    const firstPurchased = alive.find((p) => p.status === 'purchased');
    const firstReceived = alive.find((p) => p.status === 'received');

    const byRoom: RoomAggregate[] = coupleRooms.map((r) => {
      const inRoom = alive.filter((p) => p.roomId === r.id);
      return {
        roomId: r.id,
        name: r.name,
        total: inRoom.length,
        received: inRoom.filter((p) => p.status === 'received').length,
      };
    });

    return {
      totalAlive: alive.length,
      firstPurchasedId: firstPurchased?.id ?? null,
      firstReceivedId: firstReceived?.id ?? null,
      byRoom,
    };
  }

  // ── Internal: compute upcoming progress for unlocked-less milestones ──

  private async computeUpcoming(
    coupleId: string,
    unlockedRows: typeof milestones.$inferSelect[],
  ): Promise<UpcomingMilestone[]> {
    const has = (type: MilestoneType, scopeId = '') =>
      unlockedRows.some((m) => m.type === type && m.scopeId === scopeId);

    const upcoming: UpcomingMilestone[] = [];
    const agg = await this.aggregateProducts(coupleId);

    // items_X — show next unlocked threshold
    const itemEntries = Object.entries(ITEM_THRESHOLDS) as Array<
      [keyof typeof ITEM_THRESHOLDS, number]
    >;
    const sorted = itemEntries.sort((a, b) => a[1] - b[1]);
    const nextItem = sorted.find(([type]) => !has(type));
    if (nextItem) {
      const [type, threshold] = nextItem;
      const remaining = Math.max(0, threshold - agg.totalAlive);
      upcoming.push({
        type,
        scopeId: '',
        scopeLabel: null,
        percent: Math.min(100, Math.round((agg.totalAlive / threshold) * 100)),
        hint: remaining === 0 ? 'pronto pra desbloquear' : `faltam ${remaining}`,
      });
    }

    // first_received (only if not yet unlocked, and at least 1 item exists)
    if (!has('first_received') && agg.totalAlive > 0) {
      upcoming.push({
        type: 'first_received',
        scopeId: '',
        scopeLabel: null,
        percent: 0,
        hint: 'marque um item como recebido',
      });
    }

    // Most-progressed room toward 100%
    const incompleteRooms = agg.byRoom
      .filter((r) => r.total > 0 && !has('room_100_percent', r.roomId))
      .map((r) => ({ ...r, ratio: r.received / r.total }))
      .sort((a, b) => b.ratio - a.ratio);
    const topRoom = incompleteRooms[0];
    if (topRoom) {
      upcoming.push({
        type: topRoom.ratio >= 0.5 ? 'room_100_percent' : 'room_50_percent',
        scopeId: topRoom.roomId,
        scopeLabel: topRoom.name,
        percent: Math.round(topRoom.ratio * 100),
        hint:
          topRoom.ratio >= 0.5
            ? `faltam ${topRoom.total - topRoom.received} para completar ${topRoom.name}`
            : `${topRoom.received} de ${topRoom.total} recebidos em ${topRoom.name}`,
      });
    }

    return upcoming;
  }
}
