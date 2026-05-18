import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL || 'postgresql://copa2026:postgres@localhost:5432/copa2026?schema=public';
const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Cleaning up existing database records...');
  await prisma.match.deleteMany();
  await prisma.oraclePrediction.deleteMany();
  await prisma.team.deleteMany();

  console.log('Seeding database with Teams and Matches...');
  const teamsData = [
    // Grupo A
    { name: 'México', code: 'MEX', iso2: 'mx', group: 'A' },
    { name: 'África do Sul', code: 'RSA', iso2: 'za', group: 'A' },
    { name: 'Coreia do Sul', code: 'KOR', iso2: 'kr', group: 'A' },
    { name: 'República Tcheca', code: 'CZE', iso2: 'cz', group: 'A' },
    // Grupo B
    { name: 'Canadá', code: 'CAN', iso2: 'ca', group: 'B' },
    { name: 'Bósnia e Herzegovina', code: 'BIH', iso2: 'ba', group: 'B' },
    { name: 'Catar', code: 'QAT', iso2: 'qa', group: 'B' },
    { name: 'Suíça', code: 'SUI', iso2: 'ch', group: 'B' },
    // Grupo C
    { name: 'Brasil', code: 'BRA', iso2: 'br', group: 'C' },
    { name: 'Marrocos', code: 'MAR', iso2: 'ma', group: 'C' },
    { name: 'Haiti', code: 'HAI', iso2: 'ht', group: 'C' },
    { name: 'Escócia', code: 'SCO', iso2: 'gb-sct', group: 'C' },
    // Grupo D
    { name: 'Estados Unidos', code: 'USA', iso2: 'us', group: 'D' },
    { name: 'Paraguai', code: 'PAR', iso2: 'py', group: 'D' },
    { name: 'Austrália', code: 'AUS', iso2: 'au', group: 'D' },
    { name: 'Turquia', code: 'TUR', iso2: 'tr', group: 'D' },
    // Grupo E
    { name: 'Alemanha', code: 'GER', iso2: 'de', group: 'E' },
    { name: 'Curaçao', code: 'CUW', iso2: 'cw', group: 'E' },
    { name: 'Costa do Marfim', code: 'CIV', iso2: 'ci', group: 'E' },
    { name: 'Equador', code: 'ECU', iso2: 'ec', group: 'E' },
    // Grupo F
    { name: 'Holanda', code: 'NED', iso2: 'nl', group: 'F' },
    { name: 'Japão', code: 'JPN', iso2: 'jp', group: 'F' },
    { name: 'Suécia', code: 'SWE', iso2: 'se', group: 'F' },
    { name: 'Tunísia', code: 'TUN', iso2: 'tn', group: 'F' },
    // Grupo G
    { name: 'Bélgica', code: 'BEL', iso2: 'be', group: 'G' },
    { name: 'Egito', code: 'EGY', iso2: 'eg', group: 'G' },
    { name: 'Irã', code: 'IRN', iso2: 'ir', group: 'G' },
    { name: 'Nova Zelândia', code: 'NZL', iso2: 'nz', group: 'G' },
    // Grupo H
    { name: 'Espanha', code: 'ESP', iso2: 'es', group: 'H' },
    { name: 'Cabo Verde', code: 'CPV', iso2: 'cv', group: 'H' },
    { name: 'Arábia Saudita', code: 'KSA', iso2: 'sa', group: 'H' },
    { name: 'Uruguai', code: 'URU', iso2: 'uy', group: 'H' },
    // Grupo I
    { name: 'França', code: 'FRA', iso2: 'fr', group: 'I' },
    { name: 'Senegal', code: 'SEN', iso2: 'sn', group: 'I' },
    { name: 'Iraque', code: 'IRQ', iso2: 'iq', group: 'I' },
    { name: 'Noruega', code: 'NOR', iso2: 'no', group: 'I' },
    // Grupo J
    { name: 'Argentina', code: 'ARG', iso2: 'ar', group: 'J' },
    { name: 'Argélia', code: 'ALG', iso2: 'dz', group: 'J' },
    { name: 'Áustria', code: 'AUT', iso2: 'at', group: 'J' },
    { name: 'Jordânia', code: 'JOR', iso2: 'jo', group: 'J' },
    // Grupo K
    { name: 'Portugal', code: 'POR', iso2: 'pt', group: 'K' },
    { name: 'Colômbia', code: 'COL', iso2: 'co', group: 'K' },
    { name: 'Uzbequistão', code: 'UZB', iso2: 'uz', group: 'K' },
    { name: 'República Democrática do Congo', code: 'COD', iso2: 'cd', group: 'K' },
    // Grupo L
    { name: 'Inglaterra', code: 'ENG', iso2: 'gb-eng', group: 'L' },
    { name: 'Croácia', code: 'CRO', iso2: 'hr', group: 'L' },
    { name: 'Gana', code: 'GHA', iso2: 'gh', group: 'L' },
    { name: 'Panamá', code: 'PAN', iso2: 'pa', group: 'L' },
  ];

  const teams = [];
  for (const t of teamsData) {
    let flagBase64 = undefined;
    try {
      const response = await fetch(`https://flagcdn.com/w40/${t.iso2}.png`);
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        flagBase64 = 'data:image/png;base64,' + Buffer.from(buffer).toString('base64');
      }
    } catch (e) {
      console.error(`Falha ao buscar bandeira para ${t.name}`, e);
    }

    const { iso2, ...teamCreateData } = t;

    const team = await prisma.team.upsert({
      where: { code: t.code },
      update: { flag: flagBase64, group: t.group },
      create: { ...teamCreateData, flag: flagBase64 },
    });
    teams.push(team);
  }

  // ─── MATCHES ───────────────────────────────────────────────────────────────
  const matchesData = [
    // 🔵 1ª Rodada (11 a 17 de junho)
    {
      homeTeamId: teams.find((t) => t.code === 'MEX')?.id,
      awayTeamId: teams.find((t) => t.code === 'RSA')?.id,
      date: new Date('2026-06-11T16:00:00-03:00'),
      stadium: 'Estádio Azteca',
      city: 'Cidade do México',
      stage: 'Fase de Grupos - Rodada 1',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'KOR')?.id,
      awayTeamId: teams.find((t) => t.code === 'CZE')?.id,
      date: new Date('2026-06-11T23:00:00-03:00'),
      stadium: 'MetLife Stadium',
      city: 'Nova York/NJ',
      stage: 'Fase de Grupos - Rodada 1',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'CAN')?.id,
      awayTeamId: teams.find((t) => t.code === 'BIH')?.id,
      date: new Date('2026-06-12T16:00:00-03:00'),
      stadium: 'BC Place',
      city: 'Vancouver',
      stage: 'Fase de Grupos - Rodada 1',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'USA')?.id,
      awayTeamId: teams.find((t) => t.code === 'PAR')?.id,
      date: new Date('2026-06-12T22:00:00-03:00'),
      stadium: 'SoFi Stadium',
      city: 'Los Angeles',
      stage: 'Fase de Grupos - Rodada 1',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'QAT')?.id,
      awayTeamId: teams.find((t) => t.code === 'SUI')?.id,
      date: new Date('2026-06-13T16:00:00-03:00'),
      stadium: 'Hard Rock Stadium',
      city: 'Miami',
      stage: 'Fase de Grupos - Rodada 1',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'BRA')?.id,
      awayTeamId: teams.find((t) => t.code === 'MAR')?.id,
      date: new Date('2026-06-13T19:00:00-03:00'),
      stadium: 'Gillette Stadium',
      city: 'Boston',
      stage: 'Fase de Grupos - Rodada 1',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'HAI')?.id,
      awayTeamId: teams.find((t) => t.code === 'SCO')?.id,
      date: new Date('2026-06-13T22:00:00-03:00'),
      stadium: 'NRG Stadium',
      city: 'Houston',
      stage: 'Fase de Grupos - Rodada 1',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'AUS')?.id,
      awayTeamId: teams.find((t) => t.code === 'TUR')?.id,
      date: new Date('2026-06-14T01:00:00-03:00'),
      stadium: 'Lumen Field',
      city: 'Seattle',
      stage: 'Fase de Grupos - Rodada 1',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'AUT')?.id,
      awayTeamId: teams.find((t) => t.code === 'JOR')?.id,
      date: new Date('2026-06-18T01:00:00-03:00'), // 17/06 01h BRT
      stadium: 'Mercedes-Benz Stadium',
      city: 'Atlanta',
      stage: 'Fase de Grupos - Rodada 1',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'POR')?.id,
      awayTeamId: teams.find((t) => t.code === 'COD')?.id,
      date: new Date('2026-06-17T14:00:00-03:00'),
      stadium: 'Arrowhead Stadium',
      city: 'Kansas City',
      stage: 'Fase de Grupos - Rodada 1',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'ENG')?.id,
      awayTeamId: teams.find((t) => t.code === 'CRO')?.id,
      date: new Date('2026-06-17T17:00:00-03:00'),
      stadium: 'Lincoln Financial Field',
      city: 'Filadélfia',
      stage: 'Fase de Grupos - Rodada 1',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'GHA')?.id,
      awayTeamId: teams.find((t) => t.code === 'PAN')?.id,
      date: new Date('2026-06-17T20:00:00-03:00'),
      stadium: 'Levi Stadium',
      city: 'São Francisco',
      stage: 'Fase de Grupos - Rodada 1',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'UZB')?.id,
      awayTeamId: teams.find((t) => t.code === 'COL')?.id,
      date: new Date('2026-06-17T23:00:00-03:00'),
      stadium: 'AT&T Stadium',
      city: 'Dallas',
      stage: 'Fase de Grupos - Rodada 1',
    },

    // 🟡 2ª Rodada (18 a 23 de junho)
    {
      homeTeamId: teams.find((t) => t.code === 'CZE')?.id,
      awayTeamId: teams.find((t) => t.code === 'RSA')?.id,
      date: new Date('2026-06-18T13:00:00-03:00'),
      stadium: 'BMO Field',
      city: 'Toronto',
      stage: 'Fase de Grupos - Rodada 2',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'SUI')?.id,
      awayTeamId: teams.find((t) => t.code === 'BIH')?.id,
      date: new Date('2026-06-18T16:00:00-03:00'),
      stadium: 'Gillette Stadium',
      city: 'Boston',
      stage: 'Fase de Grupos - Rodada 2',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'CAN')?.id,
      awayTeamId: teams.find((t) => t.code === 'QAT')?.id,
      date: new Date('2026-06-18T19:00:00-03:00'),
      stadium: 'BC Place',
      city: 'Vancouver',
      stage: 'Fase de Grupos - Rodada 2',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'MEX')?.id,
      awayTeamId: teams.find((t) => t.code === 'KOR')?.id,
      date: new Date('2026-06-18T22:00:00-03:00'),
      stadium: 'Estádio Azteca',
      city: 'Cidade do México',
      stage: 'Fase de Grupos - Rodada 2',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'USA')?.id,
      awayTeamId: teams.find((t) => t.code === 'AUS')?.id,
      date: new Date('2026-06-19T16:00:00-03:00'),
      stadium: 'MetLife Stadium',
      city: 'Nova York/NJ',
      stage: 'Fase de Grupos - Rodada 2',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'SCO')?.id,
      awayTeamId: teams.find((t) => t.code === 'MAR')?.id,
      date: new Date('2026-06-19T19:00:00-03:00'),
      stadium: 'Lincoln Financial Field',
      city: 'Filadélfia',
      stage: 'Fase de Grupos - Rodada 2',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'BRA')?.id,
      awayTeamId: teams.find((t) => t.code === 'HAI')?.id,
      date: new Date('2026-06-19T21:30:00-03:00'),
      stadium: 'Mercedes-Benz Stadium',
      city: 'Atlanta',
      stage: 'Fase de Grupos - Rodada 2',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'TUR')?.id,
      awayTeamId: teams.find((t) => t.code === 'PAR')?.id,
      date: new Date('2026-06-20T00:00:00-03:00'), // 19/06 00h BRT
      stadium: 'Lumen Field',
      city: 'Seattle',
      stage: 'Fase de Grupos - Rodada 2',
    },

    // 🔥 MATA-MATA (16-avos de final)
    {
      homeTeamName: '2º Grupo A',
      awayTeamName: '2º Grupo B',
      date: new Date('2026-06-28T16:00:00-03:00'),
      stadium: 'Levi Stadium',
      city: 'São Francisco',
      stage: '16-avos de final',
    },
    {
      homeTeamName: '1º Grupo E',
      awayTeamName: 'Melhor 3º Colocado',
      date: new Date('2026-06-29T13:00:00-03:00'),
      stadium: 'Hard Rock Stadium',
      city: 'Miami',
      stage: '16-avos de final',
    },
    {
      homeTeamName: '1º Grupo F',
      awayTeamName: '2º Grupo C',
      date: new Date('2026-06-29T16:00:00-03:00'),
      stadium: 'Arrowhead Stadium',
      city: 'Kansas City',
      stage: '16-avos de final',
    },
    {
      homeTeamName: '1º Grupo C',
      awayTeamName: '2º Grupo F',
      date: new Date('2026-06-29T20:00:00-03:00'),
      stadium: 'AT&T Stadium',
      city: 'Dallas',
      stage: '16-avos de final',
    },

    // 🏆 FINAL
    {
      homeTeamName: 'Vencedor Semifinal 1',
      awayTeamName: 'Vencedor Semifinal 2',
      date: new Date('2026-07-19T16:00:00-03:00'),
      stadium: 'MetLife Stadium',
      city: 'Nova York/NJ',
      stage: 'Final',
    },
  ];

  for (const m of matchesData) {
    await prisma.match.create({
      data: m,
    });
  }

  // ─── TEST USER ─────────────────────────────────────────────────────────────
  console.log('Seeding test user...');
  // Hash bcrypt pré-computado para 'password123' com 12 rounds
  const passwordHash = '$2b$12$R.S2C0WcT7mK6H20Qp6QdO3Pz0t7D6/U7D32Wepq6.D8P2TqT2R9q';
  await prisma.user.upsert({
    where: { email: 'caio@example.com' },
    update: { active: true },
    create: {
      name: 'Caio',
      email: 'caio@example.com',
      passwordHash,
      active: true,
      role: 'USER',
    },
  });

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
