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

async function main() {
  const forceSeed = false;
  if (!forceSeed) {
    const existingTeamsCount = await prisma.team.count();
    if (existingTeamsCount > 0) {
      console.log('Database already seeded. Skipping cleanup and seeding.');
      // Execute live name corrections on already seeded databases
      await prisma.team.updateMany({
        where: { code: 'CUW', name: 'Curaçau' },
        data: { name: 'Curaçao' },
      });
      await seedPlayers();
      return;
    }
  }

  console.log('Cleaning up existing database records...');
  await prisma.match.deleteMany();
  await prisma.oraclePrediction.deleteMany();
  await prisma.team.deleteMany();

  console.log('Seeding database with Teams...');
  const teamsData = [
    // Grupo A
    { name: 'México', code: 'MEX', iso2: 'mx', group: 'A' },
    { name: 'África do Sul', code: 'RSA', iso2: 'za', group: 'A' },
    { name: 'Coréia do Sul', code: 'KOR', iso2: 'kr', group: 'A' },
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
    { name: 'Rep. Dem. do Congo', code: 'COD', iso2: 'cd', group: 'K' },
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
      update: { name: t.name, flag: flagBase64, group: t.group },
      create: { ...teamCreateData, flag: flagBase64 },
    });
    teams.push(team);
  }

  console.log('Seeding database with Matches...');
  const matchesData = [
    // 🔵 1ª Rodada (11 a 17 de junho)
    // 11 de junho
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
      stadium: 'Estádio de Guadalajara',
      city: 'Guadalajara',
      stage: 'Fase de Grupos - Rodada 1',
    },
    // 12 de junho
    {
      homeTeamId: teams.find((t) => t.code === 'CAN')?.id,
      awayTeamId: teams.find((t) => t.code === 'BIH')?.id,
      date: new Date('2026-06-12T16:00:00-03:00'),
      stadium: 'BMO Field',
      city: 'Toronto',
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
    // 13 de junho
    {
      homeTeamId: teams.find((t) => t.code === 'QAT')?.id,
      awayTeamId: teams.find((t) => t.code === 'SUI')?.id,
      date: new Date('2026-06-13T16:00:00-03:00'),
      stadium: 'Levi Stadium',
      city: 'Santa Clara',
      stage: 'Fase de Grupos - Rodada 1',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'BRA')?.id,
      awayTeamId: teams.find((t) => t.code === 'MAR')?.id,
      date: new Date('2026-06-13T19:00:00-03:00'),
      stadium: 'MetLife Stadium',
      city: 'Nova York/Nova Jersey',
      stage: 'Fase de Grupos - Rodada 1',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'HAI')?.id,
      awayTeamId: teams.find((t) => t.code === 'SCO')?.id,
      date: new Date('2026-06-13T22:00:00-03:00'),
      stadium: 'Gillette Stadium',
      city: 'Boston',
      stage: 'Fase de Grupos - Rodada 1',
    },
    // 14 de junho
    {
      homeTeamId: teams.find((t) => t.code === 'AUS')?.id,
      awayTeamId: teams.find((t) => t.code === 'TUR')?.id,
      date: new Date('2026-06-14T01:00:00-03:00'),
      stadium: 'BC Place',
      city: 'Vancouver',
      stage: 'Fase de Grupos - Rodada 1',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'GER')?.id,
      awayTeamId: teams.find((t) => t.code === 'CUW')?.id,
      date: new Date('2026-06-14T14:00:00-03:00'),
      stadium: 'NRG Stadium',
      city: 'Houston',
      stage: 'Fase de Grupos - Rodada 1',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'NED')?.id,
      awayTeamId: teams.find((t) => t.code === 'JPN')?.id,
      date: new Date('2026-06-14T17:00:00-03:00'),
      stadium: 'AT&T Stadium',
      city: 'Dallas',
      stage: 'Fase de Grupos - Rodada 1',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'CIV')?.id,
      awayTeamId: teams.find((t) => t.code === 'ECU')?.id,
      date: new Date('2026-06-14T20:00:00-03:00'),
      stadium: 'Lincoln Financial Field',
      city: 'Filadélfia',
      stage: 'Fase de Grupos - Rodada 1',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'SWE')?.id,
      awayTeamId: teams.find((t) => t.code === 'TUN')?.id,
      date: new Date('2026-06-14T23:00:00-03:00'),
      stadium: 'Estádio BBVA',
      city: 'Monterrey',
      stage: 'Fase de Grupos - Rodada 1',
    },
    // 15 de junho
    {
      homeTeamId: teams.find((t) => t.code === 'ESP')?.id,
      awayTeamId: teams.find((t) => t.code === 'CPV')?.id,
      date: new Date('2026-06-15T13:00:00-03:00'),
      stadium: 'Mercedes-Benz Stadium',
      city: 'Atlanta',
      stage: 'Fase de Grupos - Rodada 1',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'BEL')?.id,
      awayTeamId: teams.find((t) => t.code === 'EGY')?.id,
      date: new Date('2026-06-15T16:00:00-03:00'),
      stadium: 'Lumen Field',
      city: 'Seattle',
      stage: 'Fase de Grupos - Rodada 1',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'KSA')?.id,
      awayTeamId: teams.find((t) => t.code === 'URU')?.id,
      date: new Date('2026-06-15T19:00:00-03:00'),
      stadium: 'Hard Rock Stadium',
      city: 'Miami',
      stage: 'Fase de Grupos - Rodada 1',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'IRN')?.id,
      awayTeamId: teams.find((t) => t.code === 'NZL')?.id,
      date: new Date('2026-06-15T22:00:00-03:00'),
      stadium: 'SoFi Stadium',
      city: 'Los Angeles',
      stage: 'Fase de Grupos - Rodada 1',
    },
    // 16 de junho
    {
      homeTeamId: teams.find((t) => t.code === 'FRA')?.id,
      awayTeamId: teams.find((t) => t.code === 'SEN')?.id,
      date: new Date('2026-06-16T16:00:00-03:00'),
      stadium: 'MetLife Stadium',
      city: 'Nova York/Nova Jersey',
      stage: 'Fase de Grupos - Rodada 1',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'IRQ')?.id,
      awayTeamId: teams.find((t) => t.code === 'NOR')?.id,
      date: new Date('2026-06-16T19:00:00-03:00'),
      stadium: 'Gillette Stadium',
      city: 'Boston',
      stage: 'Fase de Grupos - Rodada 1',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'ARG')?.id,
      awayTeamId: teams.find((t) => t.code === 'ALG')?.id,
      date: new Date('2026-06-16T22:00:00-03:00'),
      stadium: 'Arrowhead Stadium',
      city: 'Kansas City',
      stage: 'Fase de Grupos - Rodada 1',
    },
    // 17 de junho
    {
      homeTeamId: teams.find((t) => t.code === 'AUT')?.id,
      awayTeamId: teams.find((t) => t.code === 'JOR')?.id,
      date: new Date('2026-06-17T01:00:00-03:00'),
      stadium: 'Levi Stadium',
      city: 'Santa Clara',
      stage: 'Fase de Grupos - Rodada 1',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'POR')?.id,
      awayTeamId: teams.find((t) => t.code === 'COD')?.id,
      date: new Date('2026-06-17T14:00:00-03:00'),
      stadium: 'NRG Stadium',
      city: 'Houston',
      stage: 'Fase de Grupos - Rodada 1',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'ENG')?.id,
      awayTeamId: teams.find((t) => t.code === 'CRO')?.id,
      date: new Date('2026-06-17T17:00:00-03:00'),
      stadium: 'AT&T Stadium',
      city: 'Dallas',
      stage: 'Fase de Grupos - Rodada 1',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'GHA')?.id,
      awayTeamId: teams.find((t) => t.code === 'PAN')?.id,
      date: new Date('2026-06-17T20:00:00-03:00'),
      stadium: 'BMO Field',
      city: 'Toronto',
      stage: 'Fase de Grupos - Rodada 1',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'UZB')?.id,
      awayTeamId: teams.find((t) => t.code === 'COL')?.id,
      date: new Date('2026-06-17T21:00:00-03:00'),
      stadium: 'Estádio Azteca',
      city: 'Cidade do México',
      stage: 'Fase de Grupos - Rodada 1',
    },

    // 🔵 2ª Rodada (18 a 23 de junho)
    // 18 de junho
    {
      homeTeamId: teams.find((t) => t.code === 'CZE')?.id,
      awayTeamId: teams.find((t) => t.code === 'RSA')?.id,
      date: new Date('2026-06-18T13:00:00-03:00'),
      stadium: 'Mercedes-Benz Stadium',
      city: 'Atlanta',
      stage: 'Fase de Grupos - Rodada 2',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'SUI')?.id,
      awayTeamId: teams.find((t) => t.code === 'BIH')?.id,
      date: new Date('2026-06-18T16:00:00-03:00'),
      stadium: 'SoFi Stadium',
      city: 'Los Angeles',
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
      stadium: 'Estádio de Guadalajara',
      city: 'Guadalajara',
      stage: 'Fase de Grupos - Rodada 2',
    },
    // 19 de junho
    {
      homeTeamId: teams.find((t) => t.code === 'USA')?.id,
      awayTeamId: teams.find((t) => t.code === 'AUS')?.id,
      date: new Date('2026-06-19T16:00:00-03:00'),
      stadium: 'Lumen Field',
      city: 'Seattle',
      stage: 'Fase de Grupos - Rodada 2',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'SCO')?.id,
      awayTeamId: teams.find((t) => t.code === 'MAR')?.id,
      date: new Date('2026-06-19T19:00:00-03:00'),
      stadium: 'Gillette Stadium',
      city: 'Boston',
      stage: 'Fase de Grupos - Rodada 2',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'BRA')?.id,
      awayTeamId: teams.find((t) => t.code === 'HAI')?.id,
      date: new Date('2026-06-19T21:30:00-03:00'),
      stadium: 'Lincoln Financial Field',
      city: 'Filadélfia',
      stage: 'Fase de Grupos - Rodada 2',
    },
    // 20 de junho
    {
      homeTeamId: teams.find((t) => t.code === 'TUR')?.id,
      awayTeamId: teams.find((t) => t.code === 'PAR')?.id,
      date: new Date('2026-06-20T00:00:00-03:00'),
      stadium: 'Levi Stadium',
      city: 'Santa Clara',
      stage: 'Fase de Grupos - Rodada 2',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'NED')?.id,
      awayTeamId: teams.find((t) => t.code === 'SWE')?.id,
      date: new Date('2026-06-20T14:00:00-03:00'),
      stadium: 'NRG Stadium',
      city: 'Houston',
      stage: 'Fase de Grupos - Rodada 2',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'GER')?.id,
      awayTeamId: teams.find((t) => t.code === 'CIV')?.id,
      date: new Date('2026-06-20T17:00:00-03:00'),
      stadium: 'BMO Field',
      city: 'Toronto',
      stage: 'Fase de Grupos - Rodada 2',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'ECU')?.id,
      awayTeamId: teams.find((t) => t.code === 'CUW')?.id,
      date: new Date('2026-06-20T21:00:00-03:00'),
      stadium: 'Arrowhead Stadium',
      city: 'Kansas City',
      stage: 'Fase de Grupos - Rodada 2',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'TUN')?.id,
      awayTeamId: teams.find((t) => t.code === 'JPN')?.id,
      date: new Date('2026-06-20T23:00:00-03:00'),
      stadium: 'Estádio BBVA',
      city: 'Monterrey',
      stage: 'Fase de Grupos - Rodada 2',
    },
    // 21 de junho
    {
      homeTeamId: teams.find((t) => t.code === 'ESP')?.id,
      awayTeamId: teams.find((t) => t.code === 'KSA')?.id,
      date: new Date('2026-06-21T13:00:00-03:00'),
      stadium: 'Mercedes-Benz Stadium',
      city: 'Atlanta',
      stage: 'Fase de Grupos - Rodada 2',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'BEL')?.id,
      awayTeamId: teams.find((t) => t.code === 'IRN')?.id,
      date: new Date('2026-06-21T16:00:00-03:00'),
      stadium: 'SoFi Stadium',
      city: 'Los Angeles',
      stage: 'Fase de Grupos - Rodada 2',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'URU')?.id,
      awayTeamId: teams.find((t) => t.code === 'CPV')?.id,
      date: new Date('2026-06-21T19:00:00-03:00'),
      stadium: 'Hard Rock Stadium',
      city: 'Miami',
      stage: 'Fase de Grupos - Rodada 2',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'NZL')?.id,
      awayTeamId: teams.find((t) => t.code === 'EGY')?.id,
      date: new Date('2026-06-21T22:00:00-03:00'),
      stadium: 'BC Place',
      city: 'Vancouver',
      stage: 'Fase de Grupos - Rodada 2',
    },
    // 22 de junho
    {
      homeTeamId: teams.find((t) => t.code === 'ARG')?.id,
      awayTeamId: teams.find((t) => t.code === 'AUT')?.id,
      date: new Date('2026-06-22T14:00:00-03:00'),
      stadium: 'AT&T Stadium',
      city: 'Dallas',
      stage: 'Fase de Grupos - Rodada 2',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'FRA')?.id,
      awayTeamId: teams.find((t) => t.code === 'IRQ')?.id,
      date: new Date('2026-06-22T18:00:00-03:00'),
      stadium: 'Lincoln Financial Field',
      city: 'Filadélfia',
      stage: 'Fase de Grupos - Rodada 2',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'NOR')?.id,
      awayTeamId: teams.find((t) => t.code === 'SEN')?.id,
      date: new Date('2026-06-22T21:00:00-03:00'),
      stadium: 'MetLife Stadium',
      city: 'Nova York/Nova Jersey',
      stage: 'Fase de Grupos - Rodada 2',
    },
    // 23 de junho
    {
      homeTeamId: teams.find((t) => t.code === 'JOR')?.id,
      awayTeamId: teams.find((t) => t.code === 'ALG')?.id,
      date: new Date('2026-06-23T00:00:00-03:00'),
      stadium: 'Levi Stadium',
      city: 'Santa Clara',
      stage: 'Fase de Grupos - Rodada 2',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'POR')?.id,
      awayTeamId: teams.find((t) => t.code === 'UZB')?.id,
      date: new Date('2026-06-23T14:00:00-03:00'),
      stadium: 'NRG Stadium',
      city: 'Houston',
      stage: 'Fase de Grupos - Rodada 2',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'ENG')?.id,
      awayTeamId: teams.find((t) => t.code === 'GHA')?.id,
      date: new Date('2026-06-23T17:00:00-03:00'),
      stadium: 'Gillette Stadium',
      city: 'Boston',
      stage: 'Fase de Grupos - Rodada 2',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'PAN')?.id,
      awayTeamId: teams.find((t) => t.code === 'CRO')?.id,
      date: new Date('2026-06-23T20:00:00-03:00'),
      stadium: 'BMO Field',
      city: 'Toronto',
      stage: 'Fase de Grupos - Rodada 2',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'COL')?.id,
      awayTeamId: teams.find((t) => t.code === 'COD')?.id,
      date: new Date('2026-06-23T23:00:00-03:00'),
      stadium: 'Estádio de Guadalajara',
      city: 'Guadalajara',
      stage: 'Fase de Grupos - Rodada 2',
    },

    // 🔵 3ª Rodada (24 a 28 de junho)
    // 24 de junho
    {
      homeTeamId: teams.find((t) => t.code === 'SUI')?.id,
      awayTeamId: teams.find((t) => t.code === 'CAN')?.id,
      date: new Date('2026-06-24T16:00:00-03:00'),
      stadium: 'BC Place',
      city: 'Vancouver',
      stage: 'Fase de Grupos - Rodada 3',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'BIH')?.id,
      awayTeamId: teams.find((t) => t.code === 'QAT')?.id,
      date: new Date('2026-06-24T16:00:00-03:00'),
      stadium: 'Lumen Field',
      city: 'Seattle',
      stage: 'Fase de Grupos - Rodada 3',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'SCO')?.id,
      awayTeamId: teams.find((t) => t.code === 'BRA')?.id,
      date: new Date('2026-06-24T19:00:00-03:00'),
      stadium: 'Hard Rock Stadium',
      city: 'Miami',
      stage: 'Fase de Grupos - Rodada 3',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'MAR')?.id,
      awayTeamId: teams.find((t) => t.code === 'HAI')?.id,
      date: new Date('2026-06-24T19:00:00-03:00'),
      stadium: 'Mercedes-Benz Stadium',
      city: 'Atlanta',
      stage: 'Fase de Grupos - Rodada 3',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'CZE')?.id,
      awayTeamId: teams.find((t) => t.code === 'MEX')?.id,
      date: new Date('2026-06-24T22:00:00-03:00'),
      stadium: 'Estádio Azteca',
      city: 'Cidade do México',
      stage: 'Fase de Grupos - Rodada 3',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'RSA')?.id,
      awayTeamId: teams.find((t) => t.code === 'KOR')?.id,
      date: new Date('2026-06-24T22:00:00-03:00'),
      stadium: 'Estádio BBVA',
      city: 'Monterrey',
      stage: 'Fase de Grupos - Rodada 3',
    },
    // 25 de junho
    {
      homeTeamId: teams.find((t) => t.code === 'ECU')?.id,
      awayTeamId: teams.find((t) => t.code === 'GER')?.id,
      date: new Date('2026-06-25T17:00:00-03:00'),
      stadium: 'MetLife Stadium',
      city: 'Nova York/Nova Jersey',
      stage: 'Fase de Grupos - Rodada 3',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'CUW')?.id,
      awayTeamId: teams.find((t) => t.code === 'CIV')?.id,
      date: new Date('2026-06-25T17:00:00-03:00'),
      stadium: 'Lincoln Financial Field',
      city: 'Filadélfia',
      stage: 'Fase de Grupos - Rodada 3',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'JPN')?.id,
      awayTeamId: teams.find((t) => t.code === 'SWE')?.id,
      date: new Date('2026-06-25T20:00:00-03:00'),
      stadium: 'AT&T Stadium',
      city: 'Dallas',
      stage: 'Fase de Grupos - Rodada 3',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'TUN')?.id,
      awayTeamId: teams.find((t) => t.code === 'NED')?.id,
      date: new Date('2026-06-25T20:00:00-03:00'),
      stadium: 'Arrowhead Stadium',
      city: 'Kansas City',
      stage: 'Fase de Grupos - Rodada 3',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'TUR')?.id,
      awayTeamId: teams.find((t) => t.code === 'USA')?.id,
      date: new Date('2026-06-25T23:00:00-03:00'),
      stadium: 'SoFi Stadium',
      city: 'Los Angeles',
      stage: 'Fase de Grupos - Rodada 3',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'PAR')?.id,
      awayTeamId: teams.find((t) => t.code === 'AUS')?.id,
      date: new Date('2026-06-25T23:00:00-03:00'),
      stadium: 'Levi Stadium',
      city: 'Santa Clara',
      stage: 'Fase de Grupos - Rodada 3',
    },
    // 26 de junho
    {
      homeTeamId: teams.find((t) => t.code === 'NOR')?.id,
      awayTeamId: teams.find((t) => t.code === 'FRA')?.id,
      date: new Date('2026-06-26T16:00:00-03:00'),
      stadium: 'Gillette Stadium',
      city: 'Boston',
      stage: 'Fase de Grupos - Rodada 3',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'SEN')?.id,
      awayTeamId: teams.find((t) => t.code === 'IRQ')?.id,
      date: new Date('2026-06-26T16:00:00-03:00'),
      stadium: 'BMO Field',
      city: 'Toronto',
      stage: 'Fase de Grupos - Rodada 3',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'CPV')?.id,
      awayTeamId: teams.find((t) => t.code === 'KSA')?.id,
      date: new Date('2026-06-26T21:00:00-03:00'),
      stadium: 'NRG Stadium',
      city: 'Houston',
      stage: 'Fase de Grupos - Rodada 3',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'URU')?.id,
      awayTeamId: teams.find((t) => t.code === 'ESP')?.id,
      date: new Date('2026-06-26T21:00:00-03:00'),
      stadium: 'Estádio de Guadalajara',
      city: 'Guadalajara',
      stage: 'Fase de Grupos - Rodada 3',
    },
    // 27 de junho
    {
      homeTeamId: teams.find((t) => t.code === 'EGY')?.id,
      awayTeamId: teams.find((t) => t.code === 'IRN')?.id,
      date: new Date('2026-06-27T00:00:00-03:00'),
      stadium: 'Lumen Field',
      city: 'Seattle',
      stage: 'Fase de Grupos - Rodada 3',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'NZL')?.id,
      awayTeamId: teams.find((t) => t.code === 'BEL')?.id,
      date: new Date('2026-06-27T00:00:00-03:00'),
      stadium: 'BC Place',
      city: 'Vancouver',
      stage: 'Fase de Grupos - Rodada 3',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'PAN')?.id,
      awayTeamId: teams.find((t) => t.code === 'ENG')?.id,
      date: new Date('2026-06-27T18:00:00-03:00'),
      stadium: 'MetLife Stadium',
      city: 'Nova York/Nova Jersey',
      stage: 'Fase de Grupos - Rodada 3',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'CRO')?.id,
      awayTeamId: teams.find((t) => t.code === 'GHA')?.id,
      date: new Date('2026-06-27T18:00:00-03:00'),
      stadium: 'Lincoln Financial Field',
      city: 'Filadélfia',
      stage: 'Fase de Grupos - Rodada 3',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'COL')?.id,
      awayTeamId: teams.find((t) => t.code === 'POR')?.id,
      date: new Date('2026-06-27T20:30:00-03:00'),
      stadium: 'Hard Rock Stadium',
      city: 'Miami',
      stage: 'Fase de Grupos - Rodada 3',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'COD')?.id,
      awayTeamId: teams.find((t) => t.code === 'UZB')?.id,
      date: new Date('2026-06-27T20:30:00-03:00'),
      stadium: 'Mercedes-Benz Stadium',
      city: 'Atlanta',
      stage: 'Fase de Grupos - Rodada 3',
    },
    {
      homeTeamId: teams.find((t) => t.code === 'ALG')?.id,
      awayTeamId: teams.find((t) => t.code === 'AUT')?.id,
      date: new Date('2026-06-27T23:00:00-03:00'),
      stadium: 'Arrowhead Stadium',
      city: 'Kansas City',
      stage: 'Fase de Grupos - Rodada 3',
    },
    // 28 de junho
    {
      homeTeamId: teams.find((t) => t.code === 'JOR')?.id,
      awayTeamId: teams.find((t) => t.code === 'ARG')?.id,
      date: new Date('2026-06-28T23:00:00-03:00'),
      stadium: 'AT&T Stadium',
      city: 'Dallas',
      stage: 'Fase de Grupos - Rodada 3',
    },

    // 🔥 DEZESSEISAVOS DE FINAL (Fase de 32)
    // 28 de junho
    {
      homeTeamName: '2º Grupo A',
      awayTeamName: '2º Grupo B',
      date: new Date('2026-06-28T16:00:00-03:00'),
      stadium: 'SoFi Stadium',
      city: 'Los Angeles',
      stage: 'Dezesseisavos de Final',
    },
    // 29 de junho
    {
      homeTeamName: '1º Grupo E',
      awayTeamName: '3º Grupo A/B/C/D/F',
      date: new Date('2026-06-29T15:00:00-03:00'),
      stadium: 'Gillette Stadium',
      city: 'Boston',
      stage: 'Dezesseisavos de Final',
    },
    {
      homeTeamName: '1º Grupo F',
      awayTeamName: '2º Grupo C',
      date: new Date('2026-06-29T19:00:00-03:00'),
      stadium: 'Estádio BBVA',
      city: 'Monterrey',
      stage: 'Dezesseisavos de Final',
    },
    {
      homeTeamName: '1º Grupo C',
      awayTeamName: '2º Grupo F',
      date: new Date('2026-06-29T22:30:00-03:00'),
      stadium: 'NRG Stadium',
      city: 'Houston',
      stage: 'Dezesseisavos de Final',
    },
    // 30 de junho
    {
      homeTeamName: '1º Grupo I',
      awayTeamName: '3º Grupo C/D/F/G/H',
      date: new Date('2026-06-30T14:00:00-03:00'),
      stadium: 'MetLife Stadium',
      city: 'Nova York/Nova Jersey',
      stage: 'Dezesseisavos de Final',
    },
    {
      homeTeamName: '2º Grupo E',
      awayTeamName: '2º Grupo I',
      date: new Date('2026-06-30T18:00:00-03:00'),
      stadium: 'AT&T Stadium',
      city: 'Dallas',
      stage: 'Dezesseisavos de Final',
    },
    {
      homeTeamName: '1º Grupo A',
      awayTeamName: '3º Grupo C/E/F/H/I',
      date: new Date('2026-06-30T22:00:00-03:00'),
      stadium: 'Estádio Azteca',
      city: 'Cidade do México',
      stage: 'Dezesseisavos de Final',
    },
    // 1 de julho
    {
      homeTeamName: '1º Grupo L',
      awayTeamName: '3º Grupo E/H/I/J/K',
      date: new Date('2026-07-01T13:00:00-03:00'),
      stadium: 'Mercedes-Benz Stadium',
      city: 'Atlanta',
      stage: 'Dezesseisavos de Final',
    },
    {
      homeTeamName: '1º Grupo D',
      awayTeamName: '3º Grupo B/E/F/I/J',
      date: new Date('2026-07-01T17:00:00-03:00'),
      stadium: 'Levi Stadium',
      city: 'Santa Clara',
      stage: 'Dezesseisavos de Final',
    },
    {
      homeTeamName: '1º Grupo G',
      awayTeamName: '3º Grupo A/E/H/I/J',
      date: new Date('2026-07-01T21:00:00-03:00'),
      stadium: 'Lumen Field',
      city: 'Seattle',
      stage: 'Dezesseisavos de Final',
    },
    // 2 de julho
    {
      homeTeamName: '2º Grupo K',
      awayTeamName: '2º Grupo L',
      date: new Date('2026-07-02T16:00:00-03:00'),
      stadium: 'BMO Field',
      city: 'Toronto',
      stage: 'Dezesseisavos de Final',
    },
    {
      homeTeamName: '1º Grupo H',
      awayTeamName: '2º Grupo J',
      date: new Date('2026-07-02T20:00:00-03:00'),
      stadium: 'SoFi Stadium',
      city: 'Los Angeles',
      stage: 'Dezesseisavos de Final',
    },
    {
      homeTeamName: '1º Grupo B',
      awayTeamName: '3º Grupo E/F/G/I/J',
      date: new Date('2026-07-02T23:59:00-03:00'),
      stadium: 'BC Place',
      city: 'Vancouver',
      stage: 'Dezesseisavos de Final',
    },
    // 3 de julho
    {
      homeTeamName: '1º Grupo J',
      awayTeamName: '2º Grupo H',
      date: new Date('2026-07-03T15:00:00-03:00'),
      stadium: 'Hard Rock Stadium',
      city: 'Miami',
      stage: 'Dezesseisavos de Final',
    },
    {
      homeTeamName: '1º Grupo K',
      awayTeamName: '3º Grupo D/E/I/J/L',
      date: new Date('2026-07-03T19:00:00-03:00'),
      stadium: 'Arrowhead Stadium',
      city: 'Kansas City',
      stage: 'Dezesseisavos de Final',
    },
    {
      homeTeamName: '2º Grupo D',
      awayTeamName: '2º Grupo G',
      date: new Date('2026-07-03T22:30:00-03:00'),
      stadium: 'AT&T Stadium',
      city: 'Dallas',
      stage: 'Dezesseisavos de Final',
    },

    // 🗓️ OITAVAS DE FINAL
    // 4 de julho
    {
      homeTeamName: 'Vencedor do jogo 74',
      awayTeamName: 'Vencedor do jogo 77',
      date: new Date('2026-07-04T14:00:00-03:00'),
      stadium: 'Lincoln Financial Field',
      city: 'Filadélfia',
      stage: 'Oitavas de Final',
    },
    {
      homeTeamName: 'Vencedor do jogo 73',
      awayTeamName: 'Vencedor do jogo 75',
      date: new Date('2026-07-04T18:00:00-03:00'),
      stadium: 'NRG Stadium',
      city: 'Houston',
      stage: 'Oitavas de Final',
    },
    // 5 de julho
    {
      homeTeamName: 'Vencedor do jogo 76',
      awayTeamName: 'Vencedor do jogo 78',
      date: new Date('2026-07-05T17:00:00-03:00'),
      stadium: 'MetLife Stadium',
      city: 'Nova York/Nova Jersey',
      stage: 'Oitavas de Final',
    },
    {
      homeTeamName: 'Vencedor do jogo 79',
      awayTeamName: 'Vencedor do jogo 80',
      date: new Date('2026-07-05T21:00:00-03:00'),
      stadium: 'Estádio Azteca',
      city: 'Cidade do México',
      stage: 'Oitavas de Final',
    },
    // 6 de julho
    {
      homeTeamName: 'Vencedor do jogo 83',
      awayTeamName: 'Vencedor do jogo 84',
      date: new Date('2026-07-06T16:00:00-03:00'),
      stadium: 'AT&T Stadium',
      city: 'Dallas',
      stage: 'Oitavas de Final',
    },
    {
      homeTeamName: 'Vencedor do jogo 81',
      awayTeamName: 'Vencedor do jogo 82',
      date: new Date('2026-07-06T21:00:00-03:00'),
      stadium: 'Lumen Field',
      city: 'Seattle',
      stage: 'Oitavas de Final',
    },
    // 7 de julho
    {
      homeTeamName: 'Vencedor do jogo 86',
      awayTeamName: 'Vencedor do jogo 88',
      date: new Date('2026-07-07T13:00:00-03:00'),
      stadium: 'Mercedes-Benz Stadium',
      city: 'Atlanta',
      stage: 'Oitavas de Final',
    },
    {
      homeTeamName: 'Vencedor do jogo 85',
      awayTeamName: 'Vencedor do jogo 87',
      date: new Date('2026-07-07T17:00:00-03:00'),
      stadium: 'BC Place',
      city: 'Vancouver',
      stage: 'Oitavas de Final',
    },

    // 🗓️ QUARTAS DE FINAL
    // 9 de julho
    {
      homeTeamName: 'Vencedor do jogo 89',
      awayTeamName: 'Vencedor do jogo 90',
      date: new Date('2026-07-09T17:00:00-03:00'),
      stadium: 'Gillette Stadium',
      city: 'Boston',
      stage: 'Quartas de Final',
    },
    // 10 de julho
    {
      homeTeamName: 'Vencedor do jogo 93',
      awayTeamName: 'Vencedor do jogo 94',
      date: new Date('2026-07-10T16:00:00-03:00'),
      stadium: 'SoFi Stadium',
      city: 'Los Angeles',
      stage: 'Quartas de Final',
    },
    // 11 de julho
    {
      homeTeamName: 'Vencedor do jogo 91',
      awayTeamName: 'Vencedor do jogo 92',
      date: new Date('2026-07-11T18:00:00-03:00'),
      stadium: 'Hard Rock Stadium',
      city: 'Miami',
      stage: 'Quartas de Final',
    },
    {
      homeTeamName: 'Vencedor do jogo 95',
      awayTeamName: 'Vencedor do jogo 96',
      date: new Date('2026-07-11T22:00:00-03:00'),
      stadium: 'Arrowhead Stadium',
      city: 'Kansas City',
      stage: 'Quartas de Final',
    },

    // 🗓️ SEMIFINAIS
    // 14 de julho
    {
      homeTeamName: 'Vencedor do jogo 97',
      awayTeamName: 'Vencedor do jogo 98',
      date: new Date('2026-07-14T16:00:00-03:00'),
      stadium: 'AT&T Stadium',
      city: 'Dallas',
      stage: 'Semifinais',
    },
    // 15 de julho
    {
      homeTeamName: 'Vencedor do jogo 99',
      awayTeamName: 'Vencedor do jogo 100',
      date: new Date('2026-07-15T16:00:00-03:00'),
      stadium: 'Mercedes-Benz Stadium',
      city: 'Atlanta',
      stage: 'Semifinais',
    },

    // 🗓️ TERCEIRO LUGAR
    // 18 de julho
    {
      homeTeamName: 'Perdedor do jogo 101',
      awayTeamName: 'Perdedor do jogo 102',
      date: new Date('2026-07-18T18:00:00-03:00'),
      stadium: 'Hard Rock Stadium',
      city: 'Miami',
      stage: 'Terceiro Lugar',
    },

    // 👑 FINAL
    // 19 de julho
    {
      homeTeamName: 'Vencedor do jogo 101',
      awayTeamName: 'Vencedor do jogo 102',
      date: new Date('2026-07-19T16:00:00-03:00'),
      stadium: 'MetLife Stadium',
      city: 'Nova York/Nova Jersey',
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

  // ─── PLAYERS SEEDING ────────────────────────────────────────────────────────
  await seedPlayers();

  console.log('Seeding finished.');
}

