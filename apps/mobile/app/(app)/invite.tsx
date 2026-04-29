import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { InviteLinkCard } from '../../components/invite-link-card';
import { useCreateInvite, type InviteData } from '../../hooks/use-invite';
import { useDialog } from '../../components/ui/dialog';
import { reportError } from '../../lib/report-error';

export default function InviteScreen() {
  const router = useRouter();
  const dialog = useDialog();
  const [email, setEmail] = useState('');
  const [invite, setInvite] = useState<InviteData | null>(null);

  const createInvite = useCreateInvite();

  useEffect(() => {
    // generate a link with no email upfront so the user sees it immediately
    createInvite.mutate(undefined, {
      onSuccess: (data) => setInvite(data),
      onError: async (err: any) => {
        reportError(err, { action: 'invite.create.initial' });
        await dialog.alert({
          title: 'Erro',
          message: err?.response?.data?.message ?? 'Não foi possível gerar o convite.',
        });
        router.back();
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRegenerate = async () => {
    if (!email.trim()) {
      await dialog.alert({ title: 'Email vazio', message: 'Digite o email do cônjuge.' });
      return;
    }
    try {
      const data = await createInvite.mutateAsync(email.trim());
      setInvite(data);
    } catch (err: any) {
      reportError(err, { action: 'invite.regenerate' });
      await dialog.alert({ title: 'Erro', message: err?.response?.data?.message ?? 'Falhou.' });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-900">
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <ScrollView
          contentContainerStyle={{ paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row items-center px-6 pt-4 pb-4">
            <Pressable onPress={() => router.back()}>
              <Text className="text-primary-400 font-semibold">Voltar</Text>
            </Pressable>
            <Text className="text-white font-bold text-lg flex-1 text-center">
              Convidar cônjuge
            </Text>
            <View style={{ width: 60 }} />
          </View>

          <View className="px-6">
            <Text className="text-surface-400 mb-6">
              Envie o link abaixo para seu parceiro(a). Ele(a) abre no celular, cria uma senha e entra direto no enxoval.
            </Text>

            {!invite ? (
              <View className="bg-surface-800 rounded-2xl p-6 items-center">
                <ActivityIndicator color="#4ade80" />
              </View>
            ) : (
              <InviteLinkCard link={invite.link} email={invite.email} />
            )}

            <View className="mt-8">
              <Text className="text-surface-300 text-sm mb-1.5 ml-1">
                Ou gere um link com email específico
              </Text>
              <TextInput
                className="bg-surface-800 text-white rounded-xl px-4 py-3.5 text-base mb-3"
                placeholder="parceiro@email.com"
                placeholderTextColor="#4a7055"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <Pressable
                className="w-full bg-surface-800 border border-surface-700 rounded-xl py-3 items-center active:bg-surface-700"
                onPress={handleRegenerate}
                disabled={createInvite.isPending}
              >
                {createInvite.isPending ? (
                  <ActivityIndicator color="#4ade80" />
                ) : (
                  <Text className="text-primary-300 font-semibold">
                    Atualizar link com email
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
