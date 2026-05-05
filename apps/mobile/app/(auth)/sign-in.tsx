import { View, Text, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import * as Sentry from '@sentry/react-native';
import { authClient } from '@enxoval/auth-client';
import { clientEnv } from '@enxoval/env/client';
import { useDialog } from '../../components/ui/dialog';
import { reportError } from '../../lib/report-error';
import { EyeIcon, EyeOffIcon } from 'lucide-react-native';

const signInIcon = require('@/assets/calangos-organizando.png');

export default function SignInScreen() {
  const router = useRouter();
  const dialog = useDialog();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password) return;
    setLoading(true);
    Sentry.addBreadcrumb({
      category: 'auth',
      message: 'sign_in.attempt',
      level: 'info',
      data: { email: email.trim(), apiUrl: clientEnv.EXPO_PUBLIC_API_URL },
    });
    try {
      const { error } = await authClient.signIn.email({
        email: email.trim(),
        password,
      });
      if (error) {
        reportError(error, {
          action: 'sign_in',
          extra: { email: email.trim(), apiUrl: clientEnv.EXPO_PUBLIC_API_URL },
        });
        await dialog.alert({
          title: 'Erro ao entrar',
          message: error.message ?? 'Verifique suas credenciais.',
        });
      }
      // AuthGate in _layout.tsx handles redirect to /(app) after session is set
    } catch (err) {
      reportError(err, {
        action: 'sign_in.thrown',
        extra: { email: email.trim(), apiUrl: clientEnv.EXPO_PUBLIC_API_URL },
      });
      await dialog.alert({
        title: 'Erro ao entrar',
        message: 'Falha de conexão. Verifique sua internet e tente novamente.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#22C55E', '#14532D']} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView behavior="padding" className="flex-1">
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingBottom: 16 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View className="px-8 py-8">
              <Image
                source={signInIcon}
                style={{ width: 250, height: 250, objectFit: 'contain', alignSelf: 'center' }}
              />
              <Text className="text-3xl font-bold text-white mb-2">Entrar</Text>
              <Text className="text-surface-100 mb-8">Vamos deixar esse enxoval em ordem?</Text>
              <View className="mb-4">
                <Text className="text-surface-300 text-sm mb-1.5 ml-1">E-mail</Text>
                <TextInput
                  className="bg-surface-800 text-white rounded-xl px-4 py-3.5 text-base"
                  placeholder="seu@email.com"
                  placeholderTextColor="#4a7055"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View className="mb-8">
                <Text className="text-surface-300 text-sm mb-1.5 ml-1">Senha</Text>
                <View className="relative justify-center">
                  <TextInput
                    className="bg-surface-800 text-white rounded-xl pl-4 pr-12 py-3.5 text-base"
                    placeholder="Sua senha"
                    placeholderTextColor="#4a7055"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    className="absolute right-4"
                    hitSlop={12}
                  >
                    {showPassword ? (
                      <EyeOffIcon size={20} color="#4a7055" />
                    ) : (
                      <EyeIcon size={20} color="#4a7055" />
                    )}
                  </Pressable>
                </View>
              </View>

              <Pressable
                className="w-full bg-primary-600 rounded-2xl py-4 items-center mb-4 active:bg-primary-700"
                onPress={handleSignIn}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold text-lg">Entrar</Text>
                )}
              </Pressable>

              <Pressable onPress={() => router.push('/(auth)/sign-up')}>
                <Text className="text-white/80 text-center">
                  Não tem conta? <Text className="text-primary-400 font-semibold">Criar conta</Text>
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
