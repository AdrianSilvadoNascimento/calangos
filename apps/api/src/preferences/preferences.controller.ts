import { Body, Controller, Get, Patch } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { PreferencesService } from './preferences.service';
import { ZodValidationPipe } from '../common/pipes';
import { updatePreferencesSchema } from '@enxoval/contracts';
import type { UpdatePreferencesInput } from '@enxoval/contracts';

@Controller('preferences')
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Get()
  async get(@Session() session: UserSession) {
    const prefs = await this.preferencesService.getForUser(session.user.id);
    if (!prefs) {
      // Defaults sem couple — front pode usar pra UX antes do onboarding terminar.
      return {
        notificationsEnabled: true,
        notifyOnPartnerAdd: true,
        notifyOnStatusChange: true,
        notifyOnMilestone: true,
        detectLinksEnabled: true,
      };
    }
    return prefs;
  }

  @Patch()
  update(
    @Session() session: UserSession,
    @Body(new ZodValidationPipe(updatePreferencesSchema)) dto: UpdatePreferencesInput,
  ) {
    return this.preferencesService.updateForUser(session.user.id, dto);
  }
}
