import { View, Text, TextInput, Pressable, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { api } from '../../lib/api';

export default function JoinCoupleScreen() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    const code = inviteCode.trim().toUpperCase();
    if (code.length !== 8) {
      Alert.alert('Código inválido', 'O código deve ter 8 caracteres.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/couples/join', { inviteCode: code });
      router.replace('/(app)');
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.message ?? 'Código inválido ou expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-900">
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingBottom: 16 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
    <View className="px-8 py-8">
      <Text className="text-3xl font-bold text-white mb-2">Entrar no casal</Text>
      <Text className="text-surface-400 mb-8">
        Insira o código que seu parceiro(a) compartilhou
      </Text>

      <View className="mb-8">
        <Text className="text-surface-300 text-sm mb-1.5 ml-1">Código de convite</Text>
        <TextInput
          className="bg-surface-800 text-white rounded-xl px-4 py-3.5 text-base font-mono tracking-widest text-center"
          placeholder="XXXXXXXX"
          placeholderTextColor="#4a7055"
          value={inviteCode}
          onChangeText={(t) => setInviteCode(t.toUpperCase())}
          autoCapitalize="characters"
          maxLength={8}
        />
      </View>

      <Pressable
        className="w-full bg-primary-600 rounded-2xl py-4 items-center mb-4 active:bg-primary-700"
        onPress={handleJoin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold text-base">Entrar</Text>
        )}
      </Pressable>

      <Pressable onPress={() => router.push('/(onboarding)/create-couple')}>
        <Text className="text-surface-400 text-center">
          Prefere criar um novo?{' '}
          <Text className="text-primary-400 font-semibold">Criar casal</Text>
        </Text>
      </Pressable>
    </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
