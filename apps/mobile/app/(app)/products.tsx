import { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProducts, type ProductData } from '../../hooks/use-products';
import { useRooms } from '../../hooks/use-rooms';
import { ProductCard } from '../../components/product-card';
import { InfiniteList } from '../../components/infinite-list';

const STATUS_FILTERS = [
  { key: undefined, label: 'Todos' },
  { key: 'wishlist', label: 'Desejados' },
  { key: 'purchased', label: 'Comprados' },
  { key: 'received', label: 'Recebidos' },
] as const;

export default function AllProductsScreen() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const productsQuery = useProducts({ status: statusFilter });
  const roomsQuery = useRooms();

  const roomMap = useMemo(() => {
    const flat = roomsQuery.data?.pages.flatMap((p) => p.items) ?? [];
    return new Map(flat.map((r) => [r.id, r]));
  }, [roomsQuery.data]);

  const totalLoaded =
    productsQuery.data?.pages.reduce((acc, p) => acc + p.items.length, 0) ?? 0;

  const ListHeader = (
    <View>
      <View className="px-6 pt-4 pb-2">
        <Text className="text-2xl font-bold text-white">Todos os itens</Text>
        <Text className="text-surface-400 mt-1">
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
            <Pressable
              key={filter.label}
              onPress={() => setStatusFilter(filter.key)}
              className={`rounded-full px-4 py-2 ${
                active
                  ? 'bg-primary-600'
                  : 'bg-surface-800 active:bg-surface-700'
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  active ? 'text-white' : 'text-surface-300'
                }`}
              >
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-surface-900">
      <InfiniteList<ProductData>
        query={productsQuery}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
        ListHeaderComponent={ListHeader}
        emptyTitle="Nenhum item ainda"
        emptySubtitle={'Adicione produtos nos cômodos ou\ncole um link na tela inicial'}
        emptyIcon="📦"
        errorTitle="Erro ao carregar itens"
        renderItem={({ item }) => {
          const room = roomMap.get(item.roomId);
          return (
            <ProductCard
              product={item}
              showRoom
              roomName={room?.name}
              roomIcon={room?.icon ?? undefined}
            />
          );
        }}
      />
    </SafeAreaView>
  );
}
