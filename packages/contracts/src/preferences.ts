import { z } from 'zod';

export const couplePreferencesSchema = z.object({
  notificationsEnabled: z.boolean(),
  notifyOnPartnerAdd: z.boolean(),
  notifyOnStatusChange: z.boolean(),
  notifyOnMilestone: z.boolean(),
  detectLinksEnabled: z.boolean(),
});

export const updatePreferencesSchema = couplePreferencesSchema.partial();

export type CouplePreferencesResponse = z.infer<typeof couplePreferencesSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
