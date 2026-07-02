import { Pool } from 'pg';

type VenueFix = {
  stage: string;
  date: string;
  stadium: string;
  city: string;
};

const host = process.env.POSTGRES_HOST || 'localhost';
const user = process.env.POSTGRES_USER || 'copa2026';
const password = process.env.POSTGRES_PASSWORD || 'postgres';
const db = process.env.POSTGRES_DB || 'copa2026';
const port = process.env.POSTGRES_PORT || '5432';

const databaseUrl =
  process.env.DATABASE_URL ||
  `postgresql://${user}:${password}@${host}:${port}/${db}?schema=public`;

const KNOCKOUT_VENUE_FIXES: VenueFix[] = [
  { stage: 'Oitavas de Final', date: '2026-07-04T21:00:00', stadium: 'NRG Stadium', city: 'Houston' },
  { stage: 'Oitavas de Final', date: '2026-07-05T00:00:00', stadium: 'MetLife Stadium', city: 'Nova York/Nova Jersey' },
  { stage: 'Oitavas de Final', date: '2026-07-05T21:00:00', stadium: 'Estádio Azteca', city: 'Cidade do México' },
  { stage: 'Oitavas de Final', date: '2026-07-06T00:00:00', stadium: 'AT&T Stadium', city: 'Dallas' },
  { stage: 'Oitavas de Final', date: '2026-07-06T21:00:00', stadium: 'Lumen Field', city: 'Seattle' },
  { stage: 'Oitavas de Final', date: '2026-07-07T00:00:00', stadium: 'Mercedes-Benz Stadium', city: 'Atlanta' },
  { stage: 'Oitavas de Final', date: '2026-07-07T21:00:00', stadium: 'BC Place', city: 'Vancouver' },
  { stage: 'Oitavas de Final', date: '2026-07-08T00:00:00', stadium: 'Lumen Field', city: 'Seattle' },
  { stage: 'Quartas de Final', date: '2026-07-09T20:00:00', stadium: 'Gillette Stadium', city: 'Boston' },
  { stage: 'Quartas de Final', date: '2026-07-10T19:00:00', stadium: 'SoFi Stadium', city: 'Los Angeles' },
  { stage: 'Quartas de Final', date: '2026-07-11T21:00:00', stadium: 'Hard Rock Stadium', city: 'Miami' },
  { stage: 'Quartas de Final', date: '2026-07-12T01:00:00', stadium: 'Arrowhead Stadium', city: 'Kansas City' },
  { stage: 'Semifinais', date: '2026-07-14T19:00:00', stadium: 'AT&T Stadium', city: 'Dallas' },
  { stage: 'Semifinais', date: '2026-07-15T19:00:00', stadium: 'Mercedes-Benz Stadium', city: 'Atlanta' },
  { stage: 'Terceiro Lugar', date: '2026-07-18T21:00:00', stadium: 'Hard Rock Stadium', city: 'Miami' },
  { stage: 'Final', date: '2026-07-19T19:00:00', stadium: 'MetLife Stadium', city: 'Nova York/Nova Jersey' },
];

async function main() {
  const pool = new Pool({ connectionString: databaseUrl });
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    let totalUpdated = 0;
    for (const fix of KNOCKOUT_VENUE_FIXES) {
      const result = await client.query(
        `
          UPDATE matches
          SET "stadium" = $1,
              "city" = $2
          WHERE "stage" = $3
            AND "date" = $4::timestamp
            AND ("stadium" = 'TBD' OR "city" = 'TBD')
        `,
        [fix.stadium, fix.city, fix.stage, fix.date],
      );
      totalUpdated += result.rowCount ?? 0;
    }

    await client.query('COMMIT');

    const remaining = await client.query<{ count: string }>(
      `
        SELECT COUNT(*)::text AS count
        FROM matches
        WHERE "stage" IN ('Oitavas de Final', 'Quartas de Final', 'Semifinais', 'Terceiro Lugar', 'Final')
          AND ("stadium" = 'TBD' OR "city" = 'TBD')
      `,
    );

    console.log(
      `[fix-knockout-venues] Atualização concluída. Registros atualizados: ${totalUpdated}. Restantes com TBD: ${remaining.rows[0]?.count ?? '0'}.`,
    );
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('[fix-knockout-venues] Falha ao aplicar correções idempotentes de estádio/cidade:', error);
  process.exit(1);
});
