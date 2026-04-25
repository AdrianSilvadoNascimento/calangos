import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { serverEnv } from '@enxoval/env/server';

let _db: ReturnType<typeof createDb> | null = null;

function createDb() {
  const client = postgres(serverEnv.DATABASE_URL, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  return drizzle(client, { schema });
}

/**
 * Lazy-initialized Drizzle DB instance.
 * Only connects when first accessed, not at import time.
 */
export function getDb() {
  if (!_db) {
    _db = createDb();
  }
  return _db;
}

export type DB = ReturnType<typeof createDb>;

