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
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { InviteLinkCard } from '../../components/invite-link-card';
import { useCreateInvite, type InviteData } from '../../hooks/use-invite';
import type { CoupleData } from '../../hooks/use-my-couple';

export default function CreateCoupleScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [trousseauName, setTrousseauName] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [invite, setInvite] = useState<InviteData | null>(null);

  const createInvite = useCreateInvite();

  const handleCreate = async () => {
    setLoading(true);
    try {
      const { data: couple } = await api.post<CoupleData>('/couples', {
        name: trousseauName.trim() || undefined,
      });
      queryClient.setQueryData(['couple'], couple);
      await queryClient.refetchQueries({ queryKey: ['rooms'] });

      if (partnerEmail.trim()) {
        const data = await createInvite.mutateAsync(partnerEmail.trim());
        setInvite(data);
      } else {
        router.replace('/(app)');
      }
    } catch (err: any) {
      Alert.alert(
        'Erro',
        err?.response?.data?.message ?? 'Não foi possível criar o enxoval.',
      );
    } finally {
      setLoading(false);
    }
  };

  if (invite) {
    return (
      <SafeAreaView className="flex-1 bg-surface-900">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 32, paddingTop: 48 }}
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-3xl font-bold text-white mb-2">Enxoval criado! 🎉</Text>
          <Text className="text-surface-400 mb-6">
            Copie o link abaixo e envie para seu parceiro(a). Ao abrir o link, ele(a) criará uma senha e entra automaticamente no enxoval.
          </Text>

          <InviteLinkCard link={invite.link} email={invite.email ?? partnerEmail} />

          <Pressable
            className="w-full bg-primary-600/20 border border-primary-600/40 rounded-2xl py-4 items-center mt-6 active:bg-primary-600/30"
            onPress={() => router.replace('/(app)')}
          >
            <Text className="text-primary-300 font-semibold text-base">Continuar</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-900">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingBottom: 16 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="px-8 py-8">
            <Text className="text-3xl font-bold text-white mb-2">Seu enxoval</Text>
            <Text className="text-surface-400 mb-8">
              Você não precisa colocar o nome do casal agora — o convite já deixa tudo pronto quando seu parceiro(a) entrar.
            </Text>

            <View className="mb-4">
              <Text className="text-surface-300 text-sm mb-1.5 ml-1">
                Nome do enxoval (opcional)
              </Text>
              <TextInput
                className="bg-surface-800 text-white rounded-xl px-4 py-3.5 text-base"
                placeholder="Ex: Enxoval do Apê Novo"
                placeholderTextColor="#4a7055"
                value={trousseauName}
                onChangeText={setTrousseauName}
                autoCapitalize="sentences"
              />
            </View>

            <View className="mb-8">
              <Text className="text-surface-300 text-sm mb-1.5 ml-1">
                Email do cônjuge (opcional)
              </Text>
              <TextInput
                className="bg-surface-800 text-white rounded-xl px-4 py-3.5 text-base"
                placeholder="parceiro@email.com"
                placeholderTextColor="#4a7055"
                value={partnerEmail}
                onChangeText={setPartnerEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <Text className="text-surface-500 text-xs mt-1 ml-1">
                Vamos gerar um link pra você copiar e enviar. Pode configurar depois.
              </Text>
            </View>

            <Pressable
              className="w-full bg-primary-600 rounded-2xl py-4 items-center mb-4 active:bg-primary-700"
              onPress={handleCreate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-base">Criar enxoval</Text>
              )}
            </Pressable>

            <Pressable onPress={() => router.push('/(onboarding)/join-couple')}>
              <Text className="text-surface-400 text-center">
                Já tem um código?{' '}
                <Text className="text-primary-400 font-semibold">Entrar com código</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
