import { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { authClient } from '@enxoval/auth-client';
import { useQueryClient } from '@tanstack/react-query';
import { useMyCouple } from '../../../hooks/use-my-couple';
import { useCoupleMembers } from '../../../hooks/use-couple-members';
import { useUpdateProfile } from '../../../hooks/use-update-profile';
import { useUpdateCouple } from '../../../hooks/use-update-couple';
import { useCoupleProgress, formatBRL } from '../../../hooks/use-couple-progress';
import { usePreferences, useUpdatePreferences } from '../../../hooks/use-preferences';
import { reportError } from '../../../lib/report-error';
import {
  Avatar,
  Button,
  Card,
  Icon,
  Input,
  ProfileRow,
  RowDivider,
  Sheet,
  ToggleRow,
  useDialog,
} from '../../../components/ui';

type EditMode = 'name' | 'couple' | null;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text
      className="text-ink-3 font-semibold mb-2"
      style={{ fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase' }}
    >
      {children}
    </Text>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const dialog = useDialog();
  const { data: session, refetch: refetchSession } = authClient.useSession();
  const { data: couple, refetch: refetchCouple } = useMyCouple();
  const { data: members } = useCoupleMembers();
  const updateProfile = useUpdateProfile();
  const updateCouple = useUpdateCouple();
  const { data: progress } = useCoupleProgress();
  const { data: prefs } = usePreferences();
  const updatePrefs = useUpdatePreferences();

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
      await dialog.alert({ title: 'Campo obrigatório', message: 'Digite um nome.' });
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
      reportError(err, { action: 'profile.save', extra: { editMode } });
      await dialog.alert({
        title: 'Ops, não rolou',
        message: err?.response?.data?.message ?? err?.message ?? 'Não foi possível salvar.',
      });
    }
  };

  const handleLogout = async () => {
    const ok = await dialog.confirm({
      title: 'Sair',
      message: 'Tem certeza que deseja sair?',
      confirmText: 'Sair',
      destructive: true,
    });
    if (!ok) return;
    await authClient.signOut();
    queryClient.clear();
    router.replace('/(auth)/sign-in');
  };

  const m = members?.members ?? [];
  const me = m.find((mb) => mb.userId === session?.user?.id);
  const myName = me?.name ?? session?.user.name ?? 'Eu';
  const partnerMember = m.find((mb) => mb.userId !== session?.user?.id);
  const partnerName = partnerMember?.name ?? null;
  const saving = updateProfile.isPending || updateCouple.isPending;

  return (
    <SafeAreaView className="flex-1 bg-bg-1">
      <View className="px-6 pt-4 pb-2">
        <Text
          className="text-ink-3 font-semibold mb-1"
          style={{ fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase' }}
        >
          Configurações
        </Text>
        <Text className="text-ink-1 text-2xl font-bold" style={{ letterSpacing: -0.5 }}>
          Perfil
        </Text>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Header do casal */}
        <View className="items-center py-6">
          <View className="flex-row items-center">
            <Avatar name={myName} variant="brand" size={72} />
            {partnerName && (
              <>
                <View
                  className="items-center justify-center rounded-full bg-bg-1"
                  style={{ width: 32, height: 32, marginHorizontal: -6, zIndex: 10 }}
                >
                  <Icon name="heart" tone="coral" size={14} fillAlpha={0xff} />
                </View>
                <Avatar name={partnerName} variant="coral" size={72} />
              </>
            )}
          </View>
          <Text className="text-ink-1 font-semibold text-base mt-3">
            {myName}
            {partnerName ? ` & ${partnerName}` : ''}
          </Text>
          <Text className="text-ink-3 text-sm">{session?.user.email ?? ''}</Text>
        </View>

        {/* Stats trio (HI-FI §48) */}
        <View className="flex-row mb-5" style={{ gap: 12 }}>
          {[
            { label: 'Itens', value: String(progress?.totalItems ?? 0) },
            {
              label: 'Planejado',
              value: progress
                ? formatBRL(progress.totalPlannedCents, progress.currency)
                : 'R$ 0',
            },
            { label: 'Completo', value: `${progress?.percentReceived ?? 0}%` },
          ].map((stat) => (
            <Card key={stat.label} className="flex-1 items-center" padding="sm">
              <Text className="text-ink-1 text-lg font-bold">{stat.value}</Text>
              <Text className="text-ink-3 text-xs mt-0.5">{stat.label}</Text>
            </Card>
          ))}
        </View>

        {/* Meu perfil */}
        <SectionLabel>Meu perfil</SectionLabel>
        <Card padding="none" className="mb-4 overflow-hidden">
          <ProfileRow label="Seu nome" value={myName} onPress={() => setEditMode('name')} />
          <RowDivider />
          <ProfileRow label="E-mail" value={session?.user.email ?? '—'} />
        </Card>

        {/* Enxoval */}
        <SectionLabel>Enxoval</SectionLabel>
        <Card padding="none" className="mb-4 overflow-hidden">
          <ProfileRow
            label="Nome do enxoval"
            value={couple?.name?.trim() || 'Toque para nomear'}
            onPress={() => setEditMode('couple')}
          />
        </Card>

        {/* Parceira */}
        <SectionLabel>Parceiro(a)</SectionLabel>
        <Card padding="none" className="mb-4 overflow-hidden">
          {partnerName ? (
            <ProfileRow label="Nome" value={partnerName} />
          ) : (
            <View className="px-4 py-3">
              <Button
                label="Convide seu calanguinho"
                variant="ghost"
                leftIcon="mail"
                rightIcon="arrow-right"
                onPress={() => router.push('/(app)/invite')}
              />
            </View>
          )}
        </Card>

        {/* Preferências */}
        <SectionLabel>Preferências</SectionLabel>
        <Card padding="none" className="mb-4 overflow-hidden">
          <ToggleRow
            icon="bell"
            label="Notificações"
            description="Avisos de atividades e conquistas"
            value={prefs?.notificationsEnabled ?? true}
            onChange={(v) => updatePrefs.mutate({ notificationsEnabled: v })}
            disabled={updatePrefs.isPending}
          />
          <RowDivider />
          <ToggleRow
            label="Quando ela adicionar"
            description="Avisar quando seu calanguinho adicionar um item"
            value={prefs?.notifyOnPartnerAdd ?? true}
            onChange={(v) => updatePrefs.mutate({ notifyOnPartnerAdd: v })}
            disabled={updatePrefs.isPending || !(prefs?.notificationsEnabled ?? true)}
          />
          <RowDivider />
          <ToggleRow
            label="Mudança de status"
            description="Quando algo muda de comprado/recebido"
            value={prefs?.notifyOnStatusChange ?? true}
            onChange={(v) => updatePrefs.mutate({ notifyOnStatusChange: v })}
            disabled={updatePrefs.isPending || !(prefs?.notificationsEnabled ?? true)}
          />
          <RowDivider />
          <ToggleRow
            icon="trophy"
            label="Conquistas"
            description="Celebrar marcos do enxoval"
            value={prefs?.notifyOnMilestone ?? true}
            onChange={(v) => updatePrefs.mutate({ notifyOnMilestone: v })}
            disabled={updatePrefs.isPending || !(prefs?.notificationsEnabled ?? true)}
          />
          <RowDivider />
          <ToggleRow
            icon="link"
            label="Detectar links"
            description="Sugerir adicionar quando você copiar um link"
            value={prefs?.detectLinksEnabled ?? true}
            onChange={(v) => updatePrefs.mutate({ detectLinksEnabled: v })}
            disabled={updatePrefs.isPending}
          />
          <RowDivider />
          <ProfileRow
            icon="download"
            label="Exportar dados"
            value="Baixar backup em JSON"
          />
        </Card>

        {/* Sair */}
        <View className="mb-8">
          <Button
            label="Sair da conta"
            variant="danger-ghost"
            leftIcon="log-out"
            onPress={handleLogout}
          />
        </View>
      </ScrollView>

      {/* Edit Sheet */}
      <Sheet
        open={editMode !== null}
        onClose={closeEdit}
        title={editMode === 'name' ? 'Editar seu nome' : 'Nome do enxoval'}
        scrollable={false}
        dismissable={!saving}
      >
        <Input
          label="Nome"
          placeholder={editMode === 'name' ? 'Como devemos te chamar?' : 'Ex: Casa nova'}
          value={draft}
          onChangeText={setDraft}
          autoCapitalize="words"
          autoFocus
          onSubmitEditing={handleSave}
          returnKeyType="done"
        />

        <View className="mt-6">
          <Button label="Salvar" onPress={handleSave} loading={saving} />
        </View>
        <View className="mt-2">
          <Button label="Cancelar" variant="ghost" onPress={closeEdit} disabled={saving} />
        </View>
      </Sheet>
    </SafeAreaView>
  );
}
