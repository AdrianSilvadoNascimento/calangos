import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { RoomData } from './use-rooms';

interface UpdateRoomInput {
  id: string;
  name?: string;
  icon?: string;
}

export function useUpdateRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: UpdateRoomInput) => {
      const { data } = await api.patch<RoomData>(`/rooms/${id}`, patch);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}
