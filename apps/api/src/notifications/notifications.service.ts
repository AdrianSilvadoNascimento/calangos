import { Injectable, Logger } from '@nestjs/common';

/**
 * Notifications service stub — full implementation in Phase 8.
 * Will use expo-server-sdk to send push notifications via Expo Push Service.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  async notifyPartner(
    coupleId: string,
    exceptUserId: string,
    title: string,
    body: string,
    data?: object,
  ) {
    // TODO: Phase 8 — implement with Expo Push Service
    this.logger.log(`Push stub: "${title}" to partner in couple ${coupleId}`);
  }
}
