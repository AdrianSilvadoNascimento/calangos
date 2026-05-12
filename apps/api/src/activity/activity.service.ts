import { Injectable, Inject } from '@nestjs/common';
import { eq, desc, lt, and } from 'drizzle-orm';
import { activityEvents, profiles } from '@enxoval/db/schema';
import { DB_TOKEN } from '../database/database.module';
import type { DB } from '../database/database.module';
import { PusherService } from '../realtime/pusher.service';
import type {
  ActivityType,
  ActivityTarget,
  ActivityEventResponse,
} from '@enxoval/contracts';

interface RecordParams {
  coupleId: string;
  actorUserId: string;
  type: ActivityType;
  targetType: ActivityTarget;
  targetId: string | null;
  metadata?: Record<string, unknown> | null;
  excludeSocketId?: string;
}

@Injectable()
export class ActivityService {
  constructor(
    @Inject(DB_TOKEN) private db: DB,
    private readonly pusherService: PusherService,
  ) {}

  /** Record an activity row and broadcast it to the couple channel. */
  async record({
    coupleId,
    actorUserId,
    type,
    targetType,
    targetId,
    metadata,
    excludeSocketId,
  }: RecordParams) {
    const [event] = await this.db
      .insert(activityEvents)
      .values({
        coupleId,
        actorUserId,
        type,
        targetType,
        targetId,
        metadata: metadata ?? null,
      })
      .returning();

    const actor = await this.db.query.profiles.findFirst({
      where: eq(profiles.userId, actorUserId),
    });

    const payload: ActivityEventResponse = {
      id: event.id,
      coupleId: event.coupleId,
      actorUserId: event.actorUserId,
      actorName: actor?.displayName ?? 'Alguém',
      type: event.type,
      targetType: event.targetType,
      targetId: event.targetId,
      metadata: (event.metadata as Record<string, unknown> | null) ?? null,
      createdAt: event.createdAt.toISOString(),
    };

    await this.pusherService.broadcast(
      coupleId,
      { type: 'activity.created', payload },
      excludeSocketId,
    );

    return payload;
  }

  /**
   * Cursor-based pagination: pass `cursor` (createdAt iso) to fetch older events.
   */
  async listForCouple(
    coupleId: string,
    { limit, cursor }: { limit: number; cursor?: string },
  ): Promise<{ items: ActivityEventResponse[]; nextCursor: string | null }> {
    const cursorDate = cursor ? new Date(cursor) : null;

    const conditions = [eq(activityEvents.coupleId, coupleId)];
    if (cursorDate) conditions.push(lt(activityEvents.createdAt, cursorDate));

    const rows = await this.db.query.activityEvents.findMany({
      where: and(...conditions),
      orderBy: desc(activityEvents.createdAt),
      limit,
    });

    if (rows.length === 0) {
      return { items: [], nextCursor: null };
    }

    const actorIds = Array.from(new Set(rows.map((r) => r.actorUserId)));
    const actorProfiles = await this.db.query.profiles.findMany({
      where: (p, { inArray }) => inArray(p.userId, actorIds),
    });
    const actorById = new Map(actorProfiles.map((p) => [p.userId, p.displayName]));

    const items: ActivityEventResponse[] = rows.map((r) => ({
      id: r.id,
      coupleId: r.coupleId,
      actorUserId: r.actorUserId,
      actorName: actorById.get(r.actorUserId) ?? 'Alguém',
      type: r.type,
      targetType: r.targetType,
      targetId: r.targetId,
      metadata: (r.metadata as Record<string, unknown> | null) ?? null,
      createdAt: r.createdAt.toISOString(),
    }));

    const nextCursor =
      rows.length < limit ? null : rows[rows.length - 1].createdAt.toISOString();

    return { items, nextCursor };
  }
}
