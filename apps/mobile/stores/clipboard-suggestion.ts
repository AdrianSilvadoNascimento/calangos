import { create } from 'zustand';

interface ClipboardSuggestionState {
  url: string | null;
  ignoredUrls: string[];
  setUrl: (url: string | null) => void;
  dismiss: () => void;
  ignoreUrl: (url: string) => void;
}

export const useClipboardSuggestion = create<ClipboardSuggestionState>((set) => ({
  url: null,
  ignoredUrls: [],
  setUrl: (url) => set({ url }),
  dismiss: () => set((state) => ({ url: null, ignoredUrls: state.url ? [...state.ignoredUrls, state.url] : state.ignoredUrls })),
  ignoreUrl: (url) => set((state) => ({ ignoredUrls: [...state.ignoredUrls, url], url: state.url === url ? null : state.url })),
}));
