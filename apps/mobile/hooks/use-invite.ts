import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface InviteData {
  token: string;
  email: string | null;
  expiresAt: string;
  link: string;
}

export interface InviteInfo {
  coupleId: string;
  coupleName: string | null;
  email: string | null;
  expired: boolean;
  used: boolean;
}

export function useCreateInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (email?: string) => {
      const { data } = await api.post<InviteData>('/couples/invite', {
        email: email || undefined,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['couple', 'members'] });
    },
  });
}

export function useInviteInfo(token: string | undefined) {
  return useQuery<InviteInfo>({
    queryKey: ['invite', token],
    queryFn: async () => {
      const { data } = await api.get<InviteInfo>(`/invites/${token}`);
      return data;
    },
    enabled: !!token,
    retry: false,
  });
}

export function useAcceptInvite() {
  return useMutation({
    mutationFn: async (args: {
      token: string;
      email: string;
      password: string;
      name: string;
    }) => {
      const { data } = await api.post<{ userId: string; coupleId: string }>(
        `/invites/${args.token}/accept`,
        { email: args.email, password: args.password, name: args.name },
      );
      return data;
    },
  });
}
