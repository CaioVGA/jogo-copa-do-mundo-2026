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

const migrations = [
  {
    stage: 'Oitavas de Final',
    matches: [
      { home: 'Vencedor do jogo 73', away: 'Vencedor do jogo 76', date: new Date('2026-07-04T14:00:00-03:00') },
      { home: 'Vencedor do jogo 75', away: 'Vencedor do jogo 78', date: new Date('2026-07-04T18:00:00-03:00') },
      { home: 'Vencedor do jogo 74', away: 'Vencedor do jogo 77', date: new Date('2026-07-05T17:00:00-03:00') },
      { home: 'Vencedor do jogo 79', away: 'Vencedor do jogo 80', date: new Date('2026-07-05T21:00:00-03:00') },
      { home: 'Vencedor do jogo 84', away: 'Vencedor do jogo 83', date: new Date('2026-07-06T16:00:00-03:00') },
      { home: 'Vencedor do jogo 82', away: 'Vencedor do jogo 81', date: new Date('2026-07-06T21:00:00-03:00') },
      { home: 'Vencedor do jogo 87', away: 'Vencedor do jogo 86', date: new Date('2026-07-07T13:00:00-03:00') },
      { home: 'Vencedor do jogo 85', away: 'Vencedor do jogo 88', date: new Date('2026-07-07T17:00:00-03:00') },
    ]
  },
  {
    stage: 'Quartas de Final',
    matches: [
      { home: 'Vencedor do jogo 89', away: 'Vencedor do jogo 90', date: new Date('2026-07-09T17:00:00-03:00') },
      { home: 'Vencedor do jogo 91', away: 'Vencedor do jogo 92', date: new Date('2026-07-10T16:00:00-03:00') },
      { home: 'Vencedor do jogo 93', away: 'Vencedor do jogo 94', date: new Date('2026-07-11T18:00:00-03:00') },
      { home: 'Vencedor do jogo 95', away: 'Vencedor do jogo 96', date: new Date('2026-07-11T22:00:00-03:00') },
    ]
  },
  {
    stage: 'Semifinais',
    matches: [
      { home: 'Vencedor do jogo 97', away: 'Vencedor do jogo 98', date: new Date('2026-07-14T16:00:00-03:00') },
      { home: 'Vencedor do jogo 99', away: 'Vencedor do jogo 100', date: new Date('2026-07-15T16:00:00-03:00') },
    ]
  },
  {
    stage: 'Terceiro Lugar',
    matches: [
      { home: 'Perdedor do jogo 101', away: 'Perdedor do jogo 102', date: new Date('2026-07-18T18:00:00-03:00') },
    ]
  },
  {
    stage: 'Final',
    matches: [
      { home: 'Vencedor do jogo 101', away: 'Vencedor do jogo 102', date: new Date('2026-07-19T16:00:00-03:00') },
    ]
  }
];

async function main() {
  console.log('Iniciando migração segura das partidas do Mata-Mata V2...');
  
  // FIX CRÍTICO: Corrige o estágio do Jogo 88 (Colômbia x Gana) que estava errado no banco
  console.log('Verificando erro de estágio no Jogo 88...');
  const match88 = await prisma.match.findFirst({
    where: {
      date: new Date('2026-07-03T22:30:00-03:00'),
    }
  });
  if (match88 && match88.stage === 'Fase de Grupos - Rodada 3') {
    await prisma.match.update({
      where: { id: match88.id },
      data: { stage: 'Dezesseisavos de Final' }
    });
    console.log('[OK] Jogo 88 corrigido de Fase de Grupos para Dezesseisavos de Final!');
  }

  let successCount = 0;
  let notFoundCount = 0;

  for (const group of migrations) {
    const existingMatches = await prisma.match.findMany({
      where: { stage: group.stage },
      orderBy: { date: 'asc' }
    });

    if (existingMatches.length !== group.matches.length) {
      console.log(`[ERRO] A fase '${group.stage}' deveria ter ${group.matches.length} jogos, mas encontrou ${existingMatches.length} no banco. Isso pode causar problemas.`);
    }

    for (let i = 0; i < existingMatches.length; i++) {
      const dbMatch = existingMatches[i];
      const newMatchData = group.matches[i];

      if (!newMatchData) {
        console.log(`[AVISO] Sobrou um jogo extra no banco para ${group.stage} que não tem mapeamento correspondente: ${dbMatch.id}`);
        notFoundCount++;
        continue;
      }

      await prisma.match.update({
        where: { id: dbMatch.id },
        data: {
          homeTeamName: newMatchData.home,
          awayTeamName: newMatchData.away,
          date: newMatchData.date, // Atualizamos também a data para garantir que bata 100%
        }
      });
      console.log(`[OK] Jogo de ${group.stage} (ID: ${dbMatch.id}) atualizado para: ${newMatchData.home} vs ${newMatchData.away} (${newMatchData.date.toISOString()})`);
      successCount++;
    }
  }

  console.log('--- Resumo da Migração ---');
  console.log(`Partidas atualizadas com sucesso: ${successCount}`);
  if (notFoundCount > 0) {
    console.log(`Partidas com problemas de mapeamento: ${notFoundCount}`);
    console.log('MIGRAÇÃO FINALIZADA COM AVISOS.');
  } else {
    console.log('MIGRAÇÃO CONCLUÍDA COM SUCESSO! 100% DOS DADOS ATUALIZADOS.');
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
