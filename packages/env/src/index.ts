/**
 * @enxoval/env — Centralized, validated environment variables.
 *
 * Usage:
 *   - Server (API, DB):   import { serverEnv } from '@enxoval/env/server'
 *   - Client (Mobile):    import { clientEnv } from '@enxoval/env/client'
 *
 * Do NOT import both in the same bundle to avoid leaking server secrets
 * into the client.
 */
export { serverEnv, type ServerEnv } from './server';
export { clientEnv, type ClientEnv } from './client';
