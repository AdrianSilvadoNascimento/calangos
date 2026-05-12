import { View, Text, Pressable, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import * as Sentry from '@sentry/react-native';
import { authClient } from '@enxoval/auth-client';
import { clientEnv } from '@enxoval/env/client';
import { reportError } from '../../lib/report-error';
import { Button, Input, LinkButton, Mascot, useDialog } from '../../components/ui';

export default function SignUpScreen() {
  const router = useRouter();
  const dialog = useDialog();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password) return;
    setLoading(true);
    Sentry.addBreadcrumb({
      category: 'auth',
      message: 'sign_up.attempt',
      level: 'info',
      data: { email: email.trim(), apiUrl: clientEnv.EXPO_PUBLIC_API_URL },
    });
    try {
      const { error } = await authClient.signUp.email({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      if (error) {
        reportError(error, {
          action: 'sign_up',
          extra: { email: email.trim(), apiUrl: clientEnv.EXPO_PUBLIC_API_URL },
        });
        await dialog.alert({
          title: 'Ops, não rolou criar conta',
          message: error.message ?? 'Tente novamente.',
        });
      }
    } catch (err) {
      reportError(err, {
        action: 'sign_up.thrown',
        extra: { email: email.trim(), apiUrl: clientEnv.EXPO_PUBLIC_API_URL },
      });
      await dialog.alert({
        title: 'Ops, não rolou criar conta',
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
            <Mascot variant="signin" size="lg" glow />
          </View>

          <Text className="text-ink-1 mb-1 font-display" style={{ fontSize: 32, letterSpacing: -0.8 }}>
            Criar conta
          </Text>
          <Text className="text-ink-3 mb-8 text-base">
            Vamos começar a montar essa casinha 🌿
          </Text>

          <View className="mb-4">
            <Input
              label="Seu nome"
              leftIcon="user"
              placeholder="Como devemos te chamar?"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoComplete="name"
            />
          </View>

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
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChangeText={setPassword}
              secureToggle
              autoComplete="password-new"
            />
          </View>

          <Button label="Criar conta" onPress={handleSignUp} loading={loading} />

          <Pressable
            onPress={() => router.push('/(auth)/sign-in')}
            className="mt-4 active:opacity-70"
          >
            <Text className="text-ink-3 text-center">
              Já tem conta? <Text className="text-brand-400 font-semibold">Entrar</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
