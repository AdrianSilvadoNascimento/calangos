import '../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';
import { authClient } from '@enxoval/auth-client';
import { clientEnv } from '@enxoval/env/client';
import { useDeepLinks } from '../hooks/use-deep-links';
import { DialogProvider } from '../components/ui/dialog';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function SplashScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0c1a0d',
      }}
    >
      <ActivityIndicator color="#4ade80" size="large" />
    </View>
  );
}

function RootStack() {
  const { data: session, isPending } = authClient.useSession();
  useDeepLinks();

  if (isPending) return <SplashScreen />;

  const signedIn = !!session;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0c1a0d' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(app)" />
        <Stack.Screen name="(onboarding)" />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

function RootLayout() {
  useEffect(() => {
    try {
      const environment =
        (Constants.expoConfig?.extra?.nodeEnv as string | undefined) ?? 'development';
      Sentry.init({
        dsn: clientEnv.EXPO_PUBLIC_SENTRY_DSN,
        environment,
        enableNative: true,
        attachStacktrace: true,
        tracesSampleRate: 0.1,
        debug: false,
      });
    } catch (e) {
      console.warn('Sentry init failed', e);
    }
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <DialogProvider>
          <StatusBar style="light" />
          <RootStack />
        </DialogProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

export default Sentry.wrap(RootLayout);
