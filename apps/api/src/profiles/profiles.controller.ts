import { Controller, Get, Patch, Body } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { ProfilesService } from './profiles.service';

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me')
  getMyProfile(@Session() session: UserSession) {
    return this.profilesService.getByUserId(session.user.id);
  }

  @Patch('me')
  updateMyProfile(
    @Body() dto: { displayName?: string; avatarUrl?: string; pushToken?: string },
    @Session() session: UserSession,
  ) {
    return this.profilesService.update(session.user.id, dto);
  }
}
