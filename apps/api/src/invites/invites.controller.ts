import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { InvitesService } from './invites.service';
import { Public } from '../common/decorators/public.decorator';
import { ZodValidationPipe } from '../common/pipes';
import { acceptInviteSchema } from '@enxoval/contracts';
import type { AcceptInviteInput } from '@enxoval/contracts';

@Controller('invites')
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @Public()
  @Get(':token')
  findByToken(@Param('token') token: string) {
    return this.invitesService.findByToken(token);
  }

  @Public()
  @Post(':token/accept')
  accept(
    @Param('token') token: string,
    @Body(new ZodValidationPipe(acceptInviteSchema)) dto: AcceptInviteInput,
  ) {
    return this.invitesService.accept(token, dto);
  }
}
