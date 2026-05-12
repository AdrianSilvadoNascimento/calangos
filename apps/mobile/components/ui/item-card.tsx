import { useEffect, useRef, useState } from 'react';
import { Animated, Image, Linking, Pressable, Text, View } from 'react-native';
import { Chip, type ChipStatus } from './chip';
import type { ProductData } from '../../hooks/use-products';
import { ProductActions } from '../product-actions';

export interface ItemCardProps {
  product: ProductData;
  showRoom?: boolean;
  roomName?: string;
  roomIcon?: string;
  /** Pulsing brand glow used by notification deep links. */
  highlighted?: boolean;
}

function formatPrice(cents: number, currency: string) {
  const value = (cents / 100).toFixed(2).replace('.', ',');
  if (currency === 'BRL') return `R$ ${value}`;
  return `${currency} ${value}`;
}

/**
 * ItemCard — produto no enxoval, com imagem, status chip, preço.
 * Long-press abre o sheet de ações (ProductActions).
 * (Renomeado de product-card.tsx — DESIGN_SYSTEM §6 + §11.)
 */
export function ItemCard({ product, showRoom, roomName, roomIcon, highlighted }: ItemCardProps) {
  const [actionsOpen, setActionsOpen] = useState(false);
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!highlighted) return;
    glow.setValue(0);
    Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.delay(1400),
      Animated.timing(glow, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, [highlighted, glow]);

  const handleOpenLink = () => {
    if (product.url) Linking.openURL(product.url);
  };

  const status = (product.status ?? 'wishlist') as ChipStatus;
  const statusLabel = {
    wishlist: 'Desejado',
    purchased: 'Comprado',
    received: 'Recebido',
    cancelled: 'Cancelado',
  }[status];

  return (
    <View className="mb-3">
      {highlighted && (
        <Animated.View
          pointerEvents="none"
          className="absolute rounded-2xl border-2 border-brand-400"
          style={{
            top: -2,
            left: -2,
            right: -2,
            bottom: -2,
            opacity: glow,
          }}
        />
      )}
    <Pressable
      onPress={handleOpenLink}
      onLongPress={() => setActionsOpen(true)}
      delayLongPress={350}
      className="bg-bg-2 border border-line-1 rounded-2xl p-4 active:bg-bg-3"
    >
      <View className="flex-row items-start mb-2" style={{ gap: 12 }}>
        {product.imageUrl && (
          <Image
            source={{ uri: product.imageUrl }}
            className="rounded-xl"
            style={{ width: 64, height: 64, backgroundColor: '#18372C' }}
            resizeMode="cover"
          />
        )}
        <View className="flex-1">
          <Text className="text-ink-1 font-semibold text-base" numberOfLines={2}>
            {product.title || product.storeName || 'Produto sem título'}
          </Text>
          {product.storeName && product.title && (
            <Text className="text-ink-3 text-xs mt-0.5">{product.storeName}</Text>
          )}
        </View>

        <Chip variant="status" status={status} label={statusLabel} />
      </View>

      {product.priceCents != null && (
        <Text className="text-brand-300 font-bold text-lg mb-1">
          {formatPrice(product.priceCents, product.currency)}
        </Text>
      )}

      {product.description && (
        <Text className="text-ink-2 text-xs mt-1" numberOfLines={3}>
          {product.description}
        </Text>
      )}

      {product.notes && (
        <Text className="text-ink-3 text-xs mt-1" numberOfLines={2}>
          {product.notes}
        </Text>
      )}

      {showRoom && roomName && (
        <View className="flex-row items-center mt-2 pt-2 border-t border-line-1">
          {roomIcon && <Text className="text-sm mr-1.5">{roomIcon}</Text>}
          <Text className="text-ink-3 text-xs">{roomName}</Text>
        </View>
      )}

      <Text className="text-ink-4 text-xs mt-2 font-mono" numberOfLines={1}>
        {product.url}
      </Text>

      <ProductActions
        product={product}
        visible={actionsOpen}
        onClose={() => setActionsOpen(false)}
      />
    </Pressable>
    </View>
  );
}
