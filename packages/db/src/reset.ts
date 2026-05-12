import { serverEnv } from '@enxoval/env/server';
import postgres from 'postgres';

const TABLES = [
  'invites',
  'products',
  'rooms',
  'profiles',
  'couples',
  'link_cache',
  'verification',
  'session',
  'account',
  '"user"',
];

async function main() {
  const sql = postgres(serverEnv.DATABASE_URL, { max: 1 });
  try {
    const list = TABLES.join(', ');
    console.log(`Truncating: ${list}`);
    await sql.unsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE;`);
    console.log('✓ Done. Schema preserved, migrations intact.');
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