async function seedPlayers() {
  console.log('Upserting players (idempotent)...');

  const allTeams = await prisma.team.findMany();
  const teamMap = new Map(allTeams.map((t) => [t.code, t.id]));

  const playersData = [
    // --- BRASIL (BRA) ---
    { id: 'b6a03b56-d89d-4b4e-96bc-62e58db39f03', name: 'Alisson', position: 'Goleiro', teamCode: 'BRA' },
    { id: '9922bf7a-c300-4190-a7b1-598d0aac1185', name: 'Ederson', position: 'Goleiro', teamCode: 'BRA' },
    { id: 'ae776098-e162-47b4-a7bc-74c6289f4eb6', name: 'Weverton', position: 'Goleiro', teamCode: 'BRA' },
    { id: '54d832e1-976b-49fc-a293-fda13a445d4f', name: 'Marquinhos', position: 'Defensor', teamCode: 'BRA' },
    { id: 'd2f65b0e-9d0c-449c-af0d-4d86347d609a', name: 'Gabriel Magalhães', position: 'Defensor', teamCode: 'BRA' },
    { id: '56bd8093-0a21-487a-9b95-8ce3d00cb5af', name: 'Bremer', position: 'Defensor', teamCode: 'BRA' },
    { id: '97ea176d-4de3-4c58-a3ae-cf188f6d1ae8', name: 'Roger Ibañez', position: 'Defensor', teamCode: 'BRA' },
    { id: 'e0f636ce-1d26-4059-b842-86f779d7e7f9', name: 'Léo Pereira', position: 'Defensor', teamCode: 'BRA' },
    { id: '97dd87ad-3b65-4d17-95a1-b80f347e7501', name: 'Danilo', position: 'Defensor', teamCode: 'BRA' },
    { id: 'c1b26273-6e4a-44b1-96cd-05b8739237e6', name: 'Alex Sandro', position: 'Defensor', teamCode: 'BRA' },
    { id: '90b717a1-4374-4644-9bd3-1572b50bee6e', name: 'Wesley', position: 'Defensor', teamCode: 'BRA' },
    { id: '45d285d0-4386-443e-bcdf-a034d477491e', name: 'Douglas Santos', position: 'Defensor', teamCode: 'BRA' },
    { id: 'c3d7585d-27b1-493d-9f4a-8fe316b8039a', name: 'Bruno Guimarães', position: 'Meio-campista', teamCode: 'BRA' },
    { id: '24935f3b-8806-4f87-a112-56e82697ce02', name: 'Casemiro', position: 'Meio-campista', teamCode: 'BRA' },
    { id: 'a004083c-af41-46cb-a0ba-3750c457f74c', name: 'Danilo Santos', position: 'Meio-campista', teamCode: 'BRA' },
    { id: '6416f8cf-2b08-4c5b-a07f-e0cd2a7a2c30', name: 'Fabinho', position: 'Meio-campista', teamCode: 'BRA' },
    { id: '83a7721f-6dcb-47e2-a347-1c9dae23dfb5', name: 'Lucas Paquetá', position: 'Meio-campista', teamCode: 'BRA' },
    { id: '8d048a73-0d87-49c1-a359-70dafa8c898a', name: 'Vinicius Júnior', position: 'Atacante', teamCode: 'BRA' },
    { id: '42dfa998-4a20-445f-9f1e-799c0e581db9', name: 'Raphinha', position: 'Atacante', teamCode: 'BRA' },
    { id: 'ddb6e553-3fcc-463b-892e-1732ecde4ea9', name: 'Matheus Cunha', position: 'Atacante', teamCode: 'BRA' },
    { id: 'f69e1be0-388f-4a51-81b3-5aec6adb3c26', name: 'Luiz Henrique', position: 'Atacante', teamCode: 'BRA' },
    { id: 'eb7ec1c3-aa13-4535-8509-c508d2a65569', name: 'Igor Thiago', position: 'Atacante', teamCode: 'BRA' },
    { id: 'fb43fa48-0bd5-4484-89f7-5d4cfb09279b', name: 'Endrick', position: 'Atacante', teamCode: 'BRA' },
    { id: 'a4eed213-2e83-4bc0-b768-942b648a4f91', name: 'Gabriel Martinelli', position: 'Atacante', teamCode: 'BRA' },
    { id: 'bf87c785-fa1b-46f6-8313-417a8715984e', name: 'Rayan', position: 'Atacante', teamCode: 'BRA' },
    { id: '74899a73-e513-45f5-a16c-ebd8a4ca64e1', name: 'Neymar Júnior', position: 'Atacante', teamCode: 'BRA' },

    // --- MÉXICO (MEX) ---
    { id: 'bc0ad208-e6ea-4722-b0c4-ff7fad9353db', name: 'Guillermo Ochoa', position: 'Goleiro', teamCode: 'MEX' },
    { id: '5207e269-bcf3-48a7-b4db-1447f70c7a3a', name: 'Raúl Rangel', position: 'Goleiro', teamCode: 'MEX' },
    { id: 'f62d1a3d-d4a3-4bb2-b14f-7849eece8f48', name: 'Carlos Acevedo', position: 'Goleiro', teamCode: 'MEX' },
    { id: '9d621f23-656a-4610-baf5-236bafcced08', name: 'José Antonio Rodríguez', position: 'Goleiro', teamCode: 'MEX' },
    { id: '38cdf426-f9ac-4881-b364-451bd41f1c0b', name: 'Jesús Gallardo', position: 'Defensor', teamCode: 'MEX' },
    { id: '85c45508-29a4-423d-9e58-28cd685b7223', name: 'César Montes', position: 'Defensor', teamCode: 'MEX' },
    { id: '86b9a9c4-5a2d-4edd-8d28-e9b734d5e42b', name: 'Jorge Sánchez', position: 'Defensor', teamCode: 'MEX' },
    { id: '6bed4581-4ea2-4902-b4b9-43b31127b19a', name: 'Johan Vásquez', position: 'Defensor', teamCode: 'MEX' },
    { id: '8eaa2d9a-c67d-406f-887d-84bb351f6feb', name: 'Israel Reyes', position: 'Defensor', teamCode: 'MEX' },
    { id: '5d946564-4fcf-4ad5-91a5-1474b2d664e1', name: 'Julián Araujo', position: 'Defensor', teamCode: 'MEX' },
    { id: '677ad52b-a02c-4139-965b-c251b9758bd6', name: 'Edson Álvarez', position: 'Meio-campista', teamCode: 'MEX' },
    { id: 'a00d9355-1fa0-43c5-9a2f-e8e251667128', name: 'Orbelín Pineda', position: 'Meio-campista', teamCode: 'MEX' },
    { id: 'fa44c6f4-82c7-43dc-99ce-3b60634bd255', name: 'Carlos Rodríguez', position: 'Meio-campista', teamCode: 'MEX' },
    { id: '8ce1a497-72a7-4dd0-8e8d-70e6f8d3b47c', name: 'Roberto Alvarado', position: 'Meio-campista', teamCode: 'MEX' },
    { id: '24b78966-0189-4782-afe0-038cbee6c196', name: 'Luis Romo', position: 'Meio-campista', teamCode: 'MEX' },
    { id: '6ecc012d-f0c4-4cf8-a8fa-1624e138c639', name: 'Luis Chávez', position: 'Meio-campista', teamCode: 'MEX' },
    { id: 'aa4197b2-0f2b-4f70-8738-a5c9a10fa8b4', name: 'Érick Sánchez', position: 'Meio-campista', teamCode: 'MEX' },
    { id: 'b1803937-9415-428d-9d9b-033686b6a4a9', name: 'Diego Lainez', position: 'Meio-campista', teamCode: 'MEX' },
    { id: '1099eabd-05e7-4c66-9865-b795d3d0b42a', name: 'Gilberto Mora', position: 'Meio-campista', teamCode: 'MEX' },

    // --- BÓSNIA E HERZEGOVINA (BIH) ---
    { id: '3d3f2ea7-06ce-47fc-9c96-3f1c0f1fa133', name: 'Edin Džeko', position: 'Atacante', teamCode: 'BIH' },
    { id: '64227c42-043c-46e0-a27c-e2b783cad54b', name: 'Sead Kolašinac', position: 'Defensor', teamCode: 'BIH' },
    { id: '67395606-688b-4d5b-9da3-77f3da59e7cc', name: 'Amir Hadžiahmetović', position: 'Meio-campista', teamCode: 'BIH' },
    { id: '558bad5e-e0a7-49b5-8fb5-397494b03dda', name: 'Ivan Šunjić', position: 'Meio-campista', teamCode: 'BIH' },
    { id: '87927b60-37fb-44cb-a825-19c6c72812b7', name: 'Benjamin Tahirović', position: 'Meio-campista', teamCode: 'BIH' },
    { id: 'daf722b0-c793-4cd8-8021-ed76f7a3fc38', name: 'Ermedin Demirović', position: 'Atacante', teamCode: 'BIH' },
    { id: '572f05ca-face-4a50-a8ee-342c203d6769', name: 'Haris Tabaković', position: 'Atacante', teamCode: 'BIH' },

    // --- ARGENTINA (ARG) ---
    { id: '0ab135b6-0e83-46ab-85e7-cfe660c8018d', name: 'Lionel Messi', position: 'Atacante', teamCode: 'ARG' },
    { id: '23d53b07-7cd3-4fee-be80-2a4eb16a886c', name: 'Emiliano Martínez', position: 'Goleiro', teamCode: 'ARG' },
    { id: '877852e1-21fb-4c1e-b999-0f60ac85d13a', name: 'Cristian Romero', position: 'Defensor', teamCode: 'ARG' },
    { id: '28825681-0030-4f36-a471-499d6e2e0ad4', name: 'Rodrigo De Paul', position: 'Meio-campista', teamCode: 'ARG' },
    { id: '36a088f2-5315-44db-812a-4b286d9789ef', name: 'Alexis Mac Allister', position: 'Meio-campista', teamCode: 'ARG' },
    { id: '2464cbda-e69e-4653-aa0c-bdbb1bf05448', name: 'Lautaro Martínez', position: 'Atacante', teamCode: 'ARG' },
    { id: '5f2f01e9-3456-49f0-c34e-0789b901ef34', name: 'Julián Álvarez', position: 'Atacante', teamCode: 'ARG' },
    { id: '6f3f12f0-4567-4af1-d45f-1890c012f456', name: 'Enzo Fernández', position: 'Meio-campista', teamCode: 'ARG' },
    { id: '7f4f23a1-5678-4bf2-e56a-2901d123f567', name: 'Ángel Di María', position: 'Atacante', teamCode: 'ARG' },

    // --- PORTUGAL (POR) ---
    { id: '81cad6a6-5874-45c9-94c3-f71f17bf6124', name: 'Cristiano Ronaldo', position: 'Atacante', teamCode: 'POR' },
    { id: '1aaed7cc-83b2-4e47-9171-4b2af5882d02', name: 'Diogo Costa', position: 'Goleiro', teamCode: 'POR' },
    { id: 'f0ecca31-ca04-4473-ba8e-5797262d5e94', name: 'Rúben Dias', position: 'Defensor', teamCode: 'POR' },
    { id: 'fd3affd2-ce45-4af2-b147-4c2298639c21', name: 'Bruno Fernandes', position: 'Meio-campista', teamCode: 'POR' },
    { id: '71f6c5ab-5073-416a-a903-bb0d9e5817a6', name: 'Bernardo Silva', position: 'Meio-campista', teamCode: 'POR' },
    { id: '5e72c8af-e748-4210-a562-79b96cc49716', name: 'Rafael Leão', position: 'Atacante', teamCode: 'POR' },
    { id: '0ea7567e-8901-48af-5897-f0def456f290', name: 'João Félix', position: 'Atacante', teamCode: 'POR' },

    // --- OUTROS JOGADORES DE OUTROS PAÍSES ---
    // França (FRA)
    { id: '8a8d11c1-4c12-40ee-a764-11e2f9d854eb', name: 'Kylian Mbappé', position: 'Atacante', teamCode: 'FRA' },
    { id: '8c983a54-6e6b-4e1b-90f9-2917e754a123', name: 'Antoine Griezmann', position: 'Atacante', teamCode: 'FRA' },
    { id: '1b8976a5-f123-45be-890a-cd34ef56abef', name: 'Ousmane Dembélé', position: 'Atacante', teamCode: 'FRA' },
    { id: '2c9e78b6-0123-46cf-901b-de45ef67bc01', name: 'Olivier Giroud', position: 'Atacante', teamCode: 'FRA' },
    { id: '3d0f89c7-1234-47df-a12c-ef56f789cd12', name: 'Aurélien Tchouaméni', position: 'Meio-campista', teamCode: 'FRA' },
    { id: '4e1f90d8-2345-48ef-b23d-f678a890de23', name: 'Eduardo Camavinga', position: 'Meio-campista', teamCode: 'FRA' },

    // Inglaterra (ENG)
    { id: '8f5f34b2-6789-4cf3-f67b-3012e234f678', name: 'Jude Bellingham', position: 'Meio-campista', teamCode: 'ENG' },
    { id: '9f6f45c3-7890-4df4-a78c-4023f345f789', name: 'Harry Kane', position: 'Atacante', teamCode: 'ENG' },
    { id: '0a7f56d4-8901-4ef5-b89d-5034f456f890', name: 'Phil Foden', position: 'Atacante', teamCode: 'ENG' },
    { id: '1b8f67e5-9012-4ff6-c90e-6045f567f901', name: 'Bukayo Saka', position: 'Atacante', teamCode: 'ENG' },
    { id: '2c9f78f6-0123-40a7-d01f-7056f678fa12', name: 'Cole Palmer', position: 'Atacante', teamCode: 'ENG' },
    { id: '3da08907-1234-41b8-e120-8067f789ab23', name: 'Declan Rice', position: 'Meio-campista', teamCode: 'ENG' },

    // Alemanha (GER)
    { id: '4eb19018-2345-42c9-f231-9078a890bc34', name: 'Florian Wirtz', position: 'Meio-campista', teamCode: 'GER' },
    { id: '5fc20129-3456-43da-0342-a089b901cd45', name: 'Jamal Musiala', position: 'Meio-campista', teamCode: 'GER' },
    { id: '6ad3123a-4567-44eb-1453-b09ac012de56', name: 'Kai Havertz', position: 'Atacante', teamCode: 'GER' },
    { id: '7be4234b-5678-45fc-2564-c0abd123ef67', name: 'Thomas Müller', position: 'Atacante', teamCode: 'GER' },
    { id: '8cf5345c-6789-46fd-3675-d0bce234f078', name: 'Leroy Sané', position: 'Atacante', teamCode: 'GER' },
    { id: '9dg6456d-7890-47fe-4786-e0cdf345f189', name: 'Niclas Füllkrug', position: 'Atacante', teamCode: 'GER' },

    // Espanha (ESP)
    { id: '1fb8678f-9012-49bf-69a8-0123f567g301', name: 'Lamine Yamal', position: 'Atacante', teamCode: 'ESP' },
    { id: '2gc97890-0123-4acf-7ab9-1234f678h412', name: 'Nico Williams', position: 'Atacante', teamCode: 'ESP' },
    { id: '3hd08901-1234-4bdf-8bc0-2345f789i523', name: 'Álvaro Morata', position: 'Atacante', teamCode: 'ESP' },
    { id: '4ie19012-2345-4cdf-9cd1-3456f890j634', name: 'Rodri', position: 'Meio-campista', teamCode: 'ESP' },
    { id: '5jf20123-3456-4ddf-0de2-4567f901k745', name: 'Pedri', position: 'Meio-campista', teamCode: 'ESP' },
    { id: '6kg31234-4567-4edf-1ef3-5678fa12l856', name: 'Dani Olmo', position: 'Meio-campista', teamCode: 'ESP' },

    // Uruguai (URU)
    { id: '7lh42345-5678-4fdf-2fg4-6789fb23m967', name: 'Darwin Núñez', position: 'Atacante', teamCode: 'URU' },
    { id: '8mi53456-6789-40df-3gh5-7890fc34n078', name: 'Federico Valverde', position: 'Meio-campista', teamCode: 'URU' },
    { id: '9nj64567-7890-41df-4ij6-8901fd45o189', name: 'Luis Suárez', position: 'Atacante', teamCode: 'URU' },

    // Colômbia (COL)
    { id: '0ok75678-8901-42df-5jk7-9012fe56p290', name: 'Luis Díaz', position: 'Atacante', teamCode: 'COL' },
    { id: '1pl86789-9012-43df-6kl8-0123ff67q301', name: 'James Rodríguez', position: 'Meio-campista', teamCode: 'COL' },

    // Bélgica (BEL)
    { id: '2qm97890-0123-44df-7lm9-1234aa78r412', name: 'Kevin De Bruyne', position: 'Meio-campista', teamCode: 'BEL' },
    { id: '3rn08901-1234-45df-8mn0-2345bb89s523', name: 'Romelu Lukaku', position: 'Atacante', teamCode: 'BEL' },
    { id: '4so19012-2345-46df-9no1-3456cc90t634', name: 'Jeremy Doku', position: 'Atacante', teamCode: 'BEL' },

    // Holanda (NED)
    { id: '5tp20123-3456-47df-0op2-4567dd01u745', name: 'Cody Gakpo', position: 'Atacante', teamCode: 'NED' },
    { id: '6uq31234-4567-48df-1pq3-5678ee12v856', name: 'Memphis Depay', position: 'Atacante', teamCode: 'NED' },
    { id: '7vr42345-5678-49df-2qr4-6789ff23w967', name: 'Frenkie de Jong', position: 'Meio-campista', teamCode: 'NED' },

    // Egito (EGY)
    { id: '8ws53456-6789-4adf-3rs5-7890aa34x078', name: 'Mohamed Salah', position: 'Atacante', teamCode: 'EGY' },

    // Noruega (NOR)
    { id: '9xt64567-7890-4bdf-4st6-8901bb45y189', name: 'Erling Haaland', position: 'Atacante', teamCode: 'NOR' }
  ];

  for (const p of playersData) {
    const teamId = teamMap.get(p.teamCode);
    if (teamId) {
      await prisma.player.upsert({
        where: { id: p.id },
        update: {
          name: p.name,
          position: p.position,
          teamId,
        },
        create: {
          id: p.id,
          name: p.name,
          position: p.position,
          teamId,
        },
      });
    }
  }
  console.log('Players seeded/updated successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
