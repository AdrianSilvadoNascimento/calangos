import { useQuery } from '@tanstack/react-query';
import type { CoupleProgress } from '@enxoval/contracts';
import { api } from '../lib/api';

export function useCoupleProgress(enabled = true) {
  return useQuery<CoupleProgress>({
    queryKey: ['couple-progress'],
    queryFn: async () => {
      const { data } = await api.get<CoupleProgress>('/couples/me/progress');
      return data;
    },
    enabled,
    staleTime: 30_000,
  });
}

export function formatBRL(cents: number, currency = 'BRL'): string {
  const value = (cents / 100).toFixed(2).replace('.', ',');
  if (currency === 'BRL') return `R$ ${value}`;
  return `${currency} ${value}`;
}
