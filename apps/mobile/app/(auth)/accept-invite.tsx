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
import * as Linking from 'expo-linking';
import { authClient } from '@enxoval/auth-client';
import { useInviteInfo, useAcceptInvite } from '../../hooks/use-invite';

/**
 * Extracts a token from various input formats:
 *  - Raw token string (hex)
 *  - Full deep link: enxoval://invite?token=abc123
 *  - Full URL: https://something/invite?token=abc123
 */
function extractToken(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Try parsing as a URL/deep link
  try {
    const parsed = Linking.parse(trimmed);
    const t = parsed.queryParams?.token;
    if (typeof t === 'string' && t.length > 0) return t;
  } catch {
    // not a URL, treat as raw token
  }

  // If it looks like a raw hex token (32 chars), use it directly
  if (/^[a-f0-9]{16,}$/i.test(trimmed)) return trimmed;

  return null;
}

export default function AcceptInviteScreen() {
  const router = useRouter();
  const { token: deepLinkToken } = useLocalSearchParams<{ token?: string }>();

  // Token state: can come from deep link or manual input
  const [resolvedToken, setResolvedToken] = useState<string | null>(deepLinkToken ?? null);
  const [linkInput, setLinkInput] = useState('');
  const [parseError, setParseError] = useState('');

  const { data: invite, isPending, isError, error } = useInviteInfo(resolvedToken ?? undefined);
  const acceptMutation = useAcceptInvite();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Sync deep link token if it arrives later (e.g. from navigation)
  useEffect(() => {
    if (deepLinkToken && !resolvedToken) {
      setResolvedToken(deepLinkToken);
    }
  }, [deepLinkToken, resolvedToken]);

  // Pre-fill email from invite
  useEffect(() => {
    if (invite?.email) setEmail(invite.email);
  }, [invite?.email]);

  const handleParseLink = () => {
    const token = extractToken(linkInput);
    if (!token) {
      setParseError('Link inválido. Cole o link completo que você recebeu.');
      return;
    }
    setParseError('');
    setResolvedToken(token);
  };

  const handleSubmit = async () => {
    if (!resolvedToken) return;
    if (!email.trim() || !password || !name.trim()) {
      Alert.alert('Preencha tudo', 'Email, senha e nome são obrigatórios.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Senha curta', 'A senha precisa ter pelo menos 8 caracteres.');
      return;
    }

    setSubmitting(true);
    try {
      await acceptMutation.mutateAsync({
        token: resolvedToken,
        email: email.trim(),
        password,
        name: name.trim(),
      });

      const signIn = await authClient.signIn.email({
        email: email.trim(),
        password,
      });

      if (signIn.error) {
        Alert.alert(
          'Conta criada',
          'Conta criada! Faça login para continuar.',
          [{ text: 'OK', onPress: () => router.replace('/(auth)/sign-in') }],
        );
        return;
      }

      // Navigation is handled automatically by Stack.Protected guard
      // when the auth session state changes — no manual navigate needed.
    } catch (err: any) {
      Alert.alert(
        'Erro',
        err?.response?.data?.message ?? err?.message ?? 'Não foi possível aceitar o convite.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── State: Waiting for manual link input ──────────────────
  if (!resolvedToken) {
    return (
      <SafeAreaView className="flex-1 bg-surface-900">
        <KeyboardAvoidingView behavior="padding" className="flex-1">
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingBottom: 16 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          >
            <View className="px-8 py-8">
              <Text className="text-3xl font-bold text-white mb-2">
                Entrar com convite
              </Text>
              <Text className="text-surface-400 mb-8">
                Cole abaixo o link de convite que seu parceiro(a) enviou.
              </Text>

              <View className="mb-4">
                <Text className="text-surface-300 text-sm mb-1.5 ml-1">
                  Link de convite
                </Text>
                <TextInput
                  className="bg-surface-800 text-white rounded-xl px-4 py-3.5 text-base"
                  placeholder="enxoval://invite?token=..."
                  placeholderTextColor="#4a7055"
                  value={linkInput}
                  onChangeText={(t) => {
                    setLinkInput(t);
                    setParseError('');
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  multiline
                />
                {parseError ? (
                  <Text className="text-red-400 text-xs mt-1.5 ml-1">{parseError}</Text>
                ) : null}
              </View>

              <Pressable
                className="w-full bg-primary-600 rounded-2xl py-4 items-center mb-4 active:bg-primary-700"
                onPress={handleParseLink}
              >
                <Text className="text-white font-semibold text-base">Continuar</Text>
              </Pressable>

              <Pressable onPress={() => router.back()}>
                <Text className="text-surface-400 text-center">
                  ← Voltar
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── State: Loading invite info ────────────────────────────
  if (isPending) {
    return (
      <SafeAreaView className="flex-1 bg-surface-900 items-center justify-center">
        <ActivityIndicator color="#4ade80" size="large" />
      </SafeAreaView>
    );
  }

  // ── State: Invite not found ───────────────────────────────
  if (isError || !invite) {
    return (
      <SafeAreaView className="flex-1 bg-surface-900 items-center justify-center px-8">
        <Text className="text-white text-lg mb-2">Convite não encontrado</Text>
        <Text className="text-surface-400 text-center mb-4">
          {(error as any)?.response?.data?.message ?? 'Confira o link com seu parceiro(a).'}
        </Text>
        <Pressable onPress={() => {
          setResolvedToken(null);
          setLinkInput('');
        }}>
          <Text className="text-primary-400 font-semibold">Tentar outro link</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // ── State: Invite expired or used ─────────────────────────
  if (invite.expired || invite.used) {
    return (
      <SafeAreaView className="flex-1 bg-surface-900 items-center justify-center px-8">
        <Text className="text-white text-lg mb-2">
          {invite.used ? 'Convite já foi usado' : 'Convite expirado'}
        </Text>
        <Text className="text-surface-400 text-center mb-4">
          Peça um novo link para seu parceiro(a).
        </Text>
        <Pressable onPress={() => router.replace('/(auth)/sign-in')}>
          <Text className="text-primary-400 font-semibold">Voltar para login</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // ── State: Sign-up form ───────────────────────────────────
  const emailLocked = !!invite.email;

  return (
    <SafeAreaView className="flex-1 bg-surface-900">
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingBottom: 16 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <View className="px-8 py-8">
            <Text className="text-3xl font-bold text-white mb-2">
              Você foi convidado 🎉
            </Text>
            <Text className="text-surface-400 mb-8">
              {invite.coupleName
                ? `Crie sua conta para entrar em "${invite.coupleName}".`
                : 'Crie sua conta para entrar no enxoval.'}
            </Text>

            <View className="mb-4">
              <Text className="text-surface-300 text-sm mb-1.5 ml-1">Seu nome</Text>
              <TextInput
                className="bg-surface-800 text-white rounded-xl px-4 py-3.5 text-base"
                placeholder="Ex: Ana"
                placeholderTextColor="#4a7055"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <View className="mb-4">
              <Text className="text-surface-300 text-sm mb-1.5 ml-1">Email</Text>
              <TextInput
                className={`bg-surface-800 ${emailLocked ? 'text-surface-500' : 'text-white'} rounded-xl px-4 py-3.5 text-base`}
                placeholder="voce@email.com"
                placeholderTextColor="#4a7055"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!emailLocked}
              />
              {emailLocked && (
                <Text className="text-surface-500 text-xs mt-1 ml-1">
                  Email pré-definido pelo convite.
                </Text>
              )}
            </View>

            <View className="mb-8">
              <Text className="text-surface-300 text-sm mb-1.5 ml-1">Senha</Text>
              <TextInput
                className="bg-surface-800 text-white rounded-xl px-4 py-3.5 text-base"
                placeholder="Mínimo 8 caracteres"
                placeholderTextColor="#4a7055"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <Pressable
              className="w-full bg-primary-600 rounded-2xl py-4 items-center active:bg-primary-700"
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-base">
                  Entrar no enxoval
                </Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
