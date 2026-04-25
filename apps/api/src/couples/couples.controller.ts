import { Controller, Post, Get, Patch, Body, NotFoundException } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { CouplesService } from './couples.service';
import { InvitesService } from '../invites/invites.service';
import { ZodValidationPipe } from '../common/pipes';
import {
  createCoupleSchema,
  joinCoupleSchema,
  sendInviteSchema,
  updateCoupleSchema,
} from '@enxoval/contracts';
import type {
  CreateCoupleInput,
  JoinCoupleInput,
  SendInviteInput,
  UpdateCoupleInput,
} from '@enxoval/contracts';

@Controller('couples')
export class CouplesController {
  constructor(
    private readonly couplesService: CouplesService,
    private readonly invitesService: InvitesService,
  ) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(createCoupleSchema)) dto: CreateCoupleInput,
    @Session() session: UserSession,
  ) {
    return this.couplesService.create(dto, session.user.id, session.user.name ?? '');
  }

  @Post('join')
  join(
    @Body(new ZodValidationPipe(joinCoupleSchema)) dto: JoinCoupleInput,
    @Session() session: UserSession,
  ) {
    return this.couplesService.join(dto, session.user.id);
  }

  @Get('me')
  async getMyCouple(@Session() session: UserSession) {
    const couple = await this.couplesService.findByUserId(session.user.id);
    if (!couple) throw new NotFoundException('No couple linked');
    return couple;
  }

  @Patch('me')
  updateMyCouple(
    @Body(new ZodValidationPipe(updateCoupleSchema)) dto: UpdateCoupleInput,
    @Session() session: UserSession,
  ) {
    return this.couplesService.updateByUserId(session.user.id, dto);
  }

  @Get('me/members')
  async getMemberCount(@Session() session: UserSession) {
    const couple = await this.couplesService.findByUserId(session.user.id);
    if (!couple) return { count: 0 };
    const count = await this.couplesService.countMembers(couple.id);
    return { count };
  }

  @Post('invite')
  createInvite(
    @Body(new ZodValidationPipe(sendInviteSchema)) dto: SendInviteInput,
    @Session() session: UserSession,
  ) {
    return this.invitesService.createForUser(session.user.id, dto.email);
  }
}
