import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProfilesModule } from '../profiles/profiles.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { ScrapingModule } from '../scraping/scraping.module';
import { ActivityModule } from '../activity/activity.module';
import { MilestonesModule } from '../milestones/milestones.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    ProfilesModule,
    RealtimeModule,
    ScrapingModule,
    ActivityModule,
    MilestonesModule,
    NotificationsModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
