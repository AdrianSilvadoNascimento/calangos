import { useCallback, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { authClient } from '@enxoval/auth-client';
import { useMyCouple } from '../../../hooks/use-my-couple';
import { useCoupleMembers } from '../../../hooks/use-couple-members';
import { useCoupleProgress, formatBRL } from '../../../hooks/use-couple-progress';
import { useCoupleActivity } from '../../../hooks/use-couple-activity';
import { useCoupleMilestones } from '../../../hooks/use-couple-milestones';
import { formatRelativeTime } from '../../../lib/format-time';
import { ActivityRow, Avatar, Card, Icon, Mascot } from '../../../components/ui';

const ROOM_COLORS = ['#34B26C', '#E89784', '#7FB6D9', '#D9B370', '#D98A99', '#5FCB8B'];

function MilestoneBadge({ title }: { title: string }) {
  return (
    <View
      className="rounded-2xl items-center justify-center bg-bg-2 border border-line-1"
      style={{ width: 88, height: 88, padding: 8, gap: 4 }}
    >
      <View
        className="rounded-full items-center justify-center"
        style={{ width: 36, height: 36, backgroundColor: '#D9B3701F' }}
      >
        <Icon name="trophy" tone="amber" size={18} />
      </View>
      <Text className="text-ink-2 text-[10px] text-center font-semibold" numberOfLines={2}>
        {title}
      </Text>
    </View>
  );
}

function AvatarPair({ name1, name2 }: { name1: string; name2: string }) {
  return (
    <View className="flex-row items-center">
      <Avatar name={name1} variant="brand" size={64} />
      <View
        className="items-center justify-center rounded-full bg-bg-1"
        style={{ width: 32, height: 32, marginHorizontal: -4, zIndex: 3 }}
      >
        <Icon name="heart" tone="coral" size={14} fillAlpha={0xff} />
      </View>
      <Avatar name={name2} variant="coral" size={64} />
    </View>
  );
}

const MILESTONE_TITLES: Record<string, string> = {
  items_10: '10 itens',
  items_25: '25 itens',
  items_50: '50 itens',
  items_100: '100 itens',
  first_purchased: '1ª compra',
  first_received: '1º recebido',
  room_50_percent: 'Cômodo 50%',
  room_100_percent: 'Cômodo 100%',
  partner_joined: 'Casal completo',
};

export default function CasalScreen() {
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const { data: couple } = useMyCouple();
  const { data: members } = useCoupleMembers();
  const { data: progress } = useCoupleProgress();
  const activityQuery = useCoupleActivity();
  const { data: milestones } = useCoupleMilestones();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['couple'] }),
        queryClient.refetchQueries({ queryKey: ['couple-progress'] }),
        queryClient.refetchQueries({ queryKey: ['couple-activity'] }),
        queryClient.refetchQueries({ queryKey: ['couple-milestones'] }),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  const m = (members as any)?.members ?? [];
  const name1 = m[0]?.name ?? 'Vocês';
  const name2 = m[1]?.name ?? '♥';

  const partnerById = new Map<string, { name: string; isMe: boolean }>();
  for (const mb of m) {
    partnerById.set(mb.userId, {
      name: mb.name ?? 'Alguém',
      isMe: mb.userId === session?.user?.id,
    });
  }

  const items = activityQuery.data?.pages.flatMap((p) => p.items) ?? [];
  const unlocked = milestones?.unlocked ?? [];

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
        <View className="px-6 pt-6 pb-2">
          <Text
            className="text-ink-3 text-[11px] font-semibold mb-1"
            style={{ letterSpacing: 1.6, textTransform: 'uppercase' }}
          >
            Casal
          </Text>
          <Text className="text-ink-1 text-2xl font-bold" style={{ letterSpacing: -0.5 }}>
            {couple?.name ?? 'Nosso enxoval'}
          </Text>
        </View>

        {/* Avatar pair hero */}
        <View className="items-center mt-6 mb-6">
          <AvatarPair name1={name1} name2={name2} />
          <Text className="text-ink-2 text-sm mt-3 font-medium">
            {name1} & {name2}
          </Text>
        </View>

        {/* Stats trio */}
        <View className="mx-6 flex-row mb-6" style={{ gap: 12 }}>
          {[
            { label: 'Itens', value: String(progress?.totalItems ?? 0) },
            {
              label: 'Planejado',
              value: progress
                ? formatBRL(progress.totalPlannedCents, progress.currency)
                : 'R$ 0',
            },
            { label: 'Completo', value: `${progress?.percentReceived ?? 0}%` },
          ].map((stat) => (
            <Card key={stat.label} className="flex-1 items-center" padding="sm">
              <Text className="text-ink-1 text-lg font-bold">{stat.value}</Text>
              <Text className="text-ink-3 text-xs mt-0.5">{stat.label}</Text>
            </Card>
          ))}
        </View>

        {/* Mini barras por cômodo (HI-FI §59) */}
        {progress && progress.byRoom.length > 0 && (
          <View className="px-6 mb-6">
            <Text
              className="text-ink-3 text-[11px] font-semibold mb-3"
              style={{ letterSpacing: 1.6, textTransform: 'uppercase' }}
            >
              Cômodos
            </Text>
            <Card padding="sm">
              {progress.byRoom.map((room, idx) => {
                const color = ROOM_COLORS[idx % ROOM_COLORS.length] ?? '#5FCB8B';
                return (
                  <View key={room.roomId} className="py-2 px-2">
                    <View className="flex-row items-center justify-between mb-1.5">
                      <Text className="text-ink-2 text-sm font-semibold flex-1" numberOfLines={1}>
                        {room.name}
                      </Text>
                      <Text className="text-ink-3 text-xs">
                        {room.received}/{room.total}
                      </Text>
                    </View>
                    <View
                      className="bg-bg-4 rounded-full overflow-hidden"
                      style={{ height: 4 }}
                    >
                      <View
                        className="rounded-full"
                        style={{
                          height: 4,
                          width: `${room.percentReceived}%`,
                          backgroundColor: color,
                        }}
                      />
                    </View>
                  </View>
                );
              })}
            </Card>
          </View>
        )}

        {/* Conquistas */}
        <View className="px-6 mb-6">
          <Text
            className="text-ink-3 text-[11px] font-semibold mb-3"
            style={{ letterSpacing: 1.6, textTransform: 'uppercase' }}
          >
            Conquistas
          </Text>
          {unlocked.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10 }}
            >
              {unlocked.map((mile) => (
                <MilestoneBadge
                  key={mile.id}
                  title={
                    (mile.metadata?.roomName as string | undefined) ??
                    MILESTONE_TITLES[mile.type] ??
                    'Conquista'
                  }
                />
              ))}
            </ScrollView>
          ) : (
            <Card padding="lg" className="items-center">
              <View
                className="rounded-full items-center justify-center mb-3"
                style={{ width: 56, height: 56, backgroundColor: '#D9B3701A' }}
              >
                <Icon name="trophy" tone="amber" size={24} />
              </View>
              <Text className="text-ink-2 text-xs text-center" style={{ maxWidth: 240 }}>
                As conquistas aparecem quando vocês alcançam marcos especiais 🎉
              </Text>
            </Card>
          )}
        </View>

        {/* Feed */}
        <View className="px-6">
          <Text
            className="text-ink-3 text-[11px] font-semibold mb-3"
            style={{ letterSpacing: 1.6, textTransform: 'uppercase' }}
          >
            Atividade do casal
          </Text>
          {items.length > 0 ? (
            <Card padding="sm">
              {items.map((event) => {
                const actor = partnerById.get(event.actorUserId);
                const actorVariant: 'brand' | 'coral' = actor?.isMe ? 'brand' : 'coral';
                const target =
                  (event.metadata?.title as string) ??
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
              <Mascot variant="juntos" size="xs" />
              <Text className="text-ink-1 font-semibold text-sm mb-1 mt-3">
                Em breve, o diário de vocês 💍
              </Text>
              <Text className="text-ink-3 text-xs text-center" style={{ maxWidth: 240 }}>
                Cada item adicionado, comprado e recebido vai aparecer aqui
              </Text>
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
