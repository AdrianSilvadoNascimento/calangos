import { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useQueryClient } from '@tanstack/react-query';
import { useRooms, type RoomData } from '../../../hooks/use-rooms';
import { useCreateRoom } from '../../../hooks/use-create-room';
import { useUpdateRoom } from '../../../hooks/use-update-room';
import { useCoupleMembers } from '../../../hooks/use-couple-members';
import { checkClipboardForUrl } from '../../../lib/clipboard-watcher';
import { InfiniteList } from '../../../components/infinite-list';
import { reportError } from '../../../lib/report-error';
import {
  Button,
  Card,
  Icon,
  Input,
  NewTile,
  Sheet,
  Tile,
  type IconName,
  useDialog,
} from '../../../components/ui';

const HTTP_URL = /^(https?:\/\/)/i;

// Mapeamento emoji → nome do ícone (DESIGN_SYSTEM §5)
const EMOJI_TO_ICON: Record<string, IconName> = {
  '🛋️': 'armchair',
  '🍳': 'utensils-crossed',
  '🛏️': 'bed',
  '🚿': 'bath',
  '🧺': 'shirt',
  '💻': 'laptop',
  '🌿': 'leaf',
  '🧹': 'brush',
  '🪴': 'flower',
  '🎮': 'gamepad',
  '🪑': 'armchair',
  '🍽️': 'utensils',
  '🛁': 'bath',
  '🏋️': 'dumbbell',
  '📚': 'book',
  '🎵': 'music',
};

const EMOJI_OPTIONS = [
  '🛋️', '🍳', '🛏️', '🚿', '🧺', '💻', '🌿', '🧹',
  '🪴', '🎮', '🪑', '🍽️', '🛁', '🏋️', '📚', '🎵',
];

const ROOM_COLORS = ['#34B26C', '#E89784', '#7FB6D9', '#D9B370', '#D98A99', '#5FCB8B'];

function getRoomColor(index: number) {
  return ROOM_COLORS[index % ROOM_COLORS.length] ?? ROOM_COLORS[0]!;
}

