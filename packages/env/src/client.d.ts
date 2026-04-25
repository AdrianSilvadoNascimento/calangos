import { z } from 'zod';
/**
 * Schema for client-side (Expo/mobile) environment variables.
 *
 * In Expo, only variables prefixed with EXPO_PUBLIC_ are bundled into the
 * client JS. This module validates that they are present at build time and
 * provides typed access, avoiding silent `undefined` values at runtime.
 */
declare const clientSchema: z.ZodObject<{
    EXPO_PUBLIC_API_URL: z.ZodString;
    EXPO_PUBLIC_PUSHER_KEY: z.ZodString;
    EXPO_PUBLIC_PUSHER_CLUSTER: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
export type ClientEnv = z.infer<typeof clientSchema>;
/**
 * Validated and typed client environment.
 *
 * @example
 * ```ts
 * import { clientEnv } from '@enxoval/env/client';
 * console.log(clientEnv.EXPO_PUBLIC_API_URL);
 * ```
 */
export declare const clientEnv: {
    EXPO_PUBLIC_API_URL: string;
    EXPO_PUBLIC_PUSHER_KEY: string;
    EXPO_PUBLIC_PUSHER_CLUSTER: string;
};
export {};
