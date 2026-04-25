import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Alert,
  TextInput,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { authClient } from '@enxoval/auth-client';
import { useMyCouple } from '../../hooks/use-my-couple';
import { useCoupleMembers } from '../../hooks/use-couple-members';
import { useUpdateProfile } from '../../hooks/use-update-profile';
import { useUpdateCouple } from '../../hooks/use-update-couple';
import { useQueryClient } from '@tanstack/react-query';

type EditMode = 'name' | 'couple' | null;

export default function ProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session, refetch: refetchSession } = authClient.useSession();
  const { data: couple, refetch: refetchCouple } = useMyCouple();
  const { data: members } = useCoupleMembers();
  const updateProfile = useUpdateProfile();
  const updateCouple = useUpdateCouple();

  const [editMode, setEditMode] = useState<EditMode>(null);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (editMode === 'name') setDraft(session?.user.name ?? '');
    if (editMode === 'couple') setDraft(couple?.name ?? '');
  }, [editMode, session?.user.name, couple?.name]);

  const closeEdit = () => setEditMode(null);

  const handleSave = async () => {
    const value = draft.trim();
    if (!value) {
      Alert.alert('Campo obrigatório', 'Digite um nome.');
      return;
    }
    try {
      if (editMode === 'name') {
        await updateProfile.mutateAsync({ displayName: value });
        await refetchSession();
      } else if (editMode === 'couple') {
        await updateCouple.mutateAsync({ name: value });
        await refetchCouple();
      }
      closeEdit();
    } catch (err: any) {
      Alert.alert(
        'Erro',
        err?.response?.data?.message ?? err?.message ?? 'Não foi possível salvar.',
      );
    }
  };

  const handleLogout = async () => {
    Alert.alert('Sair', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await authClient.signOut();
          queryClient.clear();
          router.replace('/(auth)/sign-in');
        },
      },
    ]);
  };

  const needsInvite = !members || members.count < 2;
  const saving = updateProfile.isPending || updateCouple.isPending;

  return (
    <SafeAreaView className="flex-1 bg-surface-900">
      <View className="px-6 pt-4 pb-6">
        <Text className="text-2xl font-bold text-white">Perfil</Text>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <View className="items-center mb-8">
          <View className="w-20 h-20 rounded-full bg-primary-600 items-center justify-center mb-3">
            <Text className="text-3xl">👤</Text>
          </View>
          <Text className="text-white font-semibold text-lg">
            {session?.user.name ?? '—'}
          </Text>
          <Text className="text-surface-400 text-sm">{session?.user.email ?? '—'}</Text>
        </View>

        <Pressable
          onPress={() => setEditMode('name')}
          className="bg-surface-800 rounded-2xl p-4 mb-3 flex-row items-center justify-between active:bg-surface-700"
        >
          <View className="flex-1 mr-3">
            <Text className="text-surface-400 text-xs uppercase tracking-wide mb-1">
              Seu nome
            </Text>
            <Text className="text-white font-semibold" numberOfLines={1}>
              {session?.user.name?.trim() || 'Toque para definir'}
            </Text>
          </View>
          <Text className="text-primary-400 font-semibold text-sm">Editar</Text>
        </Pressable>

        <Pressable
          onPress={() => setEditMode('couple')}
          className="bg-surface-800 rounded-2xl p-4 mb-4 flex-row items-center justify-between active:bg-surface-700"
        >
          <View className="flex-1 mr-3">
            <Text className="text-surface-400 text-xs uppercase tracking-wide mb-1">
              Enxoval
            </Text>
            <Text className="text-white font-semibold" numberOfLines={1}>
              {couple?.name?.trim() || 'Toque para nomear'}
            </Text>
          </View>
          <Text className="text-primary-400 font-semibold text-sm">Editar</Text>
        </Pressable>

        {needsInvite && (
          <Pressable
            onPress={() => router.push('/(app)/invite')}
            className="bg-primary-600/20 border border-primary-600/40 rounded-2xl p-4 mb-4 active:bg-primary-600/30"
          >
            <Text className="text-primary-300 font-semibold">💌 Convidar cônjuge</Text>
            <Text className="text-primary-400/70 text-xs mt-1">
              Gerar link para o parceiro(a) entrar
            </Text>
          </Pressable>
        )}

        <Pressable className="bg-surface-800 rounded-2xl p-4 mb-4 active:bg-surface-700">
          <Text className="text-white font-semibold">📄 Exportar dados</Text>
          <Text className="text-surface-400 text-xs mt-1">Baixar backup em JSON</Text>
        </Pressable>

        <Pressable
          className="bg-red-900/30 border border-red-800/30 rounded-2xl p-4 items-center active:bg-red-900/50 mb-8"
          onPress={handleLogout}
        >
          <Text className="text-red-400 font-semibold">Sair</Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={editMode !== null}
        transparent
        animationType="slide"
        onRequestClose={closeEdit}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
          <Pressable className="flex-1 bg-black/60" onPress={closeEdit} />
          <View className="bg-surface-900 rounded-t-3xl px-6 pt-6 pb-10 border-t border-surface-700">
            <Text className="text-xl font-bold text-white mb-6">
              {editMode === 'name' ? 'Editar seu nome' : 'Nome do enxoval'}
            </Text>

            <Text className="text-surface-300 text-sm mb-1.5 ml-1">Nome</Text>
            <TextInput
              className="bg-surface-800 text-white rounded-xl px-4 py-3.5 text-base mb-6"
              placeholder={editMode === 'name' ? 'Como devemos te chamar?' : 'Ex: Casa nova'}
              placeholderTextColor="#4a7055"
              value={draft}
              onChangeText={setDraft}
              autoCapitalize="words"
              autoFocus
              onSubmitEditing={handleSave}
              returnKeyType="done"
            />

            <Pressable
              className="w-full bg-primary-600 rounded-2xl py-4 items-center active:bg-primary-700"
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-base">Salvar</Text>
              )}
            </Pressable>

            <Pressable className="w-full py-3 items-center mt-2" onPress={closeEdit}>
              <Text className="text-surface-400 font-semibold">Cancelar</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
