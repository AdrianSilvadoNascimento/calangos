import {
  Controller,
  Post,
  Body,
  ForbiddenException,
} from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { PusherService } from './pusher.service';
import { ProfilesService } from '../profiles/profiles.service';

@Controller('pusher')
export class RealtimeController {
  constructor(
    private readonly pusherService: PusherService,
    private readonly profilesService: ProfilesService,
  ) {}

  @Post('auth')
  async auth(
    @Body() body: { socket_id: string; channel_name: string },
    @Session() session: UserSession,
  ) {
    const profile = await this.profilesService.getByUserId(session.user.id);
    if (!profile?.coupleId) throw new ForbiddenException('No couple linked');

    const expectedChannel = `private-couple-${profile.coupleId}`;
    if (body.channel_name !== expectedChannel) {
      throw new ForbiddenException('Channel not authorized');
    }

    return this.pusherService.authorizeChannel(body.socket_id, body.channel_name);
  }
}
