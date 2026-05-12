import { useCallback } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { NotificationResponse, NotificationType } from '@enxoval/contracts';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '../../hooks/use-notifications';
import { formatRelativeTime } from '../../lib/format-time';
import { InfiniteList } from '../../components/infinite-list';
import { Icon, LinkButton, type IconName, type IconTone } from '../../components/ui';

const META: Record<NotificationType, { icon: IconName; tone: IconTone }> = {
  'product.added':     { icon: 'sparkles',      tone: 'brand' },
  'product.purchased': { icon: 'shopping-cart', tone: 'sky' },
  'product.received':  { icon: 'package-check', tone: 'brand' },
  'milestone.unlocked':{ icon: 'trophy',        tone: 'amber' },
  'partner.joined':    { icon: 'heart',         tone: 'coral' },
};

type DeepLink =
  | { pathname: '/(app)/room/[id]'; params: { id: string; highlight?: string } }
  | { pathname: '/(app)/products'; params: { highlight: string } }
  | { pathname: '/(app)/casal' }
  | null;

function resolveDeepLink(n: NotificationResponse): DeepLink {
  const data = (n.data ?? {}) as Record<string, unknown>;
  const productId = typeof data.productId === 'string' ? data.productId : undefined;
  const roomId = typeof data.roomId === 'string' ? data.roomId : undefined;

  switch (n.type) {
    case 'product.added':
    case 'product.purchased':
    case 'product.received':
      if (roomId) return { pathname: '/(app)/room/[id]', params: { id: roomId, highlight: productId } };
      if (productId) return { pathname: '/(app)/products', params: { highlight: productId } };
      return null;
    case 'milestone.unlocked':
    case 'partner.joined':
      return { pathname: '/(app)/casal' };
    default:
      return null;
  }
}

function NotificationCard({
  notification,
  onPress,
}: {
  notification: NotificationResponse;
  onPress: () => void;
}) {
  const meta = META[notification.type];
  const unread = !notification.readAt;

  return (
    <Pressable
      onPress={onPress}
      className="bg-bg-2 border border-line-1 rounded-2xl p-4 mb-3 active:bg-bg-3"
    >
      <View className="flex-row items-start" style={{ gap: 12 }}>
        <View
          className="rounded-full items-center justify-center"
          style={{ width: 40, height: 40, backgroundColor: '#18372C' }}
        >
          <Icon name={meta.icon} tone={meta.tone} size={20} />
        </View>

        <View className="flex-1">
          <View className="flex-row items-center" style={{ gap: 8 }}>
            <Text className="text-ink-1 font-semibold text-sm flex-1" numberOfLines={1}>
              {notification.title}
            </Text>
            {unread && (
              <View
                className="rounded-full bg-coral"
                style={{ width: 8, height: 8 }}
              />
            )}
          </View>
          <Text className="text-ink-2 text-sm mt-0.5" numberOfLines={2}>
            {notification.body}
          </Text>
          <Text className="text-ink-4 text-xs mt-1">
            {formatRelativeTime(notification.createdAt)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const query = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = query.data?.pages[0]?.unreadCount ?? 0;

  const handleOpen = useCallback(
    (n: NotificationResponse) => {
      if (!n.readAt) markRead.mutate(n.id);

      const link = resolveDeepLink(n);
      if (!link) return;
      // expo-router types are a bit too narrow here for our string union routes.
      router.push(link as any);
    },
    [markRead, router],
  );

  const ListHeader = (
    <View className="pb-4">
      <Text
        className="text-ink-3 text-[11px] font-semibold mb-1"
        style={{ letterSpacing: 1.6, textTransform: 'uppercase' }}
      >
        Avisos do enxoval
      </Text>
      <Text className="text-ink-1 text-2xl font-bold" style={{ letterSpacing: -0.5 }}>
        Notificações
      </Text>
      {unreadCount > 0 && (
        <Text className="text-ink-3 text-sm mt-1">
          {unreadCount === 1 ? '1 não lida ♥' : `${unreadCount} não lidas ♥`}
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-bg-1">
      <View className="px-6 pt-2 flex-row items-center justify-between">
        <LinkButton leftIcon="arrow-left" label="Voltar" onPress={() => router.back()} />
        {unreadCount > 0 && (
          <Pressable
            onPress={() => markAllRead.mutate()}
            hitSlop={8}
            className="active:opacity-70 py-2"
          >
            <Text className="text-brand-400 font-semibold text-sm">Marcar todas</Text>
          </Pressable>
        )}
      </View>

      <InfiniteList<NotificationResponse>
        query={query}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
        ListHeaderComponent={ListHeader}
        emptyTitle="Nenhum aviso por aqui"
        emptySubtitle={'Quando rolar atividade no enxoval,\nvocês vão saber primeiro'}
        emptyMascot="juntos"
        renderItem={({ item }) => (
          <NotificationCard notification={item} onPress={() => handleOpen(item)} />
        )}
      />
    </SafeAreaView>
  );
}
