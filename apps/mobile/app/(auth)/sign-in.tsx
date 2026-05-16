import { View, Text, Pressable, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import * as Sentry from '@sentry/react-native';
import { authClient } from '@enxoval/auth-client';
import { clientEnv } from '@enxoval/env/client';
import { reportError } from '../../lib/report-error';
import { Button, Input, LinkButton, Mascot, useDialog } from '../../components/ui';

export default function SignInScreen() {
  const router = useRouter();
  const dialog = useDialog();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      const { error } = await authClient.signIn.email({ email: email.trim(), password });
      if (error) {
        reportError(error, {
          action: 'sign_in',
          extra: { email: email.trim(), apiUrl: clientEnv.EXPO_PUBLIC_API_URL },
        });
        await dialog.alert({
          title: 'Ops, não rolou entrar',
          message: error.message ?? 'Verifique suas credenciais.',
        });
      }
    } catch (err) {
      reportError(err, {
        action: 'sign_in.thrown',
        extra: { email: email.trim(), apiUrl: clientEnv.EXPO_PUBLIC_API_URL },
      });
      await dialog.alert({
        title: 'Ops, não rolou entrar',
        message: 'Falha de conexão. Verifique sua internet e tente novamente.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-0">
      <View className="px-4 py-3">
        <LinkButton leftIcon="arrow-left" label="Voltar" onPress={() => router.back()} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 40, paddingHorizontal: 32, paddingTop: 8 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center mb-6">
            <Mascot variant="organizando" size="lg" />
          </View>

          <Text className="text-ink-1 mb-1 font-display" style={{ fontSize: 32, letterSpacing: -0.8 }}>
            Bom te ver de novo 🦎
          </Text>
          <Text className="text-ink-3 mb-8 text-base">
            Vamos deixar esse enxoval em ordem?
          </Text>

          <View className="mb-4">
            <Input
              label="E-mail"
              leftIcon="mail"
              placeholder="seu@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View className="mb-8">
            <Input
              label="Senha"
              leftIcon="lock"
              placeholder="Sua senha"
              value={password}
              onChangeText={setPassword}
              secureToggle
              autoComplete="password"
            />
          </View>

          <Button label="Entrar" onPress={handleSignIn} loading={loading} />

          <Pressable
            onPress={() => router.push('/(auth)/sign-up')}
            className="mt-4 active:opacity-70"
          >
            <Text className="text-ink-3 text-center">
              Não tem conta? <Text className="text-brand-400 font-semibold">Criar conta</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
