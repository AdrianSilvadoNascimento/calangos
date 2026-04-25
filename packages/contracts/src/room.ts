import { z } from 'zod';

export const createRoomSchema = z.object({
  name: z.string().min(1).max(100),
  icon: z.string().max(10).optional(),
});

export const updateRoomSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  icon: z.string().max(10).optional(),
  orderIndex: z.number().int().nonnegative().optional(),
});

export const roomResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  icon: z.string().nullable(),
  orderIndex: z.number(),
  productCount: z.number().optional(),
  createdAt: z.string().datetime(),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
export type RoomResponse = z.infer<typeof roomResponseSchema>;
