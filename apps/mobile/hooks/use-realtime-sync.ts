import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import PusherImport from 'pusher-js/react-native';
import { api } from '../lib/api';
import { clientEnv } from '@enxoval/env/dist/client';

// Handle ESM default export: pusher-js v8 may export { default: Pusher }
const Pusher = (typeof (PusherImport as any).default === 'function'
  ? (PusherImport as any).default
  : PusherImport) as typeof PusherImport;

const PUSHER_KEY = clientEnv.EXPO_PUBLIC_PUSHER_KEY;
const PUSHER_CLUSTER = clientEnv.EXPO_PUBLIC_PUSHER_CLUSTER;

export function useRealtimeSync(coupleId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!coupleId || !PUSHER_KEY || !PUSHER_CLUSTER) return;

    let pusher: InstanceType<typeof Pusher>;
    try {
      pusher = new Pusher(PUSHER_KEY, {
        cluster: PUSHER_CLUSTER,
        forceTLS: true,
        channelAuthorization: {
          transport: 'ajax',
          endpoint: '',
          customHandler: async ({ socketId, channelName }, callback) => {
            try {
              const { data } = await api.post('/pusher/auth', {
                socket_id: socketId,
                channel_name: channelName,
              });
              callback(null, data);
            } catch (err) {
              callback(err as Error, null);
            }
          },
        },
      });
    } catch (err) {
      console.warn('[realtime] Failed to initialize Pusher:', err);
      return;
    }

    const channel = pusher.subscribe(`private-couple-${coupleId}`);

    const invalidateProducts = () =>
      queryClient.invalidateQueries({ queryKey: ['products'] });
    const invalidateRooms = () =>
      queryClient.invalidateQueries({ queryKey: ['rooms'] });

    channel.bind('product.created', () => {
      invalidateProducts();
      invalidateRooms();
    });
    channel.bind('product.updated', invalidateProducts);
    channel.bind('product.deleted', () => {
      invalidateProducts();
      invalidateRooms();
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`private-couple-${coupleId}`);
      pusher.disconnect();
    };
  }, [coupleId, queryClient]);
}
