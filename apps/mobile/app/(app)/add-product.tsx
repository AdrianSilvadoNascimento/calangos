import { View, Text, Image, Pressable, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import type { Paginated, ProductPreviewResponse } from '@enxoval/contracts';
import { api } from '../../lib/api';
import { useRooms } from '../../hooks/use-rooms';
import type { ProductData } from '../../hooks/use-products';
import { useClipboardSuggestion } from '../../stores/clipboard-suggestion';
import { reportError } from '../../lib/report-error';
import { Button, Icon, Input, LinkButton, useDialog } from '../../components/ui';

type PreviewState = {
  title: string | null;
  image: string | null;
  priceCents: number | null;
  storeName: string;
  storeNameConfident: boolean;
  description: string | null;
};

function formatBRL(cents: number) {
  const value = (cents / 100).toFixed(2).replace('.', ',');
  return `R$ ${value}`;
}

export default function AddProductScreen() {
  const router = useRouter();
  const dialog = useDialog();
  const { url: urlParam } = useLocalSearchParams<{ url?: string }>();
  const queryClient = useQueryClient();
  const ignoreUrl = useClipboardSuggestion((s) => s.ignoreUrl);
  const dismissSuggestion = useClipboardSuggestion((s) => s.dismiss);

  const roomsQuery = useRooms();
  const rooms = roomsQuery.data?.pages.flatMap((p) => p.items) ?? [];

  const [url, setUrl] = useState(urlParam ?? '');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [description, setDescription] = useState('');
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const storeNameTouched = useRef(false);
  const descriptionTouched = useRef(false);
  const lastPreviewedUrl = useRef<string | null>(null);
  // URLs vindas do clipboard (urlParam) já são URLs completas — não vale esperar
  // o debounce de digitação. Pulamos direto para o fetch.
  const skipDebounceFor = useRef<string | null>(urlParam?.trim() || null);

  useEffect(() => {
    setUrl(urlParam ?? '');
    if (urlParam) skipDebounceFor.current = urlParam.trim();
  }, [urlParam]);

  useEffect(() => {
    const trimmed = url.trim();
    if (!trimmed || !/^https?:\/\/\S+/i.test(trimmed)) return;
    if (lastPreviewedUrl.current === trimmed) return;

    const immediate = skipDebounceFor.current === trimmed;
    skipDebounceFor.current = null;

    const runPreview = async () => {
      lastPreviewedUrl.current = trimmed;
      setPreviewing(true);
      setPreviewError(false);
      try {
        const { data } = await api.get<ProductPreviewResponse>('/products/preview', {
          params: { url: trimmed },
        });
        setPreview({
          title: data.title,
          image: data.image,
          priceCents: data.priceCents,
          storeName: data.storeName,
          storeNameConfident: data.storeNameConfident,
          description: data.description,
        });
        if (!storeNameTouched.current && data.storeNameConfident) {
          setStoreName(data.storeName);
        }
        if (!descriptionTouched.current && data.description) {
          setDescription(data.description);
        }
      } catch (err) {
        setPreviewError(true);
        reportError(err, { action: 'product.preview' });
      } finally {
        setPreviewing(false);
      }
    };

    if (immediate) {
      runPreview();
      return;
    }

    const handle = setTimeout(runPreview, 600);
    return () => clearTimeout(handle);
  }, [url]);

  const handleUrlChange = (next: string) => {
    setUrl(next);
    if (next.trim() !== lastPreviewedUrl.current) {
      storeNameTouched.current = false;
      descriptionTouched.current = false;
      setStoreName('');
      setDescription('');
      setPreview(null);
      setPreviewError(false);
    }
  };

  const handleStoreNameChange = (next: string) => {
    storeNameTouched.current = true;
    setStoreName(next);
  };

  const handleDescriptionChange = (next: string) => {
    descriptionTouched.current = true;
    setDescription(next);
  };

  const handleSubmit = async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      await dialog.alert({ title: 'URL vazia', message: 'Cole um link de produto.' });
      return;
    }
    if (!selectedRoomId) {
      await dialog.alert({ title: 'Escolha um cômodo', message: 'Selecione onde o item vai ficar.' });
      return;
    }

    const cachedQueries = queryClient.getQueriesData<
      InfiniteData<Paginated<ProductData>>
    >({ queryKey: ['products'] });
    const alreadyExists = cachedQueries.some(([, data]) =>
      data?.pages.some((page) => page.items.some((p) => p.url === trimmedUrl)),
    );
    if (alreadyExists) {
      ignoreUrl(trimmedUrl);
      dismissSuggestion();
      await dialog.alert({
        title: 'Link já cadastrado',
        message: 'Esse link já existe na sua lista — não vamos duplicar.',
      });
      router.back();
      return;
    }

    setSubmitting(true);
    try {
      const trimmedStore = storeName.trim();
      const trimmedDescription = description.trim();
      await api.post('/products', {
        url: trimmedUrl,
        roomId: selectedRoomId,
        ...(trimmedStore ? { storeName: trimmedStore } : null),
        ...(trimmedDescription ? { description: trimmedDescription } : null),
      });
      ignoreUrl(trimmedUrl);
      dismissSuggestion();
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setUrl('');
      setStoreName('');
      setDescription('');
      setPreview(null);
      setPreviewError(false);
      storeNameTouched.current = false;
      descriptionTouched.current = false;
      lastPreviewedUrl.current = null;
      router.setParams({ url: '' });
      router.replace(`/(app)/room/${selectedRoomId}`);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 409) {
        ignoreUrl(trimmedUrl);
        dismissSuggestion();
        queryClient.invalidateQueries({ queryKey: ['products'] });
        await dialog.alert({
          title: 'Link já cadastrado',
          message: err?.response?.data?.message ?? 'Esse link já existe na lista do casal.',
        });
        router.back();
        return;
      }
      reportError(err, { action: 'product.add' });
      await dialog.alert({
        title: 'Ops, não rolou',
        message: err?.response?.data?.message ?? 'Não foi possível adicionar o produto.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-1">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row items-center px-4 pt-2 pb-4">
            <View className="flex-1">
              <LinkButton leftIcon="arrow-left" label="Voltar" onPress={() => router.back()} />
            </View>
            <Text className="text-ink-1 font-bold text-lg flex-1 text-center">
              Adicionar item
            </Text>
            <View className="flex-1" />
          </View>

          <View className="px-6">
            <Input
              label={previewing ? 'Link do produto (procurando…)' : 'Link do produto'}
              leftIcon="link"
              placeholder="https://..."
              value={url}
              onChangeText={handleUrlChange}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />

            {(previewing || preview || previewError) && (
              <View className="mt-5">
                <PreviewCard
                  loading={previewing}
                  preview={preview}
                  error={previewError}
                  url={url.trim()}
                />
              </View>
            )}

            <View className="mt-5">
              <Input
                label="Loja"
                leftIcon="store"
                placeholder="Ex.: Shopee, Amazon, Mercado Livre"
                value={storeName}
                onChangeText={handleStoreNameChange}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            <View className="mt-5">
              <Input
                label="Descrição"
                placeholder="Pra que serve, tamanho, observações…"
                value={description}
                onChangeText={handleDescriptionChange}
                multiline
                minHeight={120}
                autoCapitalize="sentences"
              />
            </View>

            <Text
              className="text-ink-3 font-semibold mt-6 mb-3 ml-0.5"
              style={{ fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase' }}
            >
              Cômodo
            </Text>
            {!rooms || rooms.length === 0 ? (
              <Text className="text-ink-4 text-sm mb-6 ml-1">
                Nenhum cômodo cadastrado.
              </Text>
            ) : (
              <View className="flex-row flex-wrap mb-8" style={{ gap: 8 }}>
                {rooms.map((room) => {
                  const selected = selectedRoomId === room.id;
                  return (
                    <Pressable
                      key={room.id}
                      onPress={() => setSelectedRoomId(room.id)}
                      accessibilityRole="button"
                      accessibilityLabel={room.name}
                      className="rounded-2xl px-4 py-3 flex-row items-center active:opacity-80"
                      style={{
                        backgroundColor: selected ? '#34B26C' : '#122820',
                        borderWidth: 1,
                        borderColor: selected ? '#34B26C' : '#1B3326',
                      }}
                    >
                      <Text className="text-lg mr-2">{room.icon ?? '📦'}</Text>
                      <Text
                        className="font-semibold text-sm"
                        style={{ color: selected ? '#04140A' : '#C2D0C5' }}
                      >
                        {room.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            <Button label="Adicionar item" onPress={handleSubmit} loading={submitting} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function PreviewCard({
  loading,
  preview,
  error,
  url,
}: {
  loading: boolean;
  preview: PreviewState | null;
  error: boolean;
  url: string;
}) {
  if (loading && !preview) {
    return (
      <View className="bg-bg-2 border border-line-1 rounded-2xl p-4 flex-row items-center" style={{ gap: 12 }}>
        <View
          className="rounded-xl"
          style={{ width: 64, height: 64, backgroundColor: '#18372C' }}
        />
        <View className="flex-1">
          <View className="rounded-md mb-2" style={{ height: 14, width: '70%', backgroundColor: '#18372C' }} />
          <View className="rounded-md" style={{ height: 12, width: '40%', backgroundColor: '#122820' }} />
        </View>
      </View>
    );
  }

  if (error && !preview) {
    return (
      <View className="bg-bg-2 border border-line-1 rounded-2xl p-4 flex-row items-center" style={{ gap: 12 }}>
        <Icon name="alert-circle" tone="coral" size={20} outline />
        <Text className="text-ink-2 text-xs flex-1">
          Não rolou buscar a prévia. Preencha os campos abaixo e seguimos.
        </Text>
      </View>
    );
  }

  if (!preview) return null;

  const headline = preview.title || preview.storeName || url;

  return (
    <View className="bg-bg-2 border border-line-1 rounded-2xl p-4">
      <View className="flex-row items-start" style={{ gap: 12 }}>
        {preview.image ? (
          <Image
            source={{ uri: preview.image }}
            className="rounded-xl"
            style={{ width: 64, height: 64, backgroundColor: '#18372C' }}
            resizeMode="cover"
          />
        ) : (
          <View
            className="rounded-xl items-center justify-center"
            style={{ width: 64, height: 64, backgroundColor: '#18372C' }}
          >
            <Icon name="image" tone="ink-3" size={22} outline />
          </View>
        )}
        <View className="flex-1">
          <Text className="text-ink-1 font-semibold text-base" numberOfLines={2}>
            {headline}
          </Text>
          {preview.storeName && (
            <Text className="text-ink-3 text-xs mt-0.5" numberOfLines={1}>
              {preview.storeName}
            </Text>
          )}
          {preview.priceCents != null && (
            <Text className="text-brand-300 font-bold text-base mt-1">
              {formatBRL(preview.priceCents)}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
