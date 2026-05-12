import { z } from 'zod';

export const activityTypeSchema = z.enum([
  'product.added',
  'product.purchased',
  'product.received',
  'product.cancelled',
  'product.wishlisted',
  'room.created',
  'milestone.unlocked',
  'partner.joined',
]);

export const activityTargetSchema = z.enum(['product', 'room', 'milestone', 'couple']);

export const activityEventSchema = z.object({
  id: z.string().uuid(),
  coupleId: z.string().uuid(),
  actorUserId: z.string(),
  actorName: z.string(),
  type: activityTypeSchema,
  targetType: activityTargetSchema,
  targetId: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.string().datetime(),
});

export type ActivityType = z.infer<typeof activityTypeSchema>;
export type ActivityTarget = z.infer<typeof activityTargetSchema>;
export type ActivityEventResponse = z.infer<typeof activityEventSchema>;
