import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface CoupleData {
  id: string;
  name: string;
  inviteCode: string;
  createdAt: string;
}

export function useMyCouple(enabled = true) {
  return useQuery<CoupleData | null>({
    queryKey: ['couple'],
    queryFn: async () => {
      try {
        const { data } = await api.get<CoupleData>('/couples/me');
        return data || null;
      } catch (err: any) {
        if (err?.response?.status === 404) return null;
        throw err;
      }
    },
    enabled,
    retry: false,
  });
}
