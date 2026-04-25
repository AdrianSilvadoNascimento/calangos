import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useRooms } from '../../hooks/use-rooms';
import type { ProductData } from '../../hooks/use-products';
import { useClipboardSuggestion } from '../../stores/clipboard-suggestion';

export default function AddProductScreen() {
  const router = useRouter();
  const { url: urlParam } = useLocalSearchParams<{ url?: string }>();
  const queryClient = useQueryClient();
  const ignoreUrl = useClipboardSuggestion((s) => s.ignoreUrl);
  const dismissSuggestion = useClipboardSuggestion((s) => s.dismiss);

  const { data: rooms } = useRooms();

  const [url, setUrl] = useState(urlParam ?? '');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setUrl(urlParam ?? '');
  }, [urlParam]);

  const handleSubmit = async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      Alert.alert('URL vazia', 'Cole um link de produto.');
      return;
    }
    if (!selectedRoomId) {
      Alert.alert('Escolha um cômodo', 'Selecione onde o item vai ficar.');
      return;
    }

    const cachedQueries = queryClient.getQueriesData<ProductData[]>({
      queryKey: ['products'],
    });
    const alreadyExists = cachedQueries.some(([, data]) =>
      data?.some((p) => p.url === trimmedUrl),
    );
    if (alreadyExists) {
      ignoreUrl(trimmedUrl);
      dismissSuggestion();
      Alert.alert(
        'Link já cadastrado',
        'Esse link já existe na sua lista — não vamos duplicar.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/products', {
        url: trimmedUrl,
        roomId: selectedRoomId,
      });
      ignoreUrl(trimmedUrl);
      dismissSuggestion();
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setUrl('');
      router.setParams({ url: '' });
      router.replace(`/(app)/room/${selectedRoomId}`);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 409) {
        ignoreUrl(trimmedUrl);
        dismissSuggestion();
        queryClient.invalidateQueries({ queryKey: ['products'] });
        Alert.alert(
          'Link já cadastrado',
          err?.response?.data?.message ??
            'Esse link já existe na lista do casal.',
          [{ text: 'OK', onPress: () => router.back() }],
        );
        return;
      }
      Alert.alert(
        'Erro',
        err?.response?.data?.message ?? 'Não foi possível adicionar o produto.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-900">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row items-center px-6 pt-4 pb-4">
            <Pressable onPress={() => router.back()}>
              <Text className="text-primary-400 font-semibold">Cancelar</Text>
            </Pressable>
            <Text className="text-white font-bold text-lg flex-1 text-center">
              Adicionar item
            </Text>
            <View style={{ width: 60 }} />
          </View>

          <View className="px-6">
            <Text className="text-surface-300 text-sm mb-1.5 ml-1">Link do produto</Text>
            <TextInput
              className="bg-surface-800 text-white rounded-xl px-4 py-3.5 text-base mb-6"
              placeholder="https://..."
              placeholderTextColor="#4a7055"
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              multiline
            />

            <Text className="text-surface-300 text-sm mb-2 ml-1">Cômodo</Text>
            {!rooms || rooms.length === 0 ? (
              <Text className="text-surface-500 text-sm mb-6 ml-1">
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
                      className={`rounded-xl px-4 py-3 flex-row items-center ${
                        selected
                          ? 'bg-primary-600'
                          : 'bg-surface-800 active:bg-surface-700'
                      }`}
                    >
                      <Text className="text-lg mr-2">{room.icon ?? '📦'}</Text>
                      <Text
                        className={`font-semibold ${selected ? 'text-white' : 'text-surface-200'}`}
                      >
                        {room.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            <Pressable
              className="w-full bg-primary-600 rounded-2xl py-4 items-center active:bg-primary-700"
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-base">Adicionar</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
