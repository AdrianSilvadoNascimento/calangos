import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CouplePreferencesResponse, UpdatePreferencesInput } from '@enxoval/contracts';
import { api } from '../lib/api';

const QUERY_KEY = ['preferences'] as const;

export function usePreferences(enabled = true) {
  return useQuery<CouplePreferencesResponse>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data } = await api.get<CouplePreferencesResponse>('/preferences');
      return data;
    },
    enabled,
    staleTime: 5 * 60_000,
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdatePreferencesInput) => {
      const { data } = await api.patch<CouplePreferencesResponse>('/preferences', input);
      return data;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<CouplePreferencesResponse>(QUERY_KEY);
      if (previous) {
        queryClient.setQueryData<CouplePreferencesResponse>(QUERY_KEY, {
          ...previous,
          ...input,
        });
      }
      return { previous };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(QUERY_KEY, ctx.previous);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEY, data);
    },
  });
}
