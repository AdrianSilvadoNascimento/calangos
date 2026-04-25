import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { CoupleData } from './use-my-couple';

interface UpdateCoupleInput {
  name?: string;
}

export function useUpdateCouple() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateCoupleInput) => {
      const { data } = await api.patch<CoupleData>('/couples/me', input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['couple'] });
    },
  });
}
