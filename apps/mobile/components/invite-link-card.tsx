import { View, Text, Pressable, Share, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';

interface InviteLinkCardProps {
  link: string;
  email?: string | null;
}

export function InviteLinkCard({ link, email }: InviteLinkCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: email
          ? `Você foi convidado(a) para o nosso enxoval! Abra este link no celular: ${link}`
          : `Abra este link para entrar no nosso enxoval: ${link}`,
      });
    } catch (err: any) {
      Alert.alert('Erro', err?.message ?? 'Não foi possível compartilhar.');
    }
  };

  return (
    <View className="bg-surface-800 rounded-2xl p-4">
      {email ? (
        <Text className="text-surface-400 text-xs uppercase tracking-wide mb-1">
          Convite para {email}
        </Text>
      ) : (
        <Text className="text-surface-400 text-xs uppercase tracking-wide mb-1">
          Link de convite
        </Text>
      )}

      <Text
        className="text-white font-mono text-xs mb-4"
        numberOfLines={2}
        selectable
      >
        {link}
      </Text>

      <View className="flex-row gap-2">
        <Pressable
          onPress={handleCopy}
          className="flex-1 bg-primary-600 rounded-xl py-3 items-center active:bg-primary-700"
        >
          <Text className="text-white font-semibold">
            {copied ? '✓ Copiado' : 'Copiar'}
          </Text>
        </Pressable>
        <Pressable
          onPress={handleShare}
          className="flex-1 bg-surface-700 rounded-xl py-3 items-center active:bg-surface-600"
        >
          <Text className="text-white font-semibold">Compartilhar</Text>
        </Pressable>
      </View>

      <Text className="text-surface-500 text-xs mt-3">
        O link expira em 14 dias. Seu parceiro(a) abre no celular dele, cria uma senha e entra automaticamente no enxoval.
      </Text>
    </View>
  );
}
