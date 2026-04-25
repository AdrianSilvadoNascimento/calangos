import { z } from 'zod';

export const createCoupleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

export const joinCoupleSchema = z.object({
  inviteCode: z.string().length(8),
});

export const sendInviteSchema = z.object({
  email: z.string().email().optional(),
});

export const acceptInviteSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100),
});

export const updateCoupleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

export type CreateCoupleInput = z.infer<typeof createCoupleSchema>;
export type JoinCoupleInput = z.infer<typeof joinCoupleSchema>;
export type SendInviteInput = z.infer<typeof sendInviteSchema>;
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
export type UpdateCoupleInput = z.infer<typeof updateCoupleSchema>;
