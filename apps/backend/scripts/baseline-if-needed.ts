import { execSync } from 'child_process';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';

const host = process.env.POSTGRES_HOST || 'localhost';
const user = process.env.POSTGRES_USER || 'copa2026';
const password = process.env.POSTGRES_PASSWORD || 'postgres';
const db = process.env.POSTGRES_DB || 'copa2026';
const port = process.env.POSTGRES_PORT || '5432';

const databaseUrl =
  process.env.DATABASE_URL ||
  `postgresql://${user}:${password}@${host}:${port}/${db}?schema=public`;

async function countAppliedMigrations(pool: Pool): Promise<number> {
  try {
    const result = await pool.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM "_prisma_migrations" WHERE "finished_at" IS NOT NULL',
    );
    return Number(result.rows[0]?.count ?? 0);
  } catch {
    return 0;
  }
}

async function countAppTables(pool: Pool): Promise<number> {
  const result = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_type = 'BASE TABLE'
       AND table_name NOT IN ('_prisma_migrations')`,
  );
  return Number(result.rows[0]?.count ?? 0);
}

function listMigrationNames(): string[] {
  const migrationsDir = join(__dirname, '../prisma/migrations');
  return readdirSync(migrationsDir)
    .filter((name) => name !== 'migration_lock.toml')
    .filter((name) => existsSync(join(migrationsDir, name, 'migration.sql')))
    .sort();
}

async function main() {
  const pool = new Pool({ connectionString: databaseUrl });

  try {
    const [appTables, appliedMigrations] = await Promise.all([
      countAppTables(pool),
      countAppliedMigrations(pool),
    ]);

    if (appTables === 0) {
      console.log('Fresh database detected. Skipping baseline.');
      return;
    }

    if (appliedMigrations > 0) {
      console.log('Migration history already present. Skipping baseline.');
      return;
    }

    console.log(
      'Database has existing tables but no Prisma migration history. Baselining without data loss...',
    );

    for (const migrationName of listMigrationNames()) {
      console.log(`Marking migration as applied: ${migrationName}`);
      execSync(`npx prisma migrate resolve --applied ${migrationName}`, {
        stdio: 'inherit',
        cwd: join(__dirname, '..'),
      });
    }

    console.log('Baseline completed.');
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
