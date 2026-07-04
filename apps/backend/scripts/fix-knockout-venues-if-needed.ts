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
  { stage: 'Quartas de Final', date: '2026-07-09T17:00:00', stadium: 'Gillette Stadium', city: 'Boston' },
  { stage: 'Quartas de Final', date: '2026-07-10T16:00:00', stadium: 'SoFi Stadium', city: 'Los Angeles' },
  { stage: 'Quartas de Final', date: '2026-07-11T18:00:00', stadium: 'Hard Rock Stadium', city: 'Miami' },
  { stage: 'Quartas de Final', date: '2026-07-11T22:00:00', stadium: 'Arrowhead Stadium', city: 'Kansas City' },
  { stage: 'Semifinais', date: '2026-07-14T16:00:00', stadium: 'AT&T Stadium', city: 'Dallas' },
  { stage: 'Semifinais', date: '2026-07-15T16:00:00', stadium: 'Mercedes-Benz Stadium', city: 'Atlanta' },
  { stage: 'Terceiro Lugar', date: '2026-07-18T18:00:00', stadium: 'Hard Rock Stadium', city: 'Miami' },
  { stage: 'Final', date: '2026-07-19T16:00:00', stadium: 'MetLife Stadium', city: 'Nova York/Nova Jersey' },
];

async function main() {
  const pool = new Pool({ connectionString: databaseUrl });
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    let totalUpdated = 0;

    const roundOf32Update = await client.query(
      `
        WITH ranked AS (
          SELECT id, ROW_NUMBER() OVER (ORDER BY "date", id) AS rn
          FROM matches
          WHERE "stage" = 'Dezesseisavos de Final'
        ),
        expected AS (
          SELECT *
          FROM (VALUES
            (1, 'RSA', 'CAN', TIMESTAMP '2026-06-28 16:00:00', 'SoFi Stadium', 'Inglewood (Los Angeles)'),
            (2, 'BRA', 'JPN', TIMESTAMP '2026-06-29 14:00:00', 'NRG Stadium', 'Houston'),
            (3, 'GER', 'PAR', TIMESTAMP '2026-06-29 17:30:00', 'Gillette Stadium', 'Foxborough (Boston)'),
            (4, 'NED', 'MAR', TIMESTAMP '2026-06-29 22:00:00', 'Estadio BBVA', 'Guadalupe (Monterrey)'),
            (5, 'CIV', 'NOR', TIMESTAMP '2026-06-30 14:00:00', 'AT&T Stadium', 'Arlington (Dallas)'),
            (6, 'FRA', 'SWE', TIMESTAMP '2026-06-30 18:00:00', 'MetLife Stadium', 'East Rutherford (Nova Jersey)'),
            (7, 'MEX', 'ECU', TIMESTAMP '2026-06-30 22:00:00', 'Estádio Azteca', 'Cidade do México'),
            (8, 'ENG', 'COD', TIMESTAMP '2026-07-01 13:00:00', 'Mercedes-Benz Stadium', 'Atlanta'),
            (9, 'BEL', 'SEN', TIMESTAMP '2026-07-01 17:00:00', 'Lumen Field', 'Seattle'),
            (10, 'USA', 'BIH', TIMESTAMP '2026-07-01 21:00:00', 'Levi''s Stadium', 'Santa Clara'),
            (11, 'ESP', 'AUT', TIMESTAMP '2026-07-02 16:00:00', 'SoFi Stadium', 'Inglewood (Los Angeles)'),
            (12, 'POR', 'CRO', TIMESTAMP '2026-07-02 20:00:00', 'BMO Field', 'Toronto'),
            (13, 'SUI', 'ALG', TIMESTAMP '2026-07-03 00:00:00', 'BC Place', 'Vancouver'),
            (14, 'AUS', 'EGY', TIMESTAMP '2026-07-03 15:00:00', 'Lincoln Financial Field', 'Filadélfia'),
            (15, 'ARG', 'CPV', TIMESTAMP '2026-07-03 19:00:00', 'Hard Rock Stadium', 'Miami Gardens'),
            (16, 'COL', 'GHA', TIMESTAMP '2026-07-03 22:30:00', 'BC Place', 'Vancouver')
          ) AS t(rn, "homeCode", "awayCode", "date", "stadium", "city")
        ),
        resolved AS (
          SELECT
            r.id AS match_id,
            th.id AS home_team_id,
            ta.id AS away_team_id,
            e."date",
            e."stadium",
            e."city"
          FROM ranked r
          JOIN expected e ON e.rn = r.rn
          JOIN teams th ON th.code = e."homeCode"
          JOIN teams ta ON ta.code = e."awayCode"
        )
        UPDATE matches m
        SET
          "homeTeamId" = x.home_team_id,
          "awayTeamId" = x.away_team_id,
          "homeTeamName" = NULL,
          "awayTeamName" = NULL,
          "date" = x."date",
          "stadium" = x."stadium",
          "city" = x."city"
        FROM resolved x
        WHERE m.id = x.match_id
          AND (
            m."homeTeamId" IS DISTINCT FROM x.home_team_id OR
            m."awayTeamId" IS DISTINCT FROM x.away_team_id OR
            m."homeTeamName" IS NOT NULL OR
            m."awayTeamName" IS NOT NULL OR
            m."date" <> x."date" OR
            m."stadium" <> x."stadium" OR
            m."city" <> x."city"
          )
      `,
    );
    totalUpdated += roundOf32Update.rowCount ?? 0;

    const roundOf16Update = await client.query(
      `
        WITH ranked AS (
          SELECT id, ROW_NUMBER() OVER (ORDER BY "date", id) AS rn
          FROM matches
          WHERE "stage" = 'Oitavas de Final'
        ),
        expected AS (
          SELECT *
          FROM (VALUES
            (1, 'Vencedor do jogo 73', 'Vencedor do jogo 76', TIMESTAMP '2026-07-04 14:00:00', 'NRG Stadium', 'Houston'),
            (2, 'Vencedor do jogo 75', 'Vencedor do jogo 78', TIMESTAMP '2026-07-04 18:00:00', 'Lincoln Financial Field', 'Filadélfia'),
            (3, 'Vencedor do jogo 74', 'Vencedor do jogo 77', TIMESTAMP '2026-07-05 17:00:00', 'MetLife Stadium', 'East Rutherford/Nova Jersey'),
            (4, 'Vencedor do jogo 79', 'Vencedor do jogo 80', TIMESTAMP '2026-07-05 21:00:00', 'Estádio Azteca', 'Cidade do México'),
            (5, 'Vencedor do jogo 84', 'Vencedor do jogo 83', TIMESTAMP '2026-07-06 16:00:00', 'AT&T Stadium', 'Arlington'),
            (6, 'Vencedor do jogo 82', 'Vencedor do jogo 81', TIMESTAMP '2026-07-06 21:00:00', 'Lumen Field', 'Seattle'),
            (7, 'Vencedor do jogo 87', 'Vencedor do jogo 86', TIMESTAMP '2026-07-07 13:00:00', 'Mercedes-Benz Stadium', 'Atlanta'),
            (8, 'Vencedor do jogo 85', 'Vencedor do jogo 88', TIMESTAMP '2026-07-07 17:00:00', 'BC Place', 'Vancouver')
          ) AS t(rn, "homeTeamName", "awayTeamName", "date", "stadium", "city")
        )
        UPDATE matches m
        SET
          "homeTeamName" = e."homeTeamName",
          "awayTeamName" = e."awayTeamName",
          "date" = e."date",
          "stadium" = e."stadium",
          "city" = e."city"
        FROM ranked r
        JOIN expected e ON e.rn = r.rn
        WHERE m.id = r.id
          AND (
            m."homeTeamName" <> e."homeTeamName" OR
            m."awayTeamName" <> e."awayTeamName" OR
            m."date" <> e."date" OR
            m."stadium" <> e."stadium" OR
            m."city" <> e."city"
          )
      `,
    );
    totalUpdated += roundOf16Update.rowCount ?? 0;

    for (const fix of KNOCKOUT_VENUE_FIXES) {
      const result = await client.query(
        `
          UPDATE matches
          SET "date" = $1::timestamp,
              "stadium" = $2,
              "city" = $3
          WHERE "stage" = $4
            AND ("stadium" = $2 OR "stadium" = 'TBD')
            AND (
              "date" <> $1::timestamp OR
              "stadium" <> $2 OR
              "city" <> $3
            )
        `,
        [fix.date, fix.stadium, fix.city, fix.stage],
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

    const roundOf16Mismatches = await client.query<{ count: string }>(
      `
        WITH ranked AS (
          SELECT id, "homeTeamName", "awayTeamName", "date", "stadium", "city",
                 ROW_NUMBER() OVER (ORDER BY "date", id) AS rn
          FROM matches
          WHERE "stage" = 'Oitavas de Final'
        ),
        expected AS (
          SELECT *
          FROM (VALUES
            (1, 'Vencedor do jogo 73', 'Vencedor do jogo 76', TIMESTAMP '2026-07-04 14:00:00', 'NRG Stadium', 'Houston'),
            (2, 'Vencedor do jogo 75', 'Vencedor do jogo 78', TIMESTAMP '2026-07-04 18:00:00', 'Lincoln Financial Field', 'Filadélfia'),
            (3, 'Vencedor do jogo 74', 'Vencedor do jogo 77', TIMESTAMP '2026-07-05 17:00:00', 'MetLife Stadium', 'East Rutherford/Nova Jersey'),
            (4, 'Vencedor do jogo 79', 'Vencedor do jogo 80', TIMESTAMP '2026-07-05 21:00:00', 'Estádio Azteca', 'Cidade do México'),
            (5, 'Vencedor do jogo 84', 'Vencedor do jogo 83', TIMESTAMP '2026-07-06 16:00:00', 'AT&T Stadium', 'Arlington'),
            (6, 'Vencedor do jogo 82', 'Vencedor do jogo 81', TIMESTAMP '2026-07-06 21:00:00', 'Lumen Field', 'Seattle'),
            (7, 'Vencedor do jogo 87', 'Vencedor do jogo 86', TIMESTAMP '2026-07-07 13:00:00', 'Mercedes-Benz Stadium', 'Atlanta'),
            (8, 'Vencedor do jogo 85', 'Vencedor do jogo 88', TIMESTAMP '2026-07-07 17:00:00', 'BC Place', 'Vancouver')
          ) AS t(rn, "homeTeamName", "awayTeamName", "date", "stadium", "city")
        )
        SELECT COUNT(*)::text AS count
        FROM expected e
        LEFT JOIN ranked r ON r.rn = e.rn
        WHERE r.id IS NULL
           OR r."homeTeamName" <> e."homeTeamName"
           OR r."awayTeamName" <> e."awayTeamName"
           OR r."date" <> e."date"
           OR r."stadium" <> e."stadium"
           OR r."city" <> e."city"
      `,
    );
    console.log(`[fix-knockout-venues] Verificação Oitavas: divergências restantes = ${roundOf16Mismatches.rows[0]?.count ?? '0'}.`);
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
