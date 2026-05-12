import { ActivityIndicator, View } from 'react-native';
import { Redirect, Stack } from 'expo-router';
import { useMyCouple } from '../../hooks/use-my-couple';
import { useRealtimeSync } from '../../hooks/use-realtime-sync';
import { ClipboardBanner } from '../../components/clipboard-banner';

function CoupleGate({ children }: { children: React.ReactNode }) {
  const { data: couple, isPending, isError } = useMyCouple();
  useRealtimeSync(couple?.id);

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-1">
        <ActivityIndicator color="#34B26C" size="large" />
      </View>
    );
  }

  if (couple === null || isError) return <Redirect href="/(onboarding)/create-couple" />;

  return <>{children}</>;
}

export default function AppLayout() {
  return (
    <CoupleGate>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0C1B14' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="add-product" />
        <Stack.Screen name="invite" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="products" />
        <Stack.Screen name="room/[id]" />
      </Stack>
      <ClipboardBanner />
    </CoupleGate>
  );
}
