import { View, Text, Pressable, ActivityIndicator, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import * as Linking from 'expo-linking';
import { authClient } from '@enxoval/auth-client';
import { useInviteInfo, useAcceptInvite } from '../../hooks/use-invite';
import { reportError } from '../../lib/report-error';
import { Button, Card, Icon, Input, LinkButton, Mascot, useDialog } from '../../components/ui';

/**
 * Extracts a token from various input formats:
 *  - Raw token string (hex)
 *  - Full deep link: enxoval://invite?token=abc123
 *  - Full URL: https://something/invite?token=abc123
 */
function extractToken(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    const parsed = Linking.parse(trimmed);
    const t = parsed.queryParams?.token;
    if (typeof t === 'string' && t.length > 0) return t;
  } catch {
    // not a URL, treat as raw token
  }

  if (/^[a-f0-9]{16,}$/i.test(trimmed)) return trimmed;
  return null;
}

function AuthBackButton() {
  const router = useRouter();
  return (
    <View className="px-4 py-3">
      <LinkButton leftIcon="arrow-left" label="Voltar" onPress={() => router.back()} />
    </View>
  );
}

export default function AcceptInviteScreen() {
  const router = useRouter();
  const dialog = useDialog();
  const { token: deepLinkToken } = useLocalSearchParams<{ token?: string }>();

  const [resolvedToken, setResolvedToken] = useState<string | null>(deepLinkToken ?? null);
  const [linkInput, setLinkInput] = useState('');
  const [parseError, setParseError] = useState('');

  const { data: invite, isPending, isError, error } = useInviteInfo(resolvedToken ?? undefined);
  const acceptMutation = useAcceptInvite();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (deepLinkToken && !resolvedToken) setResolvedToken(deepLinkToken);
  }, [deepLinkToken, resolvedToken]);

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
      await dialog.alert({ title: 'Preencha tudo', message: 'Email, senha e nome são obrigatórios.' });
      return;
    }
    if (password.length < 8) {
      await dialog.alert({ title: 'Senha curta', message: 'A senha precisa ter pelo menos 8 caracteres.' });
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

      const signIn = await authClient.signIn.email({ email: email.trim(), password });

      if (signIn.error) {
        await dialog.alert({
          title: 'Conta criada',
          message: 'Conta criada! Faça login para continuar.',
        });
        router.replace('/(auth)/sign-in');
        return;
      }
    } catch (err: any) {
      reportError(err, { action: 'accept_invite' });
      await dialog.alert({
        title: 'Ops, não rolou',
        message: err?.response?.data?.message ?? err?.message ?? 'Não foi possível aceitar o convite.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ── State: Waiting for manual link input ──────────────────
  if (!resolvedToken) {
    return (
      <SafeAreaView className="flex-1 bg-bg-0">
        <AuthBackButton />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 40, paddingHorizontal: 32, paddingTop: 8 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          >
            <View className="items-center mb-6">
              <Mascot variant="juntos" size="lg" />
            </View>
            <Text className="text-ink-1 mb-1 font-display" style={{ fontSize: 32, letterSpacing: -0.8 }}>
              Te chamaram pra cá ♥
            </Text>
            <Text className="text-ink-3 mb-6 text-base">
              Cole abaixo o link de convite que seu calanguinho enviou.
            </Text>

            {/* Card explicativo coral */}
            <Card className="mb-6" style={{ backgroundColor: 'rgba(232,151,132,0.08)', borderColor: 'rgba(232,151,132,0.20)' }}>
              <View className="flex-row items-start" style={{ gap: 10 }}>
                <Icon name="heart" tone="coral" size={18} />
                <Text className="text-ink-2 text-sm flex-1">
                  Você vai entrar no enxoval do casal — todos os itens já adicionados ficam visíveis pra vocês dois.
                </Text>
              </View>
            </Card>

            <View className="mb-2">
              <Input
                label="Link de convite"
                leftIcon="link"
                placeholder="enxoval://invite?token=..."
                value={linkInput}
                onChangeText={(t) => {
                  setLinkInput(t);
                  setParseError('');
                }}
                autoCapitalize="none"
                autoCorrect={false}
                error={parseError || undefined}
              />
            </View>

            <View className="mt-6">
              <Button label="Continuar" onPress={handleParseLink} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── State: Loading invite info ────────────────────────────
  if (isPending) {
    return (
      <SafeAreaView className="flex-1 bg-bg-0 items-center justify-center">
        <ActivityIndicator color="#34B26C" size="large" />
      </SafeAreaView>
    );
  }

  // ── State: Invite not found ───────────────────────────────
  if (isError || !invite) {
    return (
      <SafeAreaView className="flex-1 bg-bg-0">
        <AuthBackButton />
        <View className="flex-1 items-center justify-center px-8">
          <Mascot variant="organizando" size="sm" />
          <Text className="text-ink-1 text-lg mt-4 mb-2 font-semibold">Convite não encontrado</Text>
          <Text className="text-ink-3 text-center mb-6 text-sm">
            {(error as any)?.response?.data?.message ?? 'Confira o link com seu calanguinho.'}
          </Text>
          <Button
            label="Tentar outro link"
            variant="ghost"
            fullWidth={false}
            onPress={() => {
              setResolvedToken(null);
              setLinkInput('');
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ── State: Invite expired or used ─────────────────────────
  if (invite.expired || invite.used) {
    return (
      <SafeAreaView className="flex-1 bg-bg-0">
        <AuthBackButton />
        <View className="flex-1 items-center justify-center px-8">
          <Mascot variant="organizando" size="sm" />
          <Text className="text-ink-1 text-lg mt-4 mb-2 font-semibold">
            {invite.used ? 'Convite já foi usado' : 'Convite expirado'}
          </Text>
          <Text className="text-ink-3 text-center mb-6 text-sm">
            Peça um novo link para seu calanguinho.
          </Text>
          <Pressable
            onPress={() => router.replace('/(auth)/sign-in')}
            className="active:opacity-70"
          >
            <Text className="text-brand-400 font-semibold">Voltar para login</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── State: Sign-up form ───────────────────────────────────
  const emailLocked = !!invite.email;

  return (
    <SafeAreaView className="flex-1 bg-bg-0">
      <AuthBackButton />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 40, paddingHorizontal: 32, paddingTop: 8 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <View className="items-center mb-6">
            <Mascot variant="juntos" size="lg" />
          </View>
          <Text className="text-ink-1 mb-1 font-display" style={{ fontSize: 32, letterSpacing: -0.8 }}>
            Você foi convidado ♥
          </Text>
          <Text className="text-ink-3 mb-8 text-base">
            {invite.coupleName
              ? `Crie sua conta para entrar em "${invite.coupleName}".`
              : 'Crie sua conta para entrar no enxoval.'}
          </Text>

          <View className="mb-4">
            <Input
              label="Seu nome"
              leftIcon="user"
              placeholder="Ex: Ana"
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
              placeholder="voce@email.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!emailLocked}
              autoComplete="email"
            />
            {emailLocked && (
              <Text className="text-ink-4 text-xs mt-1.5 ml-1">
                Email pré-definido pelo convite.
              </Text>
            )}
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

          <Button label="Entrar no enxoval" onPress={handleSubmit} loading={submitting} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
