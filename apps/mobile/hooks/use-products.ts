import { useQuery } from '@tanstack/react-query';
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

export function useProducts(filters?: { status?: string; search?: string }) {
  return useQuery<ProductData[]>({
    queryKey: ['products', filters?.status, filters?.search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.search) params.set('search', filters.search);
      const qs = params.toString();
      const { data } = await api.get<ProductData[]>(`/products${qs ? `?${qs}` : ''}`);
      return data ?? [];
    },
  });
}

export function useRoomProducts(roomId: string | undefined) {
  return useQuery<ProductData[]>({
    queryKey: ['products', 'room', roomId],
    queryFn: async () => {
      const { data } = await api.get<ProductData[]>(`/rooms/${roomId}/products`);
      return data ?? [];
    },
    enabled: !!roomId,
  });
}
