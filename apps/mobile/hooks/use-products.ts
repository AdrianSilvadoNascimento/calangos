import { useInfiniteQuery } from '@tanstack/react-query';
import type { Paginated } from '@enxoval/contracts';
import { api } from '../lib/api';

export interface ProductData {
  id: string;
  roomId: string;
  addedBy: string;
  url: string;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  priceCents: number | null;
  currency: string;
  storeName: string | null;
  status: 'wishlist' | 'purchased' | 'received' | 'cancelled';
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

const PAGE_SIZE = 20;

export function useProducts(filters?: { status?: string; search?: string }) {
  return useInfiniteQuery<Paginated<ProductData>>({
    queryKey: ['products', filters?.status, filters?.search],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      const { data } = await api.get<Paginated<ProductData>>('/products', {
        params: {
          limit: PAGE_SIZE,
          offset: pageParam,
          ...(filters?.status ? { status: filters.status } : {}),
          ...(filters?.search ? { search: filters.search } : {}),
        },
      });
      return data;
    },
    getNextPageParam: (last) => last.nextOffset,
  });
}

export function useRoomProducts(roomId: string | undefined) {
  return useInfiniteQuery<Paginated<ProductData>>({
    queryKey: ['products', 'room', roomId],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      const { data } = await api.get<Paginated<ProductData>>(
        `/rooms/${roomId}/products`,
        { params: { limit: PAGE_SIZE, offset: pageParam } },
      );
      return data;
    },
    getNextPageParam: (last) => last.nextOffset,
    enabled: !!roomId,
  });
}
