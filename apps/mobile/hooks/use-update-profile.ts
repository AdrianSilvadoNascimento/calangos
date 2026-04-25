import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authClient } from '@enxoval/auth-client';
import { api } from '../lib/api';

interface UpdateProfileInput {
  displayName?: string;
  avatarUrl?: string;
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      if (input.displayName !== undefined) {
        const { error } = await authClient.updateUser({ name: input.displayName });
        if (error) throw new Error(error.message ?? 'Falha ao atualizar nome');
      }
      const { data } = await api.patch('/profiles/me', input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['couple', 'members'] });
    },
  });
}
