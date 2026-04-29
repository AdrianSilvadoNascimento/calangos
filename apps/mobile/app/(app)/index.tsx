import { useCallback, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useQueryClient } from '@tanstack/react-query';
import { useRooms, type RoomData } from '../../hooks/use-rooms';
import { useCreateRoom } from '../../hooks/use-create-room';
import { useUpdateRoom } from '../../hooks/use-update-room';
import { useCoupleMembers } from '../../hooks/use-couple-members';
import { useClipboardSuggestion } from '../../stores/clipboard-suggestion';
import { checkClipboardForUrl } from '../../lib/clipboard-watcher';
import { InfiniteList } from '../../components/infinite-list';
import { useDialog } from '../../components/ui/dialog';
import { reportError } from '../../lib/report-error';

const HTTP_URL = /^(https?:\/\/)/i;

const EMOJI_OPTIONS = [
  '🛋️', '🍳', '🛏️', '🚿', '🧺', '💻', '🌿', '🧹',
  '🪴', '🎮', '🪑', '🍽️', '🛁', '🏋️', '📚', '🎵',
];

export default function RoomsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const dialog = useDialog();
  const roomsQuery = useRooms();
  const { data: members } = useCoupleMembers();
  const createRoom = useCreateRoom();
  const updateRoom = useUpdateRoom();

  useFocusEffect(
    useCallback(() => {
      checkClipboardForUrl(queryClient);
    }, [queryClient]),
  );

  const suggestedUrl = useClipboardSuggestion((s) => s.url);
  const dismissSuggestion = useClipboardSuggestion((s) => s.dismiss);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomData | null>(null);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomIcon, setNewRoomIcon] = useState('📦');

  const handlePasteLink = async () => {
    try {
      const text = (await Clipboard.getStringAsync())?.trim();
      if (!text || !HTTP_URL.test(text)) {
        await dialog.alert({
          title: 'Clipboard vazio',
          message: 'Copie um link de produto (https://...) antes de tocar em Colar.',
        });
        return;
      }
      router.push(`/(app)/add-product?url=${encodeURIComponent(text)}`);
    } catch (err: any) {
      reportError(err, { action: 'clipboard.read' });
      await dialog.alert({ title: 'Erro', message: err?.message ?? 'Não foi possível ler o clipboard.' });
    }
  };

  const handleOpenSuggestion = () => {
    if (!suggestedUrl) return;
    router.push(`/(app)/add-product?url=${encodeURIComponent(suggestedUrl)}`);
  };

  const handleSaveRoom = async () => {
    const name = newRoomName.trim();
    if (!name) {
      await dialog.alert({ title: 'Nome obrigatório', message: 'Digite o nome do cômodo.' });
      return;
    }
    try {
      if (editingRoom) {
        await updateRoom.mutateAsync({
          id: editingRoom.id,
          name,
          icon: newRoomIcon || undefined,
        });
      } else {
        await createRoom.mutateAsync({ name, icon: newRoomIcon || undefined });
      }
      closeRoomModal();
    } catch (err: any) {
      reportError(err, {
        action: editingRoom ? 'room.update' : 'room.create',
      });
      await dialog.alert({
        title: 'Erro',
        message:
          err?.response?.data?.message ??
          (editingRoom
            ? 'Não foi possível atualizar o cômodo.'
            : 'Não foi possível criar o cômodo.'),
      });
    }
  };

  const openNewRoomModal = () => {
    setEditingRoom(null);
    setNewRoomName('');
    setNewRoomIcon('📦');
    setModalVisible(true);
  };

  const openEditRoomModal = (room: RoomData) => {
    setEditingRoom(room);
    setNewRoomName(room.name);
    setNewRoomIcon(room.icon ?? '📦');
    setModalVisible(true);
  };

  const closeRoomModal = () => {
    setModalVisible(false);
    setEditingRoom(null);
    setNewRoomName('');
    setNewRoomIcon('📦');
  };

  const needsInvite = !members || members.count < 2;
  const totalRooms =
    roomsQuery.data?.pages.reduce((acc, p) => acc + p.items.length, 0) ?? 0;

  const ListHeader = (
    <View>
      <View className="px-6 pt-4 pb-6">
        <Text className="text-2xl font-bold text-white">Cômodos</Text>
        <Text className="text-surface-400 mt-1">
          {roomsQuery.data
            ? `${totalRooms}${roomsQuery.hasNextPage ? '+' : ''} cômodos · segure para editar`
            : ' '}
        </Text>
      </View>

      {suggestedUrl && (
        <View className="mx-6 mb-4 bg-amber-900/30 border border-amber-700/40 rounded-2xl p-4">
          <Text className="text-amber-300 font-semibold text-sm mb-1">
            Link copiado detectado
          </Text>
          <Text className="text-amber-200/80 text-xs mb-3" numberOfLines={2}>
            {suggestedUrl}
          </Text>
          <View className="flex-row gap-2">
            <Pressable
              onPress={handleOpenSuggestion}
              className="flex-1 bg-amber-600 rounded-lg py-2 items-center active:bg-amber-700"
            >
              <Text className="text-white font-semibold text-sm">Adicionar item</Text>
            </Pressable>
            <Pressable
              onPress={dismissSuggestion}
              className="bg-surface-800 rounded-lg py-2 px-4 items-center active:bg-surface-700"
            >
              <Text className="text-surface-300 font-semibold text-sm">Ignorar</Text>
            </Pressable>
          </View>
        </View>
      )}

      {needsInvite && (
        <Pressable
          onPress={() => router.push('/(app)/invite')}
          className="mx-6 mb-4 bg-primary-600/10 border border-primary-600/40 rounded-2xl p-4 flex-row items-center active:bg-primary-600/20"
        >
          <Text className="text-2xl mr-3">💌</Text>
          <View className="flex-1">
            <Text className="text-primary-300 font-semibold text-sm">
              Convidar cônjuge
            </Text>
            <Text className="text-primary-400/70 text-xs mt-0.5">
              Seu parceiro(a) ainda não entrou. Gere um link →
            </Text>
          </View>
        </Pressable>
      )}

      <Pressable
        onPress={handlePasteLink}
        className="mx-6 mb-4 bg-primary-600/20 border border-primary-600/30 rounded-2xl p-4 flex-row items-center active:bg-primary-600/30"
      >
        <Text className="text-2xl mr-3">📋</Text>
        <View className="flex-1">
          <Text className="text-primary-300 font-semibold text-sm">Colar link</Text>
          <Text className="text-primary-400/70 text-xs mt-0.5">
            Copie um link de produto e cole aqui
          </Text>
        </View>
      </Pressable>
    </View>
  );

  const ListFooter = !roomsQuery.hasNextPage ? (
    <View className="px-6 pb-8 pt-2">
      <Pressable
        className="w-full bg-surface-800/50 rounded-2xl p-4 border border-dashed border-surface-600 items-center justify-center active:bg-surface-800"
        onPress={openNewRoomModal}
      >
        <Text className="text-3xl mb-2 text-surface-500">＋</Text>
        <Text className="text-surface-400 font-semibold text-sm">Novo cômodo</Text>
      </Pressable>
    </View>
  ) : (
    <View className="h-8" />
  );

  return (
    <SafeAreaView className="flex-1 bg-surface-900">
      <InfiniteList<RoomData>
        query={roomsQuery}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ paddingHorizontal: 24, gap: 12 }}
        contentContainerStyle={{ paddingBottom: 16 }}
        ListHeaderComponent={ListHeader}
        ListFooterExtra={ListFooter}
        emptyTitle="Nenhum cômodo ainda"
        emptySubtitle={'Toque em "Novo cômodo" para começar.'}
        emptyIcon="🏠"
        errorTitle="Erro ao carregar cômodos"
        renderItem={({ item: room }) => (
          <Pressable
            className="flex-1 bg-surface-800 rounded-2xl p-4 mb-3 active:bg-surface-700"
            onPress={() => router.push(`/(app)/room/${room.id}`)}
            onLongPress={() => openEditRoomModal(room)}
            delayLongPress={350}
          >
            <Text className="text-3xl mb-3">{room.icon ?? '📦'}</Text>
            <Text className="text-white font-semibold text-sm">{room.name}</Text>
            <Text className="text-surface-500 text-xs mt-1">
              {room.productCount} {room.productCount === 1 ? 'item' : 'itens'}
            </Text>
          </Pressable>
        )}
      />

      {/* New / Edit Room Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeRoomModal}
        statusBarTranslucent
      >
        <KeyboardAvoidingView behavior="padding" className="flex-1">
          <Pressable className="flex-1 bg-black/60" onPress={closeRoomModal} />
          <View className="bg-surface-900 rounded-t-3xl px-6 pt-6 pb-10 border-t border-surface-700">
            <Text className="text-xl font-bold text-white mb-6">
              {editingRoom ? 'Editar cômodo' : 'Novo cômodo'}
            </Text>

            <Text className="text-surface-300 text-sm mb-1.5 ml-1">Nome</Text>
            <TextInput
              className="bg-surface-800 text-white rounded-xl px-4 py-3.5 text-base mb-4"
              placeholder="Ex: Sala de jantar"
              placeholderTextColor="#4a7055"
              value={newRoomName}
              onChangeText={setNewRoomName}
              autoCapitalize="sentences"
              autoFocus
            />

            <Text className="text-surface-300 text-sm mb-2 ml-1">Ícone</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-6"
            >
              <View className="flex-row gap-2">
                {EMOJI_OPTIONS.map((emoji) => (
                  <Pressable
                    key={emoji}
                    onPress={() => setNewRoomIcon(emoji)}
                    className={`w-12 h-12 rounded-xl items-center justify-center ${
                      newRoomIcon === emoji
                        ? 'bg-primary-600/30 border border-primary-500'
                        : 'bg-surface-800'
                    }`}
                  >
                    <Text className="text-2xl">{emoji}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <Pressable
              className="w-full bg-primary-600 rounded-2xl py-4 items-center active:bg-primary-700"
              onPress={handleSaveRoom}
              disabled={createRoom.isPending || updateRoom.isPending}
            >
              {createRoom.isPending || updateRoom.isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-base">
                  {editingRoom ? 'Salvar' : 'Criar cômodo'}
                </Text>
              )}
            </Pressable>

            <Pressable
              className="w-full py-3 items-center mt-2"
              onPress={closeRoomModal}
            >
              <Text className="text-surface-400 font-semibold">Cancelar</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
