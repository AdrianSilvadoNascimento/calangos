import { Module } from '@nestjs/common';
import { RealtimeController } from './realtime.controller';
import { PusherService } from './pusher.service';
import { ProfilesModule } from '../profiles/profiles.module';

@Module({
  imports: [ProfilesModule],
  controllers: [RealtimeController],
  providers: [PusherService],
  exports: [PusherService],
})
export class RealtimeModule {}
