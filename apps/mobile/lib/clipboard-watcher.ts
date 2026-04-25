import * as Clipboard from 'expo-clipboard';
import type { QueryClient } from '@tanstack/react-query';
import { useClipboardSuggestion } from '../stores/clipboard-suggestion';
import type { ProductData } from '../hooks/use-products';

const URL_REGEX = /^https?:\/\//i;

export async function checkClipboardForUrl(queryClient: QueryClient): Promise<void> {
  try {
    const text = (await Clipboard.getStringAsync())?.trim();
    if (!text || !URL_REGEX.test(text)) return;

    const state = useClipboardSuggestion.getState();
    if (state.url === text) return;
    if (state.ignoredUrls.includes(text)) return;

    const queries = queryClient.getQueriesData<ProductData[]>({ queryKey: ['products'] });
    for (const [, data] of queries) {
      if (data?.some((p) => p.url === text)) return;
    }

    state.setUrl(text);
  } catch {
    // Ignore clipboard errors (permission denied, empty, etc.)
  }
}
