import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { expo } from '@better-auth/expo';
import { getDb } from '@enxoval/db';
import * as schema from '@enxoval/db/schema';
import { serverEnv } from '@enxoval/env/server';

export const auth = betterAuth({
  database: drizzleAdapter(getDb(), {
    provider: 'pg',
    schema,
  }),
  baseURL: serverEnv.BETTER_AUTH_URL,
  secret: serverEnv.BETTER_AUTH_SECRET,
  trustedOrigins: serverEnv.TRUSTED_ORIGINS,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  plugins: [expo()],
});

export type Auth = typeof auth;

