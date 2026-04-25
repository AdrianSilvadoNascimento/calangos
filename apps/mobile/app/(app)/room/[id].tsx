import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRoomProducts } from '../../../hooks/use-products';
import { useRooms } from '../../../hooks/use-rooms';
import { ProductCard } from '../../../components/product-card';

import { ArrowLeft } from 'lucide-react-native';

export default function RoomDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: products, isPending, isError, refetch } = useRoomProducts(id);
  const { data: rooms } = useRooms();

  const room = rooms?.find((r) => r.id === id);

  return (
    <SafeAreaView className="flex-1 bg-surface-900">
      {/* Header */}
      <View className="px-6 pt-2 pb-6">
        <Pressable onPress={() => router.back()} className="self-start py-2 mb-4 flex-row items-center">
          <ArrowLeft size={20} color="#4ade80" />
          <Text className="text-primary-400 font-semibold text-base ml-2">Voltar</Text>
        </Pressable>
        <View>
          <View className="flex-row items-center mb-1">
            <Text className="text-3xl mr-3">{room?.icon ?? '📦'}</Text>
            <Text className="text-2xl font-bold text-white flex-1" numberOfLines={2}>
              {room?.name ?? 'Cômodo'}
            </Text>
          </View>
          <Text className="text-surface-400 text-base ml-1">
            {products
              ? `${products.length} ${products.length === 1 ? 'item' : 'itens'}`
              : ' '}
          </Text>
        </View>
      </View>

      {/* Add item button */}
      <Pressable
        onPress={() => router.push('/(app)/add-product')}
        className="mx-6 mb-4 bg-primary-600/20 border border-primary-600/30 rounded-2xl p-3.5 flex-row items-center justify-center active:bg-primary-600/30"
      >
        <Text className="text-primary-300 font-semibold text-sm">+ Adicionar item</Text>
      </Pressable>

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
              Nenhum item neste cômodo
            </Text>
            <Text className="text-surface-400 text-center text-sm">
              Toque em "Adicionar item" acima{'\n'}ou cole um link na tela inicial
            </Text>
          </View>
        )}

        {products && products.length > 0 && (
          <View>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </View>
        )}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
