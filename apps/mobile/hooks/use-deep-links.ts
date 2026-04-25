import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Linking from 'expo-linking';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useClipboardSuggestion } from '../stores/clipboard-suggestion';

const HTTP_URL = /(https?:\/\/[^\s]+)/i;
const APP_SCHEME = 'enxoval://';

function handleEnxovalUrl(url: string, router: ReturnType<typeof useRouter>) {
  const parsed = Linking.parse(url);
  if (parsed.hostname === 'invite' || parsed.path === 'invite') {
    const token = parsed.queryParams?.token;
    if (typeof token === 'string' && token.length > 0) {
      router.push(`/(auth)/accept-invite?token=${token}`);
      return true;
    }
  }
  return false;
}

export function useDeepLinks() {
  const router = useRouter();
  const lastSuggestedRef = useRef<string | null>(null);
  const setSuggestion = useClipboardSuggestion((s) => s.setUrl);

  useEffect(() => {
    let disposed = false;

    Linking.getInitialURL().then((url) => {
      if (!disposed && url) handleEnxovalUrl(url, router);
    });

    const sub = Linking.addEventListener('url', ({ url }) => {
      handleEnxovalUrl(url, router);
    });

    return () => {
      disposed = true;
      sub.remove();
    };
  }, [router]);

  useEffect(() => {
    const checkClipboard = async () => {
      try {
        const text = await Clipboard.getStringAsync();
        if (!text) return;
        if (text.startsWith(APP_SCHEME)) return;
        const match = text.match(HTTP_URL);
        if (!match) return;
        const url = match[1];
        if (lastSuggestedRef.current === url) return;
        lastSuggestedRef.current = url;
        setSuggestion(url);
      } catch {
        // clipboard permission can be denied on some platforms; ignore
      }
    };

    checkClipboard();

    const handleChange = (next: AppStateStatus) => {
      if (next === 'active') checkClipboard();
    };

    const sub = AppState.addEventListener('change', handleChange);
    return () => sub.remove();
  }, [setSuggestion]);
}
