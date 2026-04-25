import { Injectable, Logger } from '@nestjs/common';
import Pusher from 'pusher';
import { serverEnv } from '@enxoval/env/server';

export interface AppEvent {
  type: string;
  payload: unknown;
}

@Injectable()
export class PusherService {
  private readonly logger = new Logger(PusherService.name);
  private readonly pusher: Pusher;

  constructor() {
    this.pusher = new Pusher({
      appId: serverEnv.PUSHER_APP_ID,
      key: serverEnv.PUSHER_KEY,
      secret: serverEnv.PUSHER_SECRET,
      cluster: serverEnv.PUSHER_CLUSTER,
      useTLS: true,
    });
  }

  authorizeChannel(socketId: string, channel: string) {
    return this.pusher.authorizeChannel(socketId, channel);
  }

  async broadcast(coupleId: string, event: AppEvent, excludeSocketId?: string) {
    const channel = `private-couple-${coupleId}`;
    try {
      await this.pusher.trigger(channel, event.type, event.payload, {
        socket_id: excludeSocketId,
      });
    } catch (err) {
      this.logger.error(`Failed to broadcast ${event.type} to ${channel}`, err);
    }
  }
}

