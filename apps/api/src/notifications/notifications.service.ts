import { Injectable, Inject, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { and, desc, eq, isNull, lt, sql } from 'drizzle-orm';
import { notifications, profiles } from '@enxoval/db/schema';
import { DB_TOKEN } from '../database/database.module';
import type { DB } from '../database/database.module';
import type { NotificationResponse, NotificationType } from '@enxoval/contracts';
import { PusherService } from '../realtime/pusher.service';
import { PreferencesService } from '../preferences/preferences.service';

interface NotifyContent {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

interface NotifyCoupleOptions {
  /** Skip this user (typically the actor). */
  exceptUserId?: string;
  /** Only notify recipients whose preference toggle is on. */
  respectPreference?: 'notifyOnPartnerAdd' | 'notifyOnStatusChange' | 'notifyOnMilestone';
}

/**
 * Notifications service — in-app DB rows + realtime broadcast.
 * Push (Expo) integration is still Phase 8 — the stub log stays for now.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @Inject(DB_TOKEN) private db: DB,
    private readonly pusherService: PusherService,
    private readonly preferencesService: PreferencesService,
  ) {}

  /**
   * Insert one notification row per couple member (filtered by exceptUserId and
   * preference toggle), then broadcast over Pusher.
   */
  async notifyCouple(
    coupleId: string,
    content: NotifyContent,
    opts: NotifyCoupleOptions = {},
  ) {
    const members = await this.db.query.profiles.findMany({
      where: eq(profiles.coupleId, coupleId),
    });

    const recipients: string[] = [];
    for (const m of members) {
      if (opts.exceptUserId && m.userId === opts.exceptUserId) continue;
      if (opts.respectPreference) {
        const allowed = await this.preferencesService.isNotificationEnabled(
          m.userId,
          coupleId,
          opts.respectPreference,
        );
        if (!allowed) continue;
      }
      recipients.push(m.userId);
    }

    if (recipients.length === 0) return [];

    const rows = await this.db
      .insert(notifications)
      .values(
        recipients.map((userId) => ({
          userId,
          coupleId,
          type: content.type,
          title: content.title,
          body: content.body,
          data: content.data ?? null,
        })),
      )
      .returning();

    for (const row of rows) {
      const payload: NotificationResponse = {
        id: row.id,
        type: row.type,
        title: row.title,
        body: row.body,
        data: (row.data as Record<string, unknown> | null) ?? null,
        readAt: row.readAt ? row.readAt.toISOString() : null,
        createdAt: row.createdAt.toISOString(),
      };
      // Broadcast to the couple channel; clients filter by user_id locally.
      await this.pusherService.broadcast(coupleId, {
        type: 'notification.created',
        payload: { ...payload, userId: row.userId },
      });
    }

    this.logger.log(
      `Notification "${content.title}" sent to ${rows.length} recipient(s) of couple ${coupleId}`,
    );

    return rows;
  }

  /**
   * Backwards-compatible helper used by older code (Phase 6 stub).
   * Forwards to {@link notifyCouple} respecting `notifyOnPartnerAdd`.
   */
  async notifyPartner(
    coupleId: string,
    exceptUserId: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ) {
    return this.notifyCouple(
      coupleId,
      { type: 'product.added', title, body, data },
      { exceptUserId, respectPreference: 'notifyOnPartnerAdd' },
    );
  }

  // ── Read API ─────────────────────────────────────────────

  async listForUser(
    userId: string,
    { limit, cursor }: { limit: number; cursor?: string },
  ): Promise<{ items: NotificationResponse[]; nextCursor: string | null; unreadCount: number }> {
    const cursorDate = cursor ? new Date(cursor) : null;

    const conditions = [eq(notifications.userId, userId)];
    if (cursorDate) conditions.push(lt(notifications.createdAt, cursorDate));

    const rows = await this.db.query.notifications.findMany({
      where: and(...conditions),
      orderBy: desc(notifications.createdAt),
      limit,
    });

    const items: NotificationResponse[] = rows.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      body: r.body,
      data: (r.data as Record<string, unknown> | null) ?? null,
      readAt: r.readAt ? r.readAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
    }));

    const unreadRow = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));

    const nextCursor =
      rows.length < limit ? null : rows[rows.length - 1].createdAt.toISOString();

    return { items, nextCursor, unreadCount: unreadRow[0]?.count ?? 0 };
  }

  async markAsRead(id: string, userId: string) {
    const existing = await this.db.query.notifications.findFirst({
      where: eq(notifications.id, id),
    });
    if (!existing) throw new NotFoundException('Notificação não encontrada');
    if (existing.userId !== userId) throw new ForbiddenException('Não é sua notificação');

    if (existing.readAt) return { read: true };

    await this.db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(eq(notifications.id, id));

    return { read: true };
  }

  async markAllAsRead(userId: string) {
    await this.db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
    return { read: true };
  }
}
