import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import type { Paginated } from '@enxoval/contracts';
import { api } from '../lib/api';

export interface RoomData {
  id: string;
  name: string;
  icon: string | null;
  orderIndex: number;
  productCount: number;
  createdAt: string;
}

const PAGE_SIZE = 20;

export function useRooms() {
  return useInfiniteQuery<Paginated<RoomData>>({
    queryKey: ['rooms'],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      const { data } = await api.get<Paginated<RoomData>>('/rooms', {
        params: { limit: PAGE_SIZE, offset: pageParam },
      });
      return data;
    },
    getNextPageParam: (last) => last.nextOffset,
  });
}

export function useRoom(id: string | undefined) {
  return useQuery<RoomData>({
    queryKey: ['rooms', 'one', id],
    queryFn: async () => {
      const { data } = await api.get<RoomData>(`/rooms/${id}`);
      return data;
    },
    enabled: !!id,
  });
}
