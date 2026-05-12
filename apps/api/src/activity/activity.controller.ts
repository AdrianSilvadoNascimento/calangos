import { Controller, Get, Query } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { z } from 'zod';
import { ActivityService } from './activity.service';
import { ProfilesService } from '../profiles/profiles.service';
import { ZodValidationPipe } from '../common/pipes';

const activityQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().datetime().optional(),
});

type ActivityQuery = z.infer<typeof activityQuerySchema>;

@Controller('couples/me')
export class ActivityController {
  constructor(
    private readonly activityService: ActivityService,
    private readonly profilesService: ProfilesService,
  ) {}

  @Get('activity')
  async list(
    @Session() session: UserSession,
    @Query(new ZodValidationPipe(activityQuerySchema)) query: ActivityQuery,
  ) {
    const profile = await this.profilesService.getByUserId(session.user.id);
    if (!profile?.coupleId) {
      return { items: [], nextCursor: null };
    }
    return this.activityService.listForCouple(profile.coupleId, query);
  }
}
