import { z } from 'zod';

export const createProductSchema = z.object({
  url: z.string().url(),
  roomId: z.string().uuid(),
  title: z.string().optional(),
  priceCents: z.number().int().nonnegative().optional(),
  notes: z.string().max(1000).optional(),
});

export const updateProductSchema = z.object({
  url: z.string().url().optional(),
  title: z.string().optional(),
  roomId: z.string().uuid().optional(),
  status: z.enum(['wishlist', 'purchased', 'received', 'cancelled']).optional(),
  notes: z.string().max(1000).optional(),
});

export const productResponseSchema = z.object({
  id: z.string().uuid(),
  url: z.string().url(),
  title: z.string().nullable(),
  imageUrl: z.string().url().nullable(),
  priceCents: z.number().int().nullable(),
  currency: z.string(),
  storeName: z.string().nullable(),
  status: z.enum(['wishlist', 'purchased', 'received', 'cancelled']),
  roomId: z.string().uuid(),
  addedBy: z.string(),
  createdAt: z.string().datetime(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductResponse = z.infer<typeof productResponseSchema>;
