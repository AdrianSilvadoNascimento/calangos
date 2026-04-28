import { useCallback, useMemo, type ReactElement } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
  type FlatListProps,
  type ListRenderItem,
} from 'react-native';
import type {
  InfiniteData,
  UseInfiniteQueryResult,
} from '@tanstack/react-query';
import type { Paginated } from '@enxoval/contracts';

type InfinitePage<T> = Paginated<T>;

type InfiniteQueryShape<T> = UseInfiniteQueryResult<
  InfiniteData<InfinitePage<T>, unknown>,
  unknown
>;

export type InfiniteListProps<T> = {
  query: InfiniteQueryShape<T>;
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T, index: number) => string;
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyIcon?: string;
  errorTitle?: string;
  /** Rendered AFTER the loading indicator at the end of the list. */
  ListFooterExtra?: ReactElement | null;
} & Omit<
  FlatListProps<T>,
  | 'data'
  | 'renderItem'
  | 'keyExtractor'
  | 'onEndReached'
  | 'onEndReachedThreshold'
  | 'refreshControl'
  | 'ListFooterComponent'
  | 'ListEmptyComponent'
>;

export function InfiniteList<T>({
  query,
  renderItem,
  keyExtractor,
  emptyTitle = 'Nada por aqui ainda',
  emptySubtitle,
  emptyIcon = '📦',
  errorTitle = 'Erro ao carregar',
  ListFooterExtra = null,
  ...flatListProps
}: InfiniteListProps<T>) {
  const {
    data,
    isPending,
    isError,
    isRefetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = query;

  const items = useMemo(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data],
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center py-16">
        <ActivityIndicator color="#4ade80" size="large" />
      </View>
    );
  }

  if (isError && items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-16">
        <Text className="text-surface-400 mb-4">{errorTitle}</Text>
        <Pressable onPress={() => refetch()}>
          <Text className="text-primary-400 font-semibold">
            Tentar novamente
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      {...flatListProps}
      data={items}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.4}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching && !isFetchingNextPage}
          onRefresh={refetch}
          tintColor="#4ade80"
          colors={['#4ade80']}
        />
      }
      ListFooterComponent={
        <View>
          {isFetchingNextPage ? (
            <View className="py-6 items-center">
              <ActivityIndicator color="#4ade80" />
            </View>
          ) : null}
          {ListFooterExtra}
        </View>
      }
      ListEmptyComponent={
        <View className="flex-1 items-center justify-center py-16">
          <Text className="text-5xl mb-4">{emptyIcon}</Text>
          <Text className="text-white font-semibold text-lg mb-2">
            {emptyTitle}
          </Text>
          {emptySubtitle ? (
            <Text className="text-surface-400 text-center text-sm">
              {emptySubtitle}
            </Text>
          ) : null}
        </View>
      }
    />
  );
}
