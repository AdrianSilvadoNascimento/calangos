import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { NotificationResponse } from '@enxoval/contracts';
import { api } from '../lib/api';

interface NotificationsPage {
  items: NotificationResponse[];
  nextCursor: string | null;
  unreadCount: number;
}

const QUERY_KEY = ['notifications'] as const;
const PAGE_SIZE = 20;

export function useNotifications(enabled = true) {
  return useInfiniteQuery<NotificationsPage>({
    queryKey: QUERY_KEY,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get<NotificationsPage>('/notifications', {
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

/** Convenience: read the unread badge count from the first page. */
export function useUnreadCount(): number {
  const q = useNotifications();
  return q.data?.pages[0]?.unreadCount ?? 0;
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<{ read: true }>(`/notifications/${id}/read`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ read: true }>('/notifications/read-all');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
