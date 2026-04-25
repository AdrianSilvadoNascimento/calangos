import { View, Text, Pressable, Linking, Image } from 'react-native';
import type { ProductData } from '../hooks/use-products';

const STATUS_CONFIG: Record<
  ProductData['status'],
  { label: string; bg: string; text: string; dot: string }
> = {
  wishlist: {
    label: 'Desejado',
    bg: 'bg-amber-900/30',
    text: 'text-amber-300',
    dot: 'bg-amber-400',
  },
  purchased: {
    label: 'Comprado',
    bg: 'bg-blue-900/30',
    text: 'text-blue-300',
    dot: 'bg-blue-400',
  },
  received: {
    label: 'Recebido',
    bg: 'bg-emerald-900/30',
    text: 'text-emerald-300',
    dot: 'bg-emerald-400',
  },
  cancelled: {
    label: 'Cancelado',
    bg: 'bg-red-900/30',
    text: 'text-red-300',
    dot: 'bg-red-400',
  },
};

interface ProductCardProps {
  product: ProductData;
  showRoom?: boolean;
  roomName?: string;
  roomIcon?: string;
}

export function ProductCard({ product, showRoom, roomName, roomIcon }: ProductCardProps) {
  const status = STATUS_CONFIG[product.status] ?? STATUS_CONFIG.wishlist;

  const handleOpenLink = () => {
    if (product.url) Linking.openURL(product.url);
  };

  const formatPrice = (cents: number, currency: string) => {
    const value = (cents / 100).toFixed(2).replace('.', ',');
    if (currency === 'BRL') return `R$ ${value}`;
    return `${currency} ${value}`;
  };

  return (
    <Pressable
      onPress={handleOpenLink}
      className="bg-surface-800 rounded-2xl p-4 mb-3 active:bg-surface-700"
    >
      <View className="flex-row items-start justify-between mb-2">
        {product.imageUrl && (
          <Image
            source={{ uri: product.imageUrl }}
            className="w-16 h-16 rounded-lg mr-3 bg-surface-700"
            resizeMode="cover"
          />
        )}
        <View className="flex-1 mr-3">
          <Text className="text-white font-semibold text-base" numberOfLines={2}>
            {product.title || product.storeName || 'Produto sem título'}
          </Text>
          {product.storeName && product.title && (
            <Text className="text-surface-400 text-xs mt-0.5">
              {product.storeName}
            </Text>
          )}
        </View>

        <View className={`rounded-full px-2.5 py-1 flex-row items-center ${status.bg}`}>
          <View className={`w-1.5 h-1.5 rounded-full mr-1.5 ${status.dot}`} />
          <Text className={`text-xs font-semibold ${status.text}`}>
            {status.label}
          </Text>
        </View>
      </View>

      {product.priceCents != null && (
        <Text className="text-primary-300 font-bold text-lg mb-1">
          {formatPrice(product.priceCents, product.currency)}
        </Text>
      )}

      {product.description && (
        <Text className="text-surface-300 text-xs mt-1" numberOfLines={3}>
          {product.description}
        </Text>
      )}

      {product.notes && (
        <Text className="text-surface-400 text-xs mt-1" numberOfLines={2}>
          {product.notes}
        </Text>
      )}

      {showRoom && roomName && (
        <View className="flex-row items-center mt-2 pt-2 border-t border-surface-700">
          <Text className="text-sm mr-1.5">{roomIcon ?? '📦'}</Text>
          <Text className="text-surface-400 text-xs">{roomName}</Text>
        </View>
      )}

      <Text className="text-surface-600 text-xs mt-2" numberOfLines={1}>
        {product.url}
      </Text>
    </Pressable>
  );
}
