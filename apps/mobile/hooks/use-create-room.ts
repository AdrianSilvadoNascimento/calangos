import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { RoomData } from './use-rooms';

interface CreateRoomInput {
  name: string;
  icon?: string;
}

export function useCreateRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateRoomInput) => {
      const { data } = await api.post<RoomData>('/rooms', input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}
