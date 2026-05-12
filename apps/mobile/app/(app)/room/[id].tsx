import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRoomProducts, type ProductData } from '../../../hooks/use-products';
import { useRoom } from '../../../hooks/use-rooms';
import { useCoupleProgress, formatBRL } from '../../../hooks/use-couple-progress';
import { Chip, ItemCard, Icon, LinkButton, FAB } from '../../../components/ui';
import { InfiniteList } from '../../../components/infinite-list';

const ROOM_COLORS = ['#34B26C', '#E89784', '#7FB6D9', '#D9B370', '#D98A99', '#5FCB8B'];

type StatusFilter = ProductData['status'] | 'all';

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all',       label: 'Todos' },
  { key: 'wishlist',  label: 'Desejados' },
  { key: 'purchased', label: 'Comprados' },
  { key: 'received',  label: 'Recebidos' },
  { key: 'cancelled', label: 'Cancelados' },
];

export default function RoomDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, highlight } = useLocalSearchParams<{ id: string; highlight?: string }>();
  const productsQuery = useRoomProducts(id);
  const { data: room } = useRoom(id);
  const { data: progress } = useCoupleProgress();

  const [filter, setFilter] = useState<StatusFilter>('all');
  const [highlightedId, setHighlightedId] = useState<string | null>(highlight ?? null);

  useEffect(() => {
    if (!highlight) return;
    setHighlightedId(highlight);
    const t = setTimeout(() => setHighlightedId(null), 2500);
    return () => clearTimeout(t);
  }, [highlight]);

  const allItems = useMemo(
    () => productsQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [productsQuery.data],
  );

  const counts = useMemo(() => {
    const c = { all: allItems.length, wishlist: 0, purchased: 0, received: 0, cancelled: 0 };
    for (const it of allItems) c[it.status]++;
    return c;
  }, [allItems]);

  const totalCents = useMemo(
    () =>
      allItems
        .filter((p) => p.status !== 'cancelled' && p.priceCents != null)
        .reduce((acc, p) => acc + (p.priceCents ?? 0), 0),
    [allItems],
  );

  const colorIndex = id ? id.charCodeAt(0) % ROOM_COLORS.length : 0;
  const roomColor = ROOM_COLORS[colorIndex] ?? '#5FCB8B';

  const roomProgress = progress?.byRoom.find((r) => r.roomId === id);
  const percent = roomProgress?.percentReceived ?? 0;

  const handleAddProduct = () => {
    router.push({ pathname: '/(app)/add-product', params: { roomId: id } });
  };

  const ListHeader = (
    <View className="pb-4">
      <View className="flex-row items-center mb-1">
        <View
          className="rounded-2xl items-center justify-center mr-4"
          style={{ width: 50, height: 50, backgroundColor: `${roomColor}1F` }}
        >
          <Icon name="package" size={26} color={roomColor} />
        </View>
        <View className="flex-1">
          <Text
            className="text-ink-1 text-2xl font-bold"
            style={{ letterSpacing: -0.5 }}
            numberOfLines={2}
          >
            {room?.name ?? 'Cômodo'}
          </Text>
          <Text className="text-ink-3 text-sm mt-0.5">
            {productsQuery.data
              ? `${counts.all}${productsQuery.hasNextPage ? '+' : ''} ${counts.all === 1 ? 'item' : 'itens'}${
                  totalCents > 0 ? ` · ${formatBRL(totalCents)}` : ''
                }`
              : ' '}
          </Text>
        </View>
      </View>

      {/* Barra de progresso */}
      <View
        className="bg-bg-4 rounded-full overflow-hidden mt-4 mb-5"
        style={{ height: 3 }}
      >
        <View
          className="rounded-full"
          style={{ height: 3, width: `${percent}%`, backgroundColor: roomColor }}
        />
      </View>

      {/* Filter chips com count (HI-FI §35) */}
      {counts.all > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
        >
          {FILTERS.map((f) => {
            const count = counts[f.key];
            if (f.key !== 'all' && count === 0) return null;
            return (
              <Chip
                key={f.key}
                label={f.label}
                count={count}
                variant={filter === f.key ? 'active' : 'default'}
                onPress={() => setFilter(f.key)}
              />
            );
          })}
        </ScrollView>
      )}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-bg-1">
      <View className="px-6 pt-2">
        <LinkButton leftIcon="arrow-left" label="Voltar" onPress={() => router.back()} />
      </View>

      <InfiniteList<ProductData>
        query={productsQuery}
        keyExtractor={(item) => item.id}
        filter={filter === 'all' ? undefined : (item) => item.status === filter}
        highlightId={highlightedId}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
        ListHeaderComponent={ListHeader}
        emptyTitle={filter === 'all' ? 'Ainda nada por aqui' : 'Nenhum item nesse filtro'}
        emptySubtitle={
          filter === 'all'
            ? 'Cole um link ou toque no + abaixo'
            : 'Tente outro filtro ou adicione um item'
        }
        emptyMascot="organizando"
        renderItem={({ item }) => (
          <ItemCard product={item} highlighted={item.id === highlightedId} />
        )}
      />

      <FAB
        icon="plus"
        onPress={handleAddProduct}
        accessibilityLabel="Adicionar item"
        bottom={24 + insets.bottom}
      />
    </SafeAreaView>
  );
}
