import { z } from 'zod';

export const notificationTypeSchema = z.enum([
  'product.added',
  'product.purchased',
  'product.received',
  'milestone.unlocked',
  'partner.joined',
]);

export const notificationSchema = z.object({
  id: z.string().uuid(),
  type: notificationTypeSchema,
  title: z.string(),
  body: z.string(),
  data: z.record(z.string(), z.unknown()).nullable(),
  readAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});

export type NotificationType = z.infer<typeof notificationTypeSchema>;
export type NotificationResponse = z.infer<typeof notificationSchema>;
