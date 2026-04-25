import { useEffect, useRef } from 'react';
import { View, Text, Pressable, AppState, AppStateStatus } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { useClipboardSuggestion } from '../stores/clipboard-suggestion';
import { checkClipboardForUrl } from '../lib/clipboard-watcher';

export function ClipboardBanner() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { url, dismiss } = useClipboardSuggestion();
  const lastAppState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    let activeTimer: ReturnType<typeof setTimeout> | null = null;

    const runCheck = () => {
      checkClipboardForUrl(queryClient);
    };

    // iOS needs a brief delay on cold-start before the clipboard is readable.
    const initial = setTimeout(runCheck, 350);

    const subscription = AppState.addEventListener('change', (nextState) => {
      const previous = lastAppState.current;
      lastAppState.current = nextState;
      // Fire whenever we land on 'active' from any other state. Restricting to
      // background/inactive misses fast app-switches on iOS where the previous
      // state never settled. The watcher itself is idempotent.
      if (nextState === 'active' && previous !== 'active') {
        if (activeTimer) clearTimeout(activeTimer);
        // Delay so iOS pasteboard becomes readable and the OS paste prompt
        // doesn't race against the read.
        activeTimer = setTimeout(runCheck, 350);
      }
    });

    return () => {
      clearTimeout(initial);
      if (activeTimer) clearTimeout(activeTimer);
      subscription.remove();
    };
  }, [queryClient]);

  if (!url) return null;

  return (
    <View
      className="absolute left-4 right-4 bg-primary-900 border border-primary-500 rounded-2xl p-4 flex-row items-center justify-between shadow-lg"
      style={{ bottom: 70 + insets.bottom }}
    >
      <View className="flex-1 mr-3">
        <Text className="text-white font-bold text-sm mb-0.5">Link detectado</Text>
        <Text className="text-primary-200 text-xs" numberOfLines={1}>
          {url}
        </Text>
      </View>

      <View className="flex-row items-center" style={{ gap: 8 }}>
        <Pressable onPress={dismiss} className="px-3 py-2 bg-surface-800 rounded-xl">
          <Text className="text-surface-300 font-semibold text-xs">Ignorar</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            router.push({ pathname: '/add-product', params: { url } });
          }}
          className="px-3 py-2 bg-primary-500 rounded-xl"
        >
          <Text className="text-white font-bold text-xs">Adicionar</Text>
        </Pressable>
      </View>
    </View>
  );
}
