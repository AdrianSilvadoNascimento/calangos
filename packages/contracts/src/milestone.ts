import { z } from 'zod';

export const milestoneTypeSchema = z.enum([
  'items_10',
  'items_25',
  'items_50',
  'items_100',
  'first_purchased',
  'first_received',
  'room_50_percent',
  'room_100_percent',
  'partner_joined',
]);

export const milestoneSchema = z.object({
  id: z.string().uuid(),
  type: milestoneTypeSchema,
  scopeId: z.string(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  unlockedAt: z.string().datetime(),
});

export const upcomingMilestoneSchema = z.object({
  type: milestoneTypeSchema,
  scopeId: z.string(),
  /** Optional human label snapshot (e.g. room name for room_X_percent). */
  scopeLabel: z.string().nullable(),
  /** 0-100 progress toward unlocking. */
  percent: z.number().min(0).max(100),
  /** Free-form copy hint for the UI ("faltam 3 itens"). */
  hint: z.string(),
});

export const milestonesResponseSchema = z.object({
  unlocked: z.array(milestoneSchema),
  upcoming: z.array(upcomingMilestoneSchema),
});

export type MilestoneType = z.infer<typeof milestoneTypeSchema>;
export type MilestoneResponse = z.infer<typeof milestoneSchema>;
export type UpcomingMilestone = z.infer<typeof upcomingMilestoneSchema>;
export type MilestonesResponse = z.infer<typeof milestonesResponseSchema>;
