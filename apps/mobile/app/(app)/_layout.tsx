import { ActivityIndicator, View } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMyCouple } from '../../hooks/use-my-couple';
import { useRealtimeSync } from '../../hooks/use-realtime-sync';
import { ClipboardBanner } from '../../components/clipboard-banner';

function CoupleGate({ children }: { children: React.ReactNode }) {
  const { data: couple, isPending, isError } = useMyCouple();
  useRealtimeSync(couple?.id);

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-surface-900">
        <ActivityIndicator color="#4ade80" size="large" />
      </View>
    );
  }

  if (couple === null || isError) return <Redirect href="/(onboarding)/create-couple" />;

  return <>{children}</>;
}

export default function AppLayout() {
  const insets = useSafeAreaInsets();

  return (
    <CoupleGate>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#0a180b',
            borderTopColor: '#1f3825',
            borderTopWidth: 1,
            height: 60 + insets.bottom,
            paddingBottom: 8 + insets.bottom,
            paddingTop: 8,
          },
          tabBarActiveTintColor: '#4ade80',
          tabBarInactiveTintColor: '#5c8a65',
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Cômodos',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏠</Text>,
          }}
        />
        <Tabs.Screen
          name="products"
          options={{
            title: 'Todos',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📦</Text>,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👤</Text>,
          }}
        />
        <Tabs.Screen name="add-product" options={{ href: null }} />
        <Tabs.Screen name="invite" options={{ href: null }} />
        <Tabs.Screen name="room/[id]" options={{ href: null }} />
      </Tabs>
      <ClipboardBanner />
    </CoupleGate>
  );
}
