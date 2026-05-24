import { execSync } from 'child_process';
import { join } from 'path';
import { Pool } from 'pg';

const EXPECTED_TABLES = [
  'users',
  'teams',
  'matches',
  'groups',
  'group_members',
  'oracle_predictions',
  'match_predictions',
  'players',
];

const host = process.env.POSTGRES_HOST || 'localhost';
const user = process.env.POSTGRES_USER || 'copa2026';
const password = process.env.POSTGRES_PASSWORD || 'postgres';
const db = process.env.POSTGRES_DB || 'copa2026';
const port = process.env.POSTGRES_PORT || '5432';

const databaseUrl =
  process.env.DATABASE_URL ||
  `postgresql://${user}:${password}@${host}:${port}/${db}?schema=public`;

async function getExistingTables(pool: Pool): Promise<Set<string>> {
  const result = await pool.query<{ table_name: string }>(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_type = 'BASE TABLE'
       AND table_name NOT IN ('_prisma_migrations')`,
  );

  return new Set(result.rows.map((row) => row.table_name));
}

async function main() {
  const pool = new Pool({ connectionString: databaseUrl });

  try {
    const existingTables = await getExistingTables(pool);
    const missingTables = EXPECTED_TABLES.filter((table) => !existingTables.has(table));

    if (missingTables.length === 0) {
      console.log('Schema is complete. Skipping sync.');
      return;
    }

    console.log(
      `Missing tables detected (${missingTables.join(', ')}). Syncing schema without dropping existing data...`,
    );

    execSync('npx prisma db push', {
      stdio: 'inherit',
      cwd: join(__dirname, '..'),
    });

    console.log('Schema sync completed.');
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
