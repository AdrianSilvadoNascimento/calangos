import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useProducts, type ProductData } from '../../hooks/use-products';
import { useRooms } from '../../hooks/use-rooms';
import { Chip, ItemCard } from '../../components/ui';
import { InfiniteList } from '../../components/infinite-list';

const STATUS_FILTERS = [
  { key: undefined, label: 'Todos' },
  { key: 'wishlist', label: 'Desejados' },
  { key: 'purchased', label: 'Comprados' },
  { key: 'received', label: 'Recebidos' },
] as const;

export default function AllProductsScreen() {
  const { highlight } = useLocalSearchParams<{ highlight?: string }>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const productsQuery = useProducts({ status: statusFilter });
  const roomsQuery = useRooms();
  const [highlightedId, setHighlightedId] = useState<string | null>(highlight ?? null);

  useEffect(() => {
    if (!highlight) return;
    setHighlightedId(highlight);
    const t = setTimeout(() => setHighlightedId(null), 2500);
    return () => clearTimeout(t);
  }, [highlight]);

  const roomMap = useMemo(() => {
    const flat = roomsQuery.data?.pages.flatMap((p) => p.items) ?? [];
    return new Map(flat.map((r) => [r.id, r]));
  }, [roomsQuery.data]);

  const totalLoaded =
    productsQuery.data?.pages.reduce((acc, p) => acc + p.items.length, 0) ?? 0;

  const ListHeader = (
    <View>
      <View className="px-6 pt-4 pb-2">
        <Text className="text-2xl font-bold text-ink-1" style={{ letterSpacing: -0.5 }}>
          Todos os itens
        </Text>
        <Text className="text-ink-3 mt-1 text-sm">
          {productsQuery.data
            ? `${totalLoaded}${productsQuery.hasNextPage ? '+' : ''} ${
                totalLoaded === 1 ? 'item' : 'itens'
              }`
            : ' '}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          gap: 8,
          paddingHorizontal: 24,
          paddingVertical: 12,
          alignItems: 'center',
        }}
      >
        {STATUS_FILTERS.map((filter) => {
          const active = statusFilter === filter.key;
          return (
            <Chip
              key={filter.label}
              label={filter.label}
              variant={active ? 'active' : 'default'}
              onPress={() => setStatusFilter(filter.key)}
            />
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-bg-1">
      <InfiniteList<ProductData>
        query={productsQuery}
        keyExtractor={(item) => item.id}
        highlightId={highlightedId}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
        ListHeaderComponent={ListHeader}
        emptyTitle="Nenhum item ainda"
        emptySubtitle={'Adicione produtos nos cômodos ou\ncole um link na tela inicial'}
        emptyMascot="organizando"
        renderItem={({ item }) => {
          const room = roomMap.get(item.roomId);
          return (
            <ItemCard
              product={item}
              showRoom
              roomName={room?.name}
              roomIcon={room?.icon ?? undefined}
              highlighted={item.id === highlightedId}
            />
          );
        }}
      />
    </SafeAreaView>
  );
}
