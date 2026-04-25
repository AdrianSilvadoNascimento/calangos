import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useCoupleMembers(enabled = true) {
  return useQuery<{ count: number }>({
    queryKey: ['couple', 'members'],
    queryFn: async () => {
      const { data } = await api.get<{ count: number }>('/couples/me/members');
      return data;
    },
    enabled,
    retry: false,
  });
}
