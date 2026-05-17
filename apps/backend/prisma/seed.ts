import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with Teams and Matches...');

  // ─── TEAMS ─────────────────────────────────────────────────────────────────
  const teamsData = [
    { name: 'Brasil', code: 'BRA' },
    { name: 'Argentina', code: 'ARG' },
    { name: 'França', code: 'FRA' },
    { name: 'Inglaterra', code: 'ENG' },
    { name: 'Espanha', code: 'ESP' },
    { name: 'Alemanha', code: 'GER' },
    { name: 'Portugal', code: 'POR' },
    { name: 'Estados Unidos', code: 'USA' },
    { name: 'México', code: 'MEX' },
    { name: 'Canadá', code: 'CAN' },
  ];

  const teams = [];
  for (const t of teamsData) {
    const team = await prisma.team.upsert({
      where: { code: t.code },
      update: {},
      create: t,
    });
    teams.push(team);
  }

  // ─── MATCHES ───────────────────────────────────────────────────────────────
  // Data e hora de alguns jogos da Copa (Horário UTC, formato ISO)
  // Abertura: 11 de junho de 2026, Estádio Azteca (México)
  const matchesData = [
    {
      homeTeamId: teams.find((t) => t.code === 'MEX')?.id,
      awayTeamId: teams.find((t) => t.code === 'BRA')?.id,
      date: new Date('2026-06-11T16:00:00Z'),
      stadium: 'Estádio Azteca',
      city: 'Cidade do México',
      stage: 'Fase de Grupos',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'USA')?.id,
      awayTeamId: teams.find((t) => t.code === 'ENG')?.id,
      date: new Date('2026-06-12T19:00:00Z'),
      stadium: 'SoFi Stadium',
      city: 'Los Angeles',
      stage: 'Fase de Grupos',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'CAN')?.id,
      awayTeamId: teams.find((t) => t.code === 'FRA')?.id,
      date: new Date('2026-06-12T22:00:00Z'),
      stadium: 'BMO Field',
      city: 'Toronto',
      stage: 'Fase de Grupos',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'ARG')?.id,
      awayTeamId: teams.find((t) => t.code === 'ESP')?.id,
      date: new Date('2026-06-13T16:00:00Z'),
      stadium: 'MetLife Stadium',
      city: 'Nova York',
      stage: 'Fase de Grupos',
    },
    // Finais (Mock)
    {
      homeTeamName: 'Vencedor Semifinal 1',
      awayTeamName: 'Vencedor Semifinal 2',
      date: new Date('2026-07-19T16:00:00Z'),
      stadium: 'MetLife Stadium',
      city: 'Nova York / Nova Jersey',
      stage: 'Final',
    },
  ];

  for (const m of matchesData) {
    await prisma.match.create({
      data: m,
    });
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
