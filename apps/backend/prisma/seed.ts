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
