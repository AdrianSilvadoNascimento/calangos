import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface CoupleMember {
  userId: string;
  name: string;
}

export function useCoupleMembers(enabled = true) {
  return useQuery<{ count: number; members: CoupleMember[] }>({
    queryKey: ['couple', 'members'],
    queryFn: async () => {
      const { data } = await api.get<{ count: number; members: CoupleMember[] }>('/couples/me/members');
      return data;
    },
    enabled,
    retry: false,
  });
}
