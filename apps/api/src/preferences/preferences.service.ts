import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { couplePreferences, profiles } from '@enxoval/db/schema';
import { DB_TOKEN } from '../database/database.module';
import type { DB } from '../database/database.module';
import type { CouplePreferencesResponse, UpdatePreferencesInput } from '@enxoval/contracts';

const DEFAULTS: CouplePreferencesResponse = {
  notificationsEnabled: true,
  notifyOnPartnerAdd: true,
  notifyOnStatusChange: true,
  notifyOnMilestone: true,
  detectLinksEnabled: true,
};

@Injectable()
export class PreferencesService {
  constructor(@Inject(DB_TOKEN) private db: DB) {}

  async getOrInit(userId: string, coupleId: string): Promise<CouplePreferencesResponse> {
    const existing = await this.db.query.couplePreferences.findFirst({
      where: and(
        eq(couplePreferences.userId, userId),
        eq(couplePreferences.coupleId, coupleId),
      ),
    });

    if (existing) {
      return {
        notificationsEnabled: existing.notificationsEnabled,
        notifyOnPartnerAdd: existing.notifyOnPartnerAdd,
        notifyOnStatusChange: existing.notifyOnStatusChange,
        notifyOnMilestone: existing.notifyOnMilestone,
        detectLinksEnabled: existing.detectLinksEnabled,
      };
    }

    return DEFAULTS;
  }

  async getForUser(userId: string): Promise<CouplePreferencesResponse | null> {
    const profile = await this.db.query.profiles.findFirst({
      where: eq(profiles.userId, userId),
    });
    if (!profile?.coupleId) return null;
    return this.getOrInit(userId, profile.coupleId);
  }

  async updateForUser(
    userId: string,
    dto: UpdatePreferencesInput,
  ): Promise<CouplePreferencesResponse> {
    const profile = await this.db.query.profiles.findFirst({
      where: eq(profiles.userId, userId),
    });
    if (!profile?.coupleId) throw new NotFoundException('No couple linked');

    const current = await this.getOrInit(userId, profile.coupleId);
    const merged = { ...current, ...dto };

    await this.db
      .insert(couplePreferences)
      .values({
        userId,
        coupleId: profile.coupleId,
        ...merged,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [couplePreferences.userId, couplePreferences.coupleId],
        set: { ...merged, updatedAt: new Date() },
      });

    return merged;
  }

  /**
   * Returns true if the given user has the requested preference enabled (or the
   * master `notificationsEnabled`). Defaults to `true` if no row exists yet.
   */
  async isNotificationEnabled(
    userId: string,
    coupleId: string,
    pref: 'notifyOnPartnerAdd' | 'notifyOnStatusChange' | 'notifyOnMilestone',
  ): Promise<boolean> {
    const row = await this.db.query.couplePreferences.findFirst({
      where: and(
        eq(couplePreferences.userId, userId),
        eq(couplePreferences.coupleId, coupleId),
      ),
    });
    if (!row) return true;
    if (!row.notificationsEnabled) return false;
    return row[pref];
  }
}
