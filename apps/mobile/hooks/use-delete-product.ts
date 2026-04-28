import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation<{ deleted: true }, unknown, string>({
    mutationFn: async (id) => {
      const { data } = await api.delete<{ deleted: true }>(`/products/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}
