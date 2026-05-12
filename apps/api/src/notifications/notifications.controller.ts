import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { z } from 'zod';
import { NotificationsService } from './notifications.service';
import { ZodValidationPipe } from '../common/pipes';

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().datetime().optional(),
});

type ListQuery = z.infer<typeof listQuerySchema>;

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(
    @Session() session: UserSession,
    @Query(new ZodValidationPipe(listQuerySchema)) query: ListQuery,
  ) {
    return this.notificationsService.listForUser(session.user.id, query);
  }

  @Post(':id/read')
  markRead(@Param('id') id: string, @Session() session: UserSession) {
    return this.notificationsService.markAsRead(id, session.user.id);
  }

  @Post('read-all')
  markAllRead(@Session() session: UserSession) {
    return this.notificationsService.markAllAsRead(session.user.id);
  }
}
