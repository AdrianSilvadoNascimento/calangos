import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
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
import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query';
import { Mascot, type MascotVariant } from './ui/mascot';

/** Minimum shape — only requires `items: T[]` so we accept cursor & offset pagers. */
type InfinitePage<T> = { items: T[] };

type InfiniteQueryShape<T> = UseInfiniteQueryResult<
  InfiniteData<InfinitePage<T>, unknown>,
  unknown
>;

export type InfiniteListProps<T> = {
  query: InfiniteQueryShape<T>;
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T, index: number) => string;
  /** Optional client-side filter applied to the merged page items. */
  filter?: (item: T) => boolean;
  emptyTitle?: string;
  emptySubtitle?: string;
  /** Emoji rendered above empty title — used only when `emptyMascot` is not set. */
  emptyIcon?: string;
  /** Render the 3D mascot instead of an emoji on empty (DESIGN_SYSTEM §9). */
  emptyMascot?: MascotVariant;
  errorTitle?: string;
  /** Rendered AFTER the loading indicator at the end of the list. */
  ListFooterExtra?: ReactElement | null;
  /** Item key to focus on first render (scrolls into view). Used by notification deep links. */
  highlightId?: string | null;
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
  filter,
  emptyTitle = 'Nada por aqui ainda',
  emptySubtitle,
  emptyIcon = '📦',
  emptyMascot,
  errorTitle = 'Ops, não rolou carregar',
  ListFooterExtra = null,
  highlightId = null,
  ...flatListProps
}: InfiniteListProps<T>) {
  const listRef = useRef<FlatList<T>>(null);
  const [scrolledToHighlight, setScrolledToHighlight] = useState(false);
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

  const items = useMemo(() => {
    const merged = data?.pages.flatMap((p) => p.items) ?? [];
    return filter ? merged.filter(filter) : merged;
  }, [data, filter]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    setScrolledToHighlight(false);
  }, [highlightId]);

  useEffect(() => {
    if (!highlightId || scrolledToHighlight || items.length === 0) return;
    const idx = items.findIndex((it, i) => keyExtractor(it, i) === highlightId);
    if (idx === -1) return;
    const t = setTimeout(() => {
      listRef.current?.scrollToIndex({ index: idx, viewPosition: 0.25, animated: true });
      setScrolledToHighlight(true);
    }, 180);
    return () => clearTimeout(t);
  }, [highlightId, items, scrolledToHighlight, keyExtractor]);

  const handleScrollToIndexFailed = useCallback(
    (info: { index: number; averageItemLength: number }) => {
      const offset = info.averageItemLength * info.index;
      listRef.current?.scrollToOffset({ offset, animated: true });
      setTimeout(() => {
        listRef.current?.scrollToIndex({ index: info.index, viewPosition: 0.25, animated: true });
      }, 120);
    },
    [],
  );

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center py-16">
        <ActivityIndicator color="#5FCB8B" size="large" />
      </View>
    );
  }

  if (isError && items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-16">
        <Text className="text-ink-3 mb-4">{errorTitle}</Text>
        <Pressable onPress={() => refetch()} hitSlop={12}>
          <Text className="text-brand-400 font-semibold">Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      {...flatListProps}
      ref={listRef}
      data={items}
      extraData={highlightId}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.4}
      onScrollToIndexFailed={handleScrollToIndexFailed}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching && !isFetchingNextPage}
          onRefresh={refetch}
          tintColor="#5FCB8B"
          colors={['#5FCB8B']}
        />
      }
      ListFooterComponent={
        <View>
          {isFetchingNextPage ? (
            <View className="py-6 items-center">
              <ActivityIndicator color="#5FCB8B" />
            </View>
          ) : null}
          {ListFooterExtra}
        </View>
      }
      ListEmptyComponent={
        <View className="flex-1 items-center justify-center py-16 px-6">
          {emptyMascot ? (
            <Mascot variant={emptyMascot} size="sm" />
          ) : (
            <Text className="text-5xl mb-4">{emptyIcon}</Text>
          )}
          <Text className="text-ink-1 font-semibold text-lg mt-3 mb-1 text-center">
            {emptyTitle}
          </Text>
          {emptySubtitle ? (
            <Text className="text-ink-3 text-center text-sm">{emptySubtitle}</Text>
          ) : null}
        </View>
      }
    />
  );
}
