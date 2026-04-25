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
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const sql = postgres(connectionString, { max: 1 });
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
