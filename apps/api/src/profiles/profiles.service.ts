import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { profiles } from '@enxoval/db/schema';
import { DB_TOKEN } from '../database/database.module';
import type { DB } from '../database/database.module';

@Injectable()
export class ProfilesService {
  constructor(@Inject(DB_TOKEN) private db: DB) {}

  async getByUserId(userId: string) {
    return this.db.query.profiles.findFirst({
      where: eq(profiles.userId, userId),
    });
  }

  async getByUserIdOrThrow(userId: string) {
    const profile = await this.getByUserId(userId);
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  async update(userId: string, data: { displayName?: string; avatarUrl?: string; pushToken?: string }) {
    const [updated] = await this.db
      .update(profiles)
      .set(data)
      .where(eq(profiles.userId, userId))
      .returning();

    if (!updated) {
      throw new NotFoundException('Profile not found');
    }

    return updated;
  }
}
