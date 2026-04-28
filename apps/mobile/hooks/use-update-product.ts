import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdateProductInput } from '@enxoval/contracts';
import { api } from '../lib/api';
import type { ProductData } from './use-products';

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation<ProductData, unknown, { id: string; dto: UpdateProductInput }>({
    mutationFn: async ({ id, dto }) => {
      const { data } = await api.patch<ProductData>(`/products/${id}`, dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
