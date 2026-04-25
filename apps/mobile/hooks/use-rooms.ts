import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface RoomData {
  id: string;
  name: string;
  icon: string | null;
  orderIndex: number;
  productCount: number;
  createdAt: string;
}

export function useRooms() {
  return useQuery<RoomData[]>({
    queryKey: ['rooms'],
    queryFn: async () => {
      const { data } = await api.get<RoomData[]>('/rooms');
      return data ?? [];
    },
  });
}
