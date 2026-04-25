import { z } from 'zod';
/**
 * Schema for server-side environment variables.
 * These variables MUST NEVER be exposed to the mobile/client bundle.
 *
 * Validated eagerly at import time — the process will crash on startup
 * if any required variable is missing, preventing silent failures.
 */
const serverSchema = z.object({
    // ── Database ────────────────────────────────────────────
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    // ── Better Auth ─────────────────────────────────────────
    BETTER_AUTH_SECRET: z.string().min(1, 'BETTER_AUTH_SECRET is required'),
    BETTER_AUTH_URL: z.string().url('BETTER_AUTH_URL must be a valid URL'),
    TRUSTED_ORIGINS: z
        .string()
        .default('')
        .transform((v) => v.split(',').filter(Boolean)),
    // ── Pusher (server-side) ────────────────────────────────
    PUSHER_APP_ID: z.string().min(1, 'PUSHER_APP_ID is required'),
    PUSHER_KEY: z.string().min(1, 'PUSHER_KEY is required'),
    PUSHER_SECRET: z.string().min(1, 'PUSHER_SECRET is required'),
    PUSHER_CLUSTER: z.string().default('sa1'),
    // ── Expo push notifications ─────────────────────────────
    EXPO_ACCESS_TOKEN: z.string().optional(),
    // ── App config ──────────────────────────────────────────
    APP_SCHEME: z.string().default('enxoval'),
    PORT: z
        .string()
        .default('3004')
        .transform((v) => Number(v)),
});
function createServerEnv() {
    const result = serverSchema.safeParse(process.env);
    if (!result.success) {
        const formatted = result.error.issues
            .map((i) => `  ✗ ${i.path.join('.')}: ${i.message}`)
            .join('\n');
        throw new Error(`\n❌ Invalid server environment variables:\n${formatted}\n`);
    }
    return result.data;
}
/**
 * Validated and typed server environment.
 * Import this instead of accessing `process.env` directly.
 *
 * @example
 * ```ts
 * import { serverEnv } from '@enxoval/env/server';
 * console.log(serverEnv.DATABASE_URL);
 * ```
 */
export const serverEnv = createServerEnv();
//# sourceMappingURL=server.js.map