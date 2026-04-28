import { z } from 'zod';

/**
 * Schema for client-side (Expo/mobile) environment variables.
 *
 * In Expo, only variables prefixed with EXPO_PUBLIC_ are bundled into the
 * client JS. This module validates that they are present at build time and
 * provides typed access, avoiding silent `undefined` values at runtime.
 */
const clientSchema = z.object({
  EXPO_PUBLIC_API_URL: z.string().min(1, 'EXPO_PUBLIC_API_URL is required'),
  EXPO_PUBLIC_PUSHER_KEY: z.string().min(1, 'EXPO_PUBLIC_PUSHER_KEY is required'),
  EXPO_PUBLIC_PUSHER_CLUSTER: z.string().default('sa1'),
  EXPO_PUBLIC_SENTRY_DSN: z.string().min(1, 'EXPO_PUBLIC_SENTRY_DSN is required'),
});

export type ClientEnv = z.infer<typeof clientSchema>;

function createClientEnv(): ClientEnv {
  // babel-preset-expo only inlines EXPO_PUBLIC_* when accessed as direct
  // member expressions on process.env. Passing process.env as an object
  // (e.g. safeParse(process.env)) defeats the static analysis and the values
  // come back undefined in the React Native production bundle.
  const result = clientSchema.safeParse({
    EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
    EXPO_PUBLIC_PUSHER_KEY: process.env.EXPO_PUBLIC_PUSHER_KEY,
    EXPO_PUBLIC_PUSHER_CLUSTER: process.env.EXPO_PUBLIC_PUSHER_CLUSTER,
    EXPO_PUBLIC_SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
  });

  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  ✗ ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid client environment variables:\n${formatted}`);
  }

  return result.data;
}

/**
 * Validated and typed client environment.
 *
 * @example
 * ```ts
 * import { clientEnv } from '@enxoval/env/client';
 * console.log(clientEnv.EXPO_PUBLIC_API_URL);
 * ```
 */
export const clientEnv = createClientEnv();
