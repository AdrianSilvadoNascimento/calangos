import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button, Icon, Mascot } from '../components/ui';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-bg-0">
      <View className="flex-1 items-center justify-between px-6 pt-10 pb-10">
        {/* Centro: mascote + texto */}
        <View className="flex-1 items-center justify-center">
          <Mascot variant="signin" size="lg" glow />

          <Text
            className="text-ink-1 text-center mt-8 mb-3 font-display"
            style={{ fontSize: 40, letterSpacing: -1 }}
          >
            Calangos
          </Text>

          <Text className="text-ink-3 text-center text-base" style={{ maxWidth: 260, lineHeight: 24 }}>
            Organizem o enxoval do casamento juntinhos, no mesmo lugar.
          </Text>

          {/* Paw prints decorativos */}
          <View className="flex-row mt-5" style={{ gap: 4 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Icon key={i} name="paw" tone="brand" size={12} outline />
            ))}
          </View>
        </View>

        {/* Botões */}
        <View className="w-full" style={{ gap: 12 }}>
          <Button
            label="Criar conta"
            rightIcon="arrow-right"
            onPress={() => router.push('/(auth)/sign-up')}
          />
          <Button
            label="Tenho um convite"
            variant="ghost"
            leftIcon="mail"
            onPress={() => router.push('/(auth)/accept-invite')}
          />
          <Pressable
            onPress={() => router.push('/(auth)/sign-in')}
            className="w-full items-center py-2 active:opacity-70"
          >
            <Text className="text-ink-3 text-base">
              Já tenho conta · <Text className="text-brand-400 font-semibold">Entrar</Text>
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
