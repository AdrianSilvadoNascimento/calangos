import { useQuery } from '@tanstack/react-query';
import type { MilestonesResponse } from '@enxoval/contracts';
import { api } from '../lib/api';

export function useCoupleMilestones(enabled = true) {
  return useQuery<MilestonesResponse>({
    queryKey: ['couple-milestones'],
    queryFn: async () => {
      const { data } = await api.get<MilestonesResponse>('/couples/me/milestones');
      return data;
    },
    enabled,
    staleTime: 60_000,
  });
}
