import { Controller, Get } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { MilestonesService } from './milestones.service';
import { ProfilesService } from '../profiles/profiles.service';

@Controller('couples/me')
export class MilestonesController {
  constructor(
    private readonly milestonesService: MilestonesService,
    private readonly profilesService: ProfilesService,
  ) {}

  @Get('milestones')
  async list(@Session() session: UserSession) {
    const profile = await this.profilesService.getByUserId(session.user.id);
    if (!profile?.coupleId) return { unlocked: [], upcoming: [] };
    return this.milestonesService.listForCouple(profile.coupleId);
  }
}
