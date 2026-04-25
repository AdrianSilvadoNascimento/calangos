import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule, AuthGuard } from '@thallesp/nestjs-better-auth';
import { auth } from './auth/auth';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { CouplesModule } from './couples/couples.module';
import { InvitesModule } from './invites/invites.module';
import { ProfilesModule } from './profiles/profiles.module';
import { RoomsModule } from './rooms/rooms.module';
import { ProductsModule } from './products/products.module';
import { ScrapingModule } from './scraping/scraping.module';
import { RealtimeModule } from './realtime/realtime.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    AuthModule.forRoot({ auth }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    DatabaseModule,
    HealthModule,
    CouplesModule,
    InvitesModule,
    ProfilesModule,
    RoomsModule,
    ProductsModule,
    ScrapingModule,
    RealtimeModule,
    NotificationsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
