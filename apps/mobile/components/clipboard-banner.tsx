import { useEffect, useRef } from 'react';
import { View, Text, Pressable, AppState, AppStateStatus } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { useClipboardSuggestion } from '../stores/clipboard-suggestion';
import { checkClipboardForUrl } from '../lib/clipboard-watcher';
import { usePreferences } from '../hooks/use-preferences';

export function ClipboardBanner() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { url, dismiss } = useClipboardSuggestion();
  const { data: prefs } = usePreferences();
  const detectEnabled = prefs?.detectLinksEnabled ?? true;
  const lastAppState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    if (!detectEnabled) {
      // Drop any pending suggestion when the user disables the feature.
      if (url) dismiss();
      return;
    }

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
  }, [queryClient, detectEnabled, url, dismiss]);

  if (!detectEnabled || !url) return null;

  return (
    <View
      className="absolute left-4 right-4 rounded-2xl p-4 flex-row items-center justify-between"
      style={{
        bottom: 70 + insets.bottom,
        backgroundColor: '#0A2A1A', // brand-900
        borderWidth: 1,
        borderColor: '#34B26C',     // brand-500
        shadowColor: '#5FCB8B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 6,
      }}
    >
      <View className="flex-1 mr-3">
        <Text className="text-ink-1 font-bold text-sm mb-0.5">Link detectado</Text>
        <Text className="text-brand-300 text-xs" numberOfLines={1}>
          {url}
        </Text>
      </View>

      <View className="flex-row items-center" style={{ gap: 8 }}>
        <Pressable
          onPress={dismiss}
          className="px-3 py-2 rounded-xl active:opacity-70"
          style={{ backgroundColor: '#18372C' }}
        >
          <Text className="text-ink-3 font-semibold text-xs">Ignorar</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            router.push({ pathname: '/add-product', params: { url } });
          }}
          className="px-3 py-2 rounded-xl active:opacity-80"
          style={{ backgroundColor: '#34B26C' }}
        >
          <Text style={{ color: '#04140A', fontWeight: '700', fontSize: 12 }}>
            Adicionar
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
