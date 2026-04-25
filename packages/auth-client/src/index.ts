import { createAuthClient } from 'better-auth/react';
import { expoClient } from '@better-auth/expo/client';
import * as SecureStore from 'expo-secure-store';
import { clientEnv } from '@enxoval/env/dist/client';

export const authClient = createAuthClient({
  baseURL: clientEnv.EXPO_PUBLIC_API_URL,
  sessionOptions: {
    refetchOnWindowFocus: false,
  },
  plugins: [
    expoClient({
      scheme: 'enxoval',
      storagePrefix: 'enxoval',
      storage: SecureStore,
    }),
  ],
});

export type Session = typeof authClient.$Infer.Session;

