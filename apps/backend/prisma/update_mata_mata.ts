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
  const teamsData = await prisma.team.findMany();
  const getTeamId = (code: string) => teamsData.find(t => t.code === code)?.id;

  const matches = [
    {
      homeTeamId: getTeamId('RSA'), awayTeamId: getTeamId('CAN'),
      date: new Date('2026-06-28T16:00:00-03:00'), stadium: 'Los Angeles Stadium', city: 'Los Angeles', stage: 'Dezesseisavos de Final'
    },
    {
      homeTeamId: getTeamId('BRA'), awayTeamId: getTeamId('JPN'),
      date: new Date('2026-06-29T14:00:00-03:00'), stadium: 'Houston Stadium', city: 'Houston', stage: 'Dezesseisavos de Final'
    },
    {
      homeTeamId: getTeamId('GER'), awayTeamId: getTeamId('PAR'),
      date: new Date('2026-06-29T17:30:00-03:00'), stadium: 'Boston Stadium', city: 'Boston', stage: 'Dezesseisavos de Final'
    },
    {
      homeTeamId: getTeamId('NED'), awayTeamId: getTeamId('MAR'),
      date: new Date('2026-06-29T22:00:00-03:00'), stadium: 'Estadio Monterrey', city: 'Monterrey', stage: 'Dezesseisavos de Final'
    },
    {
      homeTeamId: getTeamId('CIV'), awayTeamId: getTeamId('NOR'),
      date: new Date('2026-06-30T14:00:00-03:00'), stadium: 'Dallas Stadium', city: 'Arlington', stage: 'Dezesseisavos de Final'
    },
    {
      homeTeamId: getTeamId('FRA'), awayTeamId: getTeamId('SWE'),
      date: new Date('2026-06-30T18:00:00-03:00'), stadium: 'New York New Jersey Stadium', city: 'East Rutherford', stage: 'Dezesseisavos de Final'
    },
    {
      homeTeamId: getTeamId('MEX'), awayTeamId: getTeamId('ECU'),
      date: new Date('2026-06-30T22:00:00-03:00'), stadium: 'Mexico City Stadium', city: 'Cidade do México', stage: 'Dezesseisavos de Final'
    },
    {
      homeTeamId: getTeamId('ENG'), awayTeamId: getTeamId('COD'),
      date: new Date('2026-07-01T13:00:00-03:00'), stadium: 'Atlanta Stadium', city: 'Atlanta', stage: 'Dezesseisavos de Final'
    },
    {
      homeTeamId: getTeamId('BEL'), awayTeamId: getTeamId('SEN'),
      date: new Date('2026-07-01T17:00:00-03:00'), stadium: 'Seattle Stadium', city: 'Seattle', stage: 'Dezesseisavos de Final'
    },
    {
      homeTeamId: getTeamId('USA'), awayTeamId: getTeamId('BIH'),
      date: new Date('2026-07-01T21:00:00-03:00'), stadium: 'Kansas City Stadium', city: 'Kansas City', stage: 'Dezesseisavos de Final'
    },
    {
      homeTeamId: getTeamId('ESP'), awayTeamName: '2º colocado do Grupo J',
      date: new Date('2026-07-02T16:00:00-03:00'), stadium: 'Los Angeles Stadium', city: 'Los Angeles', stage: 'Dezesseisavos de Final'
    },
    {
      homeTeamId: getTeamId('POR'), awayTeamId: getTeamId('CRO'),
      date: new Date('2026-07-02T20:00:00-03:00'), stadium: 'Miami Stadium', city: 'Miami', stage: 'Dezesseisavos de Final'
    },
    {
      homeTeamId: getTeamId('SUI'), awayTeamName: 'Melhor 3º colocado (Grupos E/F/G/I/J)',
      date: new Date('2026-07-03T00:00:00-03:00'), stadium: 'San Francisco Bay Area Stadium', city: 'Santa Clara', stage: 'Dezesseisavos de Final'
    },
    {
      homeTeamId: getTeamId('AUS'), awayTeamId: getTeamId('EGY'),
      date: new Date('2026-07-03T15:00:00-03:00'), stadium: 'Philadelphia Stadium', city: 'Filadélfia', stage: 'Dezesseisavos de Final'
    },
    {
      homeTeamId: getTeamId('ARG'), awayTeamId: getTeamId('CPV'),
      date: new Date('2026-07-03T19:00:00-03:00'), stadium: 'Miami Stadium', city: 'Miami', stage: 'Dezesseisavos de Final'
    },
    {
      homeTeamId: getTeamId('COL'), awayTeamId: getTeamId('GHA'),
      date: new Date('2026-07-03T22:30:00-03:00'), stadium: 'Vancouver Stadium', city: 'Vancouver', stage: 'Dezesseisavos de Final'
    }
  ];

  console.log('Deleting existing Dezesseisavos de Final matches...');
  await prisma.match.deleteMany({
    where: { stage: 'Dezesseisavos de Final' }
  });

  console.log('Inserting new Dezesseisavos de Final matches...');
  for (const match of matches) {
    await prisma.match.create({
      data: match
    });
  }
  
  console.log('Successfully updated matches!');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
