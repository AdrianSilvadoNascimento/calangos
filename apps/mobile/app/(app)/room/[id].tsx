import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useRoomProducts, type ProductData } from '../../../hooks/use-products';
import { useRoom } from '../../../hooks/use-rooms';
import { ProductCard } from '../../../components/product-card';
import { InfiniteList } from '../../../components/infinite-list';

export default function RoomDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const productsQuery = useRoomProducts(id);
  const { data: room } = useRoom(id);

  const totalLoaded =
    productsQuery.data?.pages.reduce((acc, p) => acc + p.items.length, 0) ?? 0;

  const ListHeader = (
    <View className="pb-2">
      <View className="flex-row items-center mb-1">
        <Text className="text-3xl mr-3">{room?.icon ?? '📦'}</Text>
        <Text className="text-2xl font-bold text-white flex-1" numberOfLines={2}>
          {room?.name ?? 'Cômodo'}
        </Text>
      </View>
      <Text className="text-surface-400 text-base ml-1">
        {productsQuery.data
          ? `${totalLoaded}${productsQuery.hasNextPage ? '+' : ''} ${
              totalLoaded === 1 ? 'item' : 'itens'
            }`
          : ' '}
      </Text>

      <Pressable
        onPress={() => router.push('/(app)/add-product')}
        className="mt-6 mb-2 bg-primary-600/20 border border-primary-600/30 rounded-2xl p-3.5 flex-row items-center justify-center active:bg-primary-600/30"
      >
        <Text className="text-primary-300 font-semibold text-sm">
          + Adicionar item
        </Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-surface-900">
      <View className="px-6 pt-2">
        <Pressable
          onPress={() => router.back()}
          className="self-start py-2 mb-2 flex-row items-center"
        >
          <ArrowLeft size={20} color="#4ade80" />
          <Text className="text-primary-400 font-semibold text-base ml-2">Voltar</Text>
        </Pressable>
      </View>

      <InfiniteList<ProductData>
        query={productsQuery}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
        ListHeaderComponent={ListHeader}
        emptyTitle="Nenhum item neste cômodo"
        emptySubtitle={'Toque em "Adicionar item" acima\nou cole um link na tela inicial'}
        emptyIcon="📦"
        errorTitle="Erro ao carregar itens"
        renderItem={({ item }) => <ProductCard product={item} />}
      />
    </SafeAreaView>
  );
}