function iconFor(emoji?: string | null): IconName {
  return (emoji && EMOJI_TO_ICON[emoji]) || 'package';
}

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

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomData | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftIcon, setDraftIcon] = useState('📦');

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
      await dialog.alert({ title: 'Ops, não rolou', message: err?.message ?? 'Não foi possível ler o clipboard.' });
    }
  };

  const handleSaveRoom = async () => {
    const name = draftName.trim();
    if (!name) {
      await dialog.alert({ title: 'Nome obrigatório', message: 'Digite o nome do cômodo.' });
      return;
    }
    try {
      if (editingRoom) {
        await updateRoom.mutateAsync({ id: editingRoom.id, name, icon: draftIcon || undefined });
      } else {
        await createRoom.mutateAsync({ name, icon: draftIcon || undefined });
      }
      closeSheet();
    } catch (err: any) {
      reportError(err, { action: editingRoom ? 'room.update' : 'room.create' });
      await dialog.alert({
        title: 'Ops, não rolou',
        message:
          err?.response?.data?.message ??
          (editingRoom ? 'Não foi possível atualizar o cômodo.' : 'Não foi possível criar o cômodo.'),
      });
    }
  };

  const openNewSheet = () => {
    setEditingRoom(null);
    setDraftName('');
    setDraftIcon('📦');
    setSheetOpen(true);
  };

  const openEditSheet = (room: RoomData) => {
    setEditingRoom(room);
    setDraftName(room.name);
    setDraftIcon(room.icon ?? '📦');
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setEditingRoom(null);
    setDraftName('');
    setDraftIcon('📦');
  };

  const needsInvite = !members || members.count < 2;
  const totalRooms = roomsQuery.data?.pages.reduce((acc, p) => acc + p.items.length, 0) ?? 0;
  const saving = createRoom.isPending || updateRoom.isPending;

  const ListHeader = (
    <View>
      <View className="px-6 pt-4 pb-4">
        <Text
          className="text-ink-3 font-semibold mb-1"
          style={{ fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase' }}
        >
          Seu enxoval
        </Text>
        <Text className="text-ink-1 text-2xl font-bold" style={{ letterSpacing: -0.5 }}>
          Cômodos
        </Text>
        <Text className="text-ink-3 text-sm mt-1">
          {roomsQuery.data
            ? `${totalRooms}${roomsQuery.hasNextPage ? '+' : ''} cômodos · segure para editar`
            : ' '}
        </Text>
      </View>

      {needsInvite && (
        <Pressable
          onPress={() => router.push('/(app)/invite')}
          className="mx-6 mb-3 active:opacity-80"
        >
          <Card variant="elevated" className="flex-row items-center" padding="md">
            <View
              className="rounded-xl items-center justify-center mr-3"
              style={{ width: 40, height: 40, backgroundColor: '#E897841F' }}
            >
              <Icon name="mail" tone="coral" size={18} />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center" style={{ gap: 8 }}>
                <Text className="text-ink-1 font-semibold text-sm">Convide seu calanguinho</Text>
                <Icon name="arrow-right" tone="coral" size={18} outline />
              </View>
              <Text className="text-ink-3 text-xs mt-0.5">Organize o enxoval juntinhos</Text>
            </View>
          </Card>
        </Pressable>
      )}

      <Pressable onPress={handlePasteLink} className="mx-6 mb-4 active:opacity-80">
        <Card variant="elevated" className="flex-row items-center" padding="md">
          <View
            className="rounded-xl items-center justify-center mr-3"
            style={{ width: 40, height: 40, backgroundColor: '#34B26C1F' }}
          >
            <Icon name="link" tone="brand" size={18} />
          </View>
          <View className="flex-1">
            <Text className="text-ink-1 font-semibold text-sm">Colar link</Text>
            <Text className="text-ink-3 text-xs mt-0.5">Cole o link de um produto aqui</Text>
          </View>
        </Card>
      </Pressable>
    </View>
  );

  const ListFooter = !roomsQuery.hasNextPage ? (
    <View className="px-6 pb-8 pt-2">
      <NewTile label="Novo cômodo" onPress={openNewSheet} />
    </View>
  ) : (
    <View className="h-8" />
  );

  return (
    <SafeAreaView className="flex-1 bg-bg-1">
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
        emptyMascot="juntos"
        errorTitle="Ops, não rolou carregar"
        renderItem={({ item: room, index }) => {
          const color = getRoomColor(index);
          const productCount = room.productCount ?? 0;
          return (
            <View className="flex-1 mb-3">
              <Tile
                icon={iconFor(room.icon)}
                iconColor={color}
                title={room.name}
                subtitle={`${productCount} ${productCount === 1 ? 'item' : 'itens'}`}
                progress={0}
                onPress={() => router.push(`/(app)/room/${room.id}`)}
                onLongPress={() => openEditSheet(room)}
              />
            </View>
          );
        }}
      />

      {/* New / Edit Room Sheet */}
      <Sheet
        open={sheetOpen}
        onClose={closeSheet}
        title={editingRoom ? 'Editar cômodo' : 'Novo cômodo'}
        scrollable={false}
        dismissable={!saving}
      >
        <Input
          label="Nome"
          placeholder="Ex: Sala de jantar"
          value={draftName}
          onChangeText={setDraftName}
          autoCapitalize="sentences"
          autoFocus
        />

        <Text
          className="text-ink-3 font-semibold mt-5 mb-2 ml-0.5"
          style={{ fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase' }}
        >
          Ícone
        </Text>
        {/* Grid 5 colunas (DESIGN_SYSTEM §6 + HI-FI §41) */}
        <View className="flex-row flex-wrap" style={{ gap: 8 }}>
          {EMOJI_OPTIONS.map((emoji) => {
            const selected = draftIcon === emoji;
            return (
              <Pressable
                key={emoji}
                onPress={() => setDraftIcon(emoji)}
                accessibilityRole="button"
                accessibilityLabel={`Ícone ${emoji}`}
                className="rounded-xl items-center justify-center active:opacity-80"
                style={{
                  width: '18%',
                  aspectRatio: 1,
                  backgroundColor: selected ? '#34B26C1F' : '#122820',
                  borderWidth: selected ? 1.5 : 1,
                  borderColor: selected ? '#34B26C' : '#1B3326',
                }}
              >
                <Text className="text-2xl">{emoji}</Text>
              </Pressable>
            );
          })}
        </View>

        <View className="mt-6">
          <Button
            label={editingRoom ? 'Salvar cômodo' : 'Criar cômodo'}
            onPress={handleSaveRoom}
            loading={saving}
          />
        </View>
        <View className="mt-2">
          <Button label="Cancelar" variant="ghost" onPress={closeSheet} disabled={saving} />
        </View>
      </Sheet>
    </SafeAreaView>
  );
}
