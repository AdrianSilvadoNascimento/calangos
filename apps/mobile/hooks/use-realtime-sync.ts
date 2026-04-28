import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import PusherImport from 'pusher-js/react-native';
import { api } from '../lib/api';
import { clientEnv } from '@enxoval/env/client';

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

    const invalidateAll = () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    };

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

    channel.bind('product.created', invalidateAll);
    channel.bind('product.updated', () =>
      queryClient.invalidateQueries({ queryKey: ['products'] }),
    );
    channel.bind('product.deleted', invalidateAll);

    // Catch up on missed events after Pusher reconnects (e.g. brief network drop).
    // The first 'connected' event fires on initial subscribe — skip that one.
    let connectedOnce = false;
    pusher.connection.bind('connected', () => {
      if (connectedOnce) invalidateAll();
      connectedOnce = true;
    });

    // Catch up on missed events when the app returns to foreground.
    // Android suspends the WebSocket in background; events fired during that
    // window are dropped by Pusher (no replay), so we revalidate on resume.
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') invalidateAll();
    });

    return () => {
      appStateSub.remove();
      channel.unbind_all();
      pusher.connection.unbind_all();
      pusher.unsubscribe(`private-couple-${coupleId}`);
      pusher.disconnect();
    };
  }, [coupleId, queryClient]);
}
