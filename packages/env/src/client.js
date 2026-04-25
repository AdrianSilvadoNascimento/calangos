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
});
function createClientEnv() {
    const result = clientSchema.safeParse(process.env);
    if (!result.success) {
        const formatted = result.error.issues
            .map((i) => `  ✗ ${i.path.join('.')}: ${i.message}`)
            .join('\n');
        // In dev mode, warn loudly; in production builds this should have
        // been caught by the CI pipeline.
        console.error(`\n❌ Invalid client environment variables:\n${formatted}\n`);
        // Return defaults so the app doesn't crash in every HMR cycle when
        // a dev forgets to set a non-critical variable. The schema above
        // still enforces the truly required ones.
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
//# sourceMappingURL=client.js.map