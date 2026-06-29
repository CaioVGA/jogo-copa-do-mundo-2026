import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const host = process.env.POSTGRES_HOST || 'localhost';
const user = process.env.POSTGRES_USER || 'copa2026';
const password = process.env.POSTGRES_PASSWORD || 'postgres';
const db = process.env.POSTGRES_DB || 'copa2026';
const port = process.env.POSTGRES_PORT || '5432';

const databaseUrl = process.env.DATABASE_URL || `postgresql://${user}:${password}@${host}:${port}/${db}?schema=public`;

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const knockoutMatchesData = [
  // 🗓️ OITAVAS DE FINAL
  { home: 'Vencedor do jogo 75', away: 'Vencedor do jogo 78', date: new Date('2026-07-04T18:00:00-03:00'), stage: 'Oitavas de Final' },
  { home: 'Vencedor do jogo 73', away: 'Vencedor do jogo 76', date: new Date('2026-07-04T21:00:00-03:00'), stage: 'Oitavas de Final' },
  { home: 'Vencedor do jogo 84', away: 'Vencedor do jogo 83', date: new Date('2026-07-05T18:00:00-03:00'), stage: 'Oitavas de Final' },
  { home: 'Vencedor do jogo 82', away: 'Vencedor do jogo 81', date: new Date('2026-07-05T21:00:00-03:00'), stage: 'Oitavas de Final' },
  { home: 'Vencedor do jogo 74', away: 'Vencedor do jogo 77', date: new Date('2026-07-06T18:00:00-03:00'), stage: 'Oitavas de Final' },
  { home: 'Vencedor do jogo 79', away: 'Vencedor do jogo 80', date: new Date('2026-07-06T21:00:00-03:00'), stage: 'Oitavas de Final' },
  { home: 'Vencedor do jogo 87', away: 'Vencedor do jogo 86', date: new Date('2026-07-07T18:00:00-03:00'), stage: 'Oitavas de Final' },
  { home: 'Vencedor do jogo 85', away: 'Vencedor do jogo 88', date: new Date('2026-07-07T21:00:00-03:00'), stage: 'Oitavas de Final' },

  // 🗓️ QUARTAS DE FINAL
  { home: 'Vencedor do jogo 89', away: 'Vencedor do jogo 90', date: new Date('2026-07-09T17:00:00-03:00'), stage: 'Quartas de Final' },
  { home: 'Vencedor do jogo 91', away: 'Vencedor do jogo 92', date: new Date('2026-07-10T16:00:00-03:00'), stage: 'Quartas de Final' },
  { home: 'Vencedor do jogo 93', away: 'Vencedor do jogo 94', date: new Date('2026-07-11T18:00:00-03:00'), stage: 'Quartas de Final' },
  { home: 'Vencedor do jogo 95', away: 'Vencedor do jogo 96', date: new Date('2026-07-11T22:00:00-03:00'), stage: 'Quartas de Final' },

  // 🗓️ SEMIFINAIS
  { home: 'Vencedor do jogo 97', away: 'Vencedor do jogo 98', date: new Date('2026-07-14T16:00:00-03:00'), stage: 'Semifinais' },
  { home: 'Vencedor do jogo 99', away: 'Vencedor do jogo 100', date: new Date('2026-07-15T16:00:00-03:00'), stage: 'Semifinais' },

  // 🗓️ DISPUTA DO 3º LUGAR
  { home: 'Perdedor do jogo 101', away: 'Perdedor do jogo 102', date: new Date('2026-07-18T16:00:00-03:00'), stage: 'Terceiro Lugar' },

  // 🗓️ FINAL
  { home: 'Vencedor do jogo 101', away: 'Vencedor do jogo 102', date: new Date('2026-07-19T16:00:00-03:00'), stage: 'Final' }
];

async function main() {
  console.log('Iniciando migração segura das partidas do Mata-Mata...');
  
  let successCount = 0;
  let notFoundCount = 0;

  for (const matchData of knockoutMatchesData) {
    // Tenta encontrar o jogo no banco pela data exata
    const existingMatch = await prisma.match.findFirst({
      where: {
        date: matchData.date,
        stage: matchData.stage,
      },
    });

    if (existingMatch) {
      await prisma.match.update({
        where: { id: existingMatch.id },
        data: {
          homeTeamName: matchData.home,
          awayTeamName: matchData.away,
        }
      });
      console.log(`[OK] Jogo de ${matchData.stage} (${matchData.date.toISOString()}) atualizado com sucesso. Preservado ID: ${existingMatch.id}`);
      successCount++;
    } else {
      console.log(`[AVISO] Jogo de ${matchData.stage} (${matchData.date.toISOString()}) NÃO ENCONTRADO.`);
      notFoundCount++;
    }
  }

  console.log('--- Resumo da Migração ---');
  console.log(`Partidas atualizadas com sucesso: ${successCount}`);
  console.log(`Partidas não encontradas: ${notFoundCount}`);
  if (successCount === 16) {
    console.log('MIGRAÇÃO CONCLUÍDA COM SUCESSO! SEUS DADOS ESTÃO SEGUROS.');
  } else {
    console.log('MIGRAÇÃO FINALIZADA COM AVISOS.');
  }
}

main()
  .catch((e) => {
    console.error('Erro ao migrar as partidas:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
