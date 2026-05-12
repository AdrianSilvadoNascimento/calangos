import { z } from 'zod';

export const progressByStatusSchema = z.object({
  wishlist: z.number().int().nonnegative(),
  purchased: z.number().int().nonnegative(),
  received: z.number().int().nonnegative(),
  cancelled: z.number().int().nonnegative(),
});

export const progressByRoomSchema = z.object({
  roomId: z.string().uuid(),
  name: z.string(),
  icon: z.string().nullable(),
  total: z.number().int().nonnegative(),
  received: z.number().int().nonnegative(),
  percentReceived: z.number().min(0).max(100),
});

export const coupleProgressSchema = z.object({
  totalItems: z.number().int().nonnegative(),
  totalPlannedCents: z.number().int().nonnegative(),
  currency: z.string(),
  byStatus: progressByStatusSchema,
  byRoom: z.array(progressByRoomSchema),
  /** received / (total - cancelled), rounded to whole percent. */
  percentReceived: z.number().min(0).max(100),
});

export type ProgressByStatus = z.infer<typeof progressByStatusSchema>;
export type ProgressByRoom = z.infer<typeof progressByRoomSchema>;
export type CoupleProgress = z.infer<typeof coupleProgressSchema>;
