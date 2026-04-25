import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProducts } from '../../hooks/use-products';
import { useRooms } from '../../hooks/use-rooms';
import { ProductCard } from '../../components/product-card';

const STATUS_FILTERS = [
  { key: undefined, label: 'Todos' },
  { key: 'wishlist', label: 'Desejados' },
  { key: 'purchased', label: 'Comprados' },
  { key: 'received', label: 'Recebidos' },
] as const;

export default function AllProductsScreen() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const { data: products, isPending, isError, refetch } = useProducts({
    status: statusFilter,
  });
  const { data: rooms } = useRooms();

  const roomMap = new Map(rooms?.map((r) => [r.id, r]) ?? []);

  return (
    <SafeAreaView className="flex-1 bg-surface-900">
      <View className="px-6 pt-4 pb-2">
        <Text className="text-2xl font-bold text-white">Todos os itens</Text>
        <Text className="text-surface-400 mt-1">
          {products ? `${products.length} ${products.length === 1 ? 'item' : 'itens'}` : ' '}
        </Text>
      </View>

      {/* Status filter chips */}
      <View>
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

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {isPending && (
          <View className="flex-1 items-center justify-center py-16">
            <ActivityIndicator color="#4ade80" size="large" />
          </View>
        )}

        {isError && (
          <View className="flex-1 items-center justify-center py-16">
            <Text className="text-surface-400 mb-4">Erro ao carregar itens</Text>
            <Pressable onPress={() => refetch()}>
              <Text className="text-primary-400 font-semibold">Tentar novamente</Text>
            </Pressable>
          </View>
        )}

        {products && products.length === 0 && (
          <View className="flex-1 items-center justify-center py-16">
            <Text className="text-5xl mb-4">📦</Text>
            <Text className="text-white font-semibold text-lg mb-2">
              Nenhum item ainda
            </Text>
            <Text className="text-surface-400 text-center text-sm">
              Adicione produtos nos cômodos ou{'\n'}cole um link na tela inicial
            </Text>
          </View>
        )}

        {products && products.length > 0 && (
          <View>
            {products.map((product) => {
              const room = roomMap.get(product.roomId);
              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  showRoom
                  roomName={room?.name}
                  roomIcon={room?.icon ?? undefined}
                />
              );
            })}
          </View>
        )}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
