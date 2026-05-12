import { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useQueryClient } from '@tanstack/react-query';
import { authClient } from '@enxoval/auth-client';
import { useMyCouple } from '../../../hooks/use-my-couple';
import { useCoupleMembers } from '../../../hooks/use-couple-members';
import { useCoupleProgress } from '../../../hooks/use-couple-progress';
import { useCoupleActivity } from '../../../hooks/use-couple-activity';
import { useCoupleMilestones } from '../../../hooks/use-couple-milestones';
import { useUnreadCount } from '../../../hooks/use-notifications';
import { reportError } from '../../../lib/report-error';
import { formatRelativeTime } from '../../../lib/format-time';
import {
  ActivityRow,
  Avatar,
  Button,
  Card,
  Icon,
  Mascot,
  useDialog,
} from '../../../components/ui';

const HTTP_URL = /^(https?:\/\/)/i;

function progressCopy(percent: number): string {
  if (percent >= 100) return 'Conquistaram tudo 🎉';
  if (percent >= 50) return 'Quase lá! 🦎';
  if (percent >= 5) return 'Vocês estão indo bem 💍';
  return 'Comecem juntinhos 💍';
}

export default function InicioScreen() {
  const router = useRouter();
  const dialog = useDialog();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const { data: couple } = useMyCouple();
  const { data: members } = useCoupleMembers();
  const { data: progress } = useCoupleProgress();
  const activityQuery = useCoupleActivity();
  const { data: milestones } = useCoupleMilestones();
  const unreadCount = useUnreadCount();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['couple'] }),
        queryClient.refetchQueries({ queryKey: ['couple-progress'] }),
        queryClient.refetchQueries({ queryKey: ['couple-activity'] }),
        queryClient.refetchQueries({ queryKey: ['couple-milestones'] }),
        queryClient.refetchQueries({ queryKey: ['notifications'] }),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  const m = (members as any)?.members ?? [];
  const me = m.find((mb: any) => mb.userId === session?.user?.id);
  const myName = me?.name ?? session?.user?.name ?? 'você';
  const partner = m.find((mb: any) => mb.userId !== session?.user?.id);
  const partnerName = partner?.name;
  const hasPartner = !!partnerName;

  const partnerById = new Map<string, { name: string; isMe: boolean }>();
  for (const mb of m) {
    partnerById.set(mb.userId, {
      name: mb.name ?? 'Alguém',
      isMe: mb.userId === session?.user?.id,
    });
  }

  const hour = new Date().getHours();
  let greeting = 'Boa noite';
  if (hour >= 5 && hour < 12) greeting = 'Bom dia';
  else if (hour >= 12 && hour < 18) greeting = 'Boa tarde';
  const greetingText = `${greeting}, ${hasPartner ? 'calanguinhos' : 'calanguinho'}`;

  const percent = progress?.percentReceived ?? 0;
  const recentActivity = activityQuery.data?.pages.flatMap((p) => p.items).slice(0, 5) ?? [];
  const upcomingMilestones = milestones?.upcoming ?? [];

  const handlePasteLink = async () => {
    try {
      const text = (await Clipboard.getStringAsync())?.trim();
      if (!text || !HTTP_URL.test(text)) {
        await dialog.alert({
          title: 'Clipboard vazio',
          message: 'Copie um link de produto antes de tocar em Colar.',
        });
        return;
      }
      router.push(`/(app)/add-product?url=${encodeURIComponent(text)}`);
    } catch (err: any) {
      reportError(err, { action: 'clipboard.read' });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-1">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#5FCB8B"
            colors={['#5FCB8B']}
          />
        }
      >
        {/* Header */}
        <View className="px-6 pt-6 pb-2 flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 pr-4">
            <View className="flex-row items-center mr-3">
              <Avatar
                name={myName}
                variant="brand"
                size={44}
                className="z-10 border-2 border-bg-1"
              />
              {hasPartner && (
                <Avatar name={partnerName} variant="coral" size={44} className="-ml-3 z-0" />
              )}
            </View>

            <View className="flex-1">
              <Text className="text-ink-3 text-xs mb-0.5">{greetingText}</Text>
              <Text
                className="text-ink-1 text-lg font-bold"
                style={{ letterSpacing: -0.5 }}
                numberOfLines={1}
              >
                {couple?.name ?? 'Nosso enxoval'}
              </Text>
            </View>
          </View>

          {/* Bell */}
          <Pressable
            onPress={() => router.push('/(app)/notifications' as any)}
            className="w-11 h-11 rounded-full bg-bg-2 border border-line-1 items-center justify-center relative active:opacity-70"
            accessibilityRole="button"
            accessibilityLabel={
              unreadCount > 0 ? `${unreadCount} notificações novas` : 'Notificações'
            }
          >
            <Icon name="bell" tone="ink-3" size={20} outline />
            {unreadCount > 0 && (
              <View
                className="absolute rounded-full bg-coral border border-bg-2 items-center justify-center"
                style={{ top: 6, right: 6, minWidth: 16, height: 16, paddingHorizontal: 4 }}
              >
                <Text className="text-[10px] font-bold" style={{ color: '#3D1F18' }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Hero card de progresso */}
        <Card className="mx-6 mt-6" padding="lg">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-1 mr-4">
              <Text
                className="text-ink-3 text-[11px] font-semibold mb-1"
                style={{ letterSpacing: 1.6, textTransform: 'uppercase' }}
              >
                Progresso geral
              </Text>
              <Text className="text-ink-1 text-xl font-bold">{progressCopy(percent)}</Text>
            </View>
            <View
              className="rounded-full items-center justify-center border-2 border-brand-500"
              style={{ width: 56, height: 56, backgroundColor: '#34B26C1A' }}
            >
              <Text className="text-brand-400 font-bold text-sm">{percent}%</Text>
            </View>
          </View>
          <View className="h-1.5 bg-bg-4 rounded-full overflow-hidden">
            <View
              className="h-full bg-brand-500 rounded-full"
              style={{ width: `${percent}%` }}
            />
          </View>
          <Text className="text-ink-3 text-xs mt-2">
            {progress?.totalItems
              ? `${progress.byStatus.received} de ${progress.totalItems - progress.byStatus.cancelled} recebidos`
              : 'Adicione itens nos cômodos para acompanhar aqui'}
          </Text>
        </Card>

        {/* Quick actions */}
        <View className="px-6 mt-6">
          <Text
            className="text-ink-3 text-[11px] font-semibold mb-3"
            style={{ letterSpacing: 1.6, textTransform: 'uppercase' }}
          >
            Ações rápidas
          </Text>
          <View className="flex-row" style={{ gap: 12 }}>
            <Pressable
              onPress={handlePasteLink}
              className="flex-1 bg-bg-2 border border-line-1 rounded-2xl p-4 items-center active:bg-bg-3"
            >
              <View
                className="rounded-xl items-center justify-center mb-2"
                style={{ width: 40, height: 40, backgroundColor: '#34B26C1F' }}
              >
                <Icon name="link" tone="brand" size={20} />
              </View>
              <Text className="text-ink-1 font-semibold text-xs text-center">Colar link</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/(app)/' as any)}
              className="flex-1 bg-bg-2 border border-line-1 rounded-2xl p-4 items-center active:bg-bg-3"
            >
              <View
                className="rounded-xl items-center justify-center mb-2"
                style={{ width: 40, height: 40, backgroundColor: '#E897841F' }}
              >
                <Icon name="plus" tone="coral" size={20} />
              </View>
              <Text className="text-ink-1 font-semibold text-xs text-center">Novo cômodo</Text>
            </Pressable>
          </View>
        </View>

        {/* Mini feed de atividade */}
        <View className="px-6 mt-6">
          <Text
            className="text-ink-3 text-[11px] font-semibold mb-3"
            style={{ letterSpacing: 1.6, textTransform: 'uppercase' }}
          >
            Atividade recente
          </Text>
          {recentActivity.length > 0 ? (
            <Card padding="sm">
              {recentActivity.map((event) => {
                const actor = partnerById.get(event.actorUserId);
                const actorVariant: 'brand' | 'coral' = actor?.isMe ? 'brand' : 'coral';
                const target = (event.metadata?.title as string) ??
                  (event.metadata?.roomName as string) ??
                  'um item';
                return (
                  <ActivityRow
                    key={event.id}
                    actorName={actor?.name ?? event.actorName}
                    actorVariant={actorVariant}
                    type={event.type}
                    target={target}
                    time={formatRelativeTime(event.createdAt)}
                  />
                );
              })}
            </Card>
          ) : (
            <Card padding="lg" className="items-center">
              <Mascot variant="organizando" size="xs" />
              <Text className="text-ink-2 text-sm text-center mt-3" style={{ maxWidth: 240 }}>
                Ainda nada por aqui.{'\n'}Comecem adicionando o primeiro item!
              </Text>
            </Card>
          )}
        </View>

        {/* Próximas conquistas (carrossel horizontal) */}
        {upcomingMilestones.length > 0 && (
          <View className="mt-6">
            <Text
              className="text-ink-3 text-[11px] font-semibold mb-3 px-6"
              style={{ letterSpacing: 1.6, textTransform: 'uppercase' }}
            >
              Próximas conquistas
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
            >
              {upcomingMilestones.map((mile) => (
                <View
                  key={`${mile.type}-${mile.scopeId}`}
                  className="bg-bg-2 border border-line-1 rounded-2xl p-4"
                  style={{ width: 200 }}
                >
                  <View className="flex-row items-center mb-2" style={{ gap: 8 }}>
                    <Icon name="trophy" tone="amber" size={18} />
                    <Text className="text-ink-1 font-semibold text-sm flex-1" numberOfLines={1}>
                      {mile.scopeLabel ?? milestoneShortLabel(mile.type)}
                    </Text>
                  </View>
                  <View className="h-1.5 bg-bg-4 rounded-full overflow-hidden mb-2">
                    <View
                      className="h-full rounded-full"
                      style={{ width: `${mile.percent}%`, backgroundColor: '#D9B370' }}
                    />
                  </View>
                  <Text className="text-ink-3 text-xs">{mile.hint}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Convite parceira */}
        {!hasPartner && (
          <View className="px-6 mt-6">
            <Button
              label="Convide seu calanguinho"
              variant="ghost"
              leftIcon="heart"
              rightIcon="arrow-right"
              onPress={() => router.push('/(app)/invite')}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function milestoneShortLabel(type: string): string {
  if (type.startsWith('items_')) return `${type.replace('items_', '')} itens`;
  if (type === 'first_received') return 'Primeiro recebido';
  if (type === 'first_purchased') return 'Primeira compra';
  if (type === 'room_50_percent') return 'Cômodo 50%';
  if (type === 'room_100_percent') return 'Cômodo 100%';
  return 'Conquista';
}
