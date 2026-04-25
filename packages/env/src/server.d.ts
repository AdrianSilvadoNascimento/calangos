import { z } from 'zod';
/**
 * Schema for server-side environment variables.
 * These variables MUST NEVER be exposed to the mobile/client bundle.
 *
 * Validated eagerly at import time — the process will crash on startup
 * if any required variable is missing, preventing silent failures.
 */
declare const serverSchema: z.ZodObject<{
    DATABASE_URL: z.ZodString;
    BETTER_AUTH_SECRET: z.ZodString;
    BETTER_AUTH_URL: z.ZodString;
    TRUSTED_ORIGINS: z.ZodPipe<z.ZodDefault<z.ZodString>, z.ZodTransform<string[], string>>;
    PUSHER_APP_ID: z.ZodString;
    PUSHER_KEY: z.ZodString;
    PUSHER_SECRET: z.ZodString;
    PUSHER_CLUSTER: z.ZodDefault<z.ZodString>;
    EXPO_ACCESS_TOKEN: z.ZodOptional<z.ZodString>;
    APP_SCHEME: z.ZodDefault<z.ZodString>;
    PORT: z.ZodPipe<z.ZodDefault<z.ZodString>, z.ZodTransform<number, string>>;
}, z.core.$strip>;
export type ServerEnv = z.infer<typeof serverSchema>;
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
export declare const serverEnv: {
    DATABASE_URL: string;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
    TRUSTED_ORIGINS: string[];
    PUSHER_APP_ID: string;
    PUSHER_KEY: string;
    PUSHER_SECRET: string;
    PUSHER_CLUSTER: string;
    APP_SCHEME: string;
    PORT: number;
    EXPO_ACCESS_TOKEN?: string | undefined;
};
export {};
