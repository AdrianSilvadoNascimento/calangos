import { useInfiniteQuery } from '@tanstack/react-query';
import type { ActivityEventResponse } from '@enxoval/contracts';
import { api } from '../lib/api';

interface ActivityPage {
  items: ActivityEventResponse[];
  nextCursor: string | null;
}

const PAGE_SIZE = 20;

export function useCoupleActivity(enabled = true) {
  return useInfiniteQuery<ActivityPage>({
    queryKey: ['couple-activity'],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get<ActivityPage>('/couples/me/activity', {
        params: {
          limit: PAGE_SIZE,
          ...(pageParam ? { cursor: pageParam } : {}),
        },
      });
      return data;
    },
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled,
  });
}
