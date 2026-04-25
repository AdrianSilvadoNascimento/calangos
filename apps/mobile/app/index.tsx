import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-surface-900">
      <View className="flex-1 items-center justify-center px-8">
      <Text className="text-6xl mb-4">🦎</Text>
      <Text className="text-3xl font-bold text-white mb-2">Calangos Organizer</Text>
      <Text className="text-base text-surface-400 text-center mb-12">
        Organize o enxoval do seu casamento{'\n'}junto com seu amor
      </Text>

      <Pressable
        className="w-full bg-primary-600 rounded-2xl py-4 items-center mb-4 active:bg-primary-700"
        onPress={() => router.push('/(auth)/sign-up')}
      >
        <Text className="text-white font-semibold text-base">Criar conta</Text>
      </Pressable>

      <Pressable
        className="w-full bg-primary-600/20 border border-primary-600/40 rounded-2xl py-4 items-center mb-4 active:bg-primary-600/30"
        onPress={() => router.push('/(auth)/accept-invite')}
      >
        <Text className="text-primary-300 font-semibold text-base">💌 Tenho um convite</Text>
      </Pressable>

      <Pressable
        className="w-full border border-surface-600 rounded-2xl py-4 items-center active:bg-surface-800"
        onPress={() => router.push('/(auth)/sign-in')}
      >
        <Text className="text-white font-semibold text-base">Já tenho conta</Text>
      </Pressable>
      </View>
    </SafeAreaView>
  );
}
