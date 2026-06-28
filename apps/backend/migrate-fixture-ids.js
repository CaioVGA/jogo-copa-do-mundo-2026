const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const teams = await prisma.team.findMany();
  
  // Reproducing matchesData from seed.ts but just the fields we need to identify them
  const matchesData = [
    { date: new Date('2026-06-11T16:00:00-03:00'), stadium: 'Estádio Azteca', city: 'Cidade do México' },
    { date: new Date('2026-06-11T23:00:00-03:00'), stadium: 'Estádio de Guadalajara', city: 'Guadalajara' },
    { date: new Date('2026-06-12T16:00:00-03:00'), stadium: 'BMO Field', city: 'Toronto' },
    { date: new Date('2026-06-12T22:00:00-03:00'), stadium: 'SoFi Stadium', city: 'Los Angeles' },
    { date: new Date('2026-06-13T16:00:00-03:00'), stadium: 'Levi Stadium', city: 'Santa Clara' },
    { date: new Date('2026-06-13T19:00:00-03:00'), stadium: 'MetLife Stadium', city: 'Nova York/Nova Jersey' },
    { date: new Date('2026-06-13T22:00:00-03:00'), stadium: 'Gillette Stadium', city: 'Boston' },
    { date: new Date('2026-06-14T01:00:00-03:00'), stadium: 'BC Place', city: 'Vancouver' },
    { date: new Date('2026-06-14T14:00:00-03:00'), stadium: 'NRG Stadium', city: 'Houston' },
    { date: new Date('2026-06-14T17:00:00-03:00'), stadium: 'AT&T Stadium', city: 'Dallas' },
    { date: new Date('2026-06-14T20:00:00-03:00'), stadium: 'Lincoln Financial Field', city: 'Filadélfia' },
    { date: new Date('2026-06-14T23:00:00-03:00'), stadium: 'Estádio BBVA', city: 'Monterrey' },
    { date: new Date('2026-06-15T13:00:00-03:00'), stadium: 'Mercedes-Benz Stadium', city: 'Atlanta' },
    { date: new Date('2026-06-15T16:00:00-03:00'), stadium: 'Lumen Field', city: 'Seattle' },
    { date: new Date('2026-06-15T19:00:00-03:00'), stadium: 'Hard Rock Stadium', city: 'Miami' },
    { date: new Date('2026-06-15T22:00:00-03:00'), stadium: 'SoFi Stadium', city: 'Los Angeles' },
    { date: new Date('2026-06-16T16:00:00-03:00'), stadium: 'MetLife Stadium', city: 'Nova York/Nova Jersey' },
    { date: new Date('2026-06-16T19:00:00-03:00'), stadium: 'Gillette Stadium', city: 'Boston' },
    { date: new Date('2026-06-16T22:00:00-03:00'), stadium: 'Arrowhead Stadium', city: 'Kansas City' },
    { date: new Date('2026-06-17T01:00:00-03:00'), stadium: 'Levi Stadium', city: 'Santa Clara' },
    { date: new Date('2026-06-17T14:00:00-03:00'), stadium: 'NRG Stadium', city: 'Houston' },
    { date: new Date('2026-06-17T17:00:00-03:00'), stadium: 'AT&T Stadium', city: 'Dallas' },
    { date: new Date('2026-06-17T20:00:00-03:00'), stadium: 'BMO Field', city: 'Toronto' },
    { date: new Date('2026-06-17T21:00:00-03:00'), stadium: 'Estádio Azteca', city: 'Cidade do México' },
    { date: new Date('2026-06-18T13:00:00-03:00'), stadium: 'Mercedes-Benz Stadium', city: 'Atlanta' },
    { date: new Date('2026-06-18T16:00:00-03:00'), stadium: 'SoFi Stadium', city: 'Los Angeles' },
    { date: new Date('2026-06-18T19:00:00-03:00'), stadium: 'BC Place', city: 'Vancouver' },
    { date: new Date('2026-06-18T22:00:00-03:00'), stadium: 'Estádio de Guadalajara', city: 'Guadalajara' },
    { date: new Date('2026-06-19T16:00:00-03:00'), stadium: 'Lumen Field', city: 'Seattle' },
    { date: new Date('2026-06-19T19:00:00-03:00'), stadium: 'Gillette Stadium', city: 'Boston' },
    { date: new Date('2026-06-19T21:30:00-03:00'), stadium: 'Lincoln Financial Field', city: 'Filadélfia' },
    { date: new Date('2026-06-20T00:00:00-03:00'), stadium: 'Levi Stadium', city: 'Santa Clara' },
    { date: new Date('2026-06-20T14:00:00-03:00'), stadium: 'NRG Stadium', city: 'Houston' },
    { date: new Date('2026-06-20T17:00:00-03:00'), stadium: 'BMO Field', city: 'Toronto' },
    { date: new Date('2026-06-20T21:00:00-03:00'), stadium: 'Arrowhead Stadium', city: 'Kansas City' },
    { date: new Date('2026-06-20T23:00:00-03:00'), stadium: 'Estádio BBVA', city: 'Monterrey' },
    { date: new Date('2026-06-21T13:00:00-03:00'), stadium: 'Mercedes-Benz Stadium', city: 'Atlanta' },
    { date: new Date('2026-06-21T16:00:00-03:00'), stadium: 'SoFi Stadium', city: 'Los Angeles' },
    { date: new Date('2026-06-21T19:00:00-03:00'), stadium: 'Hard Rock Stadium', city: 'Miami' },
    { date: new Date('2026-06-21T22:00:00-03:00'), stadium: 'BC Place', city: 'Vancouver' },
    { date: new Date('2026-06-22T14:00:00-03:00'), stadium: 'AT&T Stadium', city: 'Dallas' },
    { date: new Date('2026-06-22T18:00:00-03:00'), stadium: 'Lincoln Financial Field', city: 'Filadélfia' },
    { date: new Date('2026-06-22T21:00:00-03:00'), stadium: 'MetLife Stadium', city: 'Nova York/Nova Jersey' },
    { date: new Date('2026-06-23T00:00:00-03:00'), stadium: 'Levi Stadium', city: 'Santa Clara' },
    { date: new Date('2026-06-23T14:00:00-03:00'), stadium: 'NRG Stadium', city: 'Houston' },
    { date: new Date('2026-06-23T17:00:00-03:00'), stadium: 'Gillette Stadium', city: 'Boston' },
    { date: new Date('2026-06-23T20:00:00-03:00'), stadium: 'BMO Field', city: 'Toronto' },
    { date: new Date('2026-06-23T23:00:00-03:00'), stadium: 'Estádio de Guadalajara', city: 'Guadalajara' },
    { date: new Date('2026-06-24T16:00:00-03:00'), stadium: 'BC Place', city: 'Vancouver' },
    { date: new Date('2026-06-24T16:00:00-03:00'), stadium: 'Lumen Field', city: 'Seattle' }, // NOTE: duplicates, but we'll try to find them safely
    { date: new Date('2026-06-24T19:00:00-03:00'), stadium: 'Hard Rock Stadium', city: 'Miami' },
    { date: new Date('2026-06-24T19:00:00-03:00'), stadium: 'Mercedes-Benz Stadium', city: 'Atlanta' },
    { date: new Date('2026-06-24T22:00:00-03:00'), stadium: 'Estádio Azteca', city: 'Cidade do México' },
    { date: new Date('2026-06-24T22:00:00-03:00'), stadium: 'Estádio BBVA', city: 'Monterrey' },
    { date: new Date('2026-06-25T17:00:00-03:00'), stadium: 'MetLife Stadium', city: 'Nova York/Nova Jersey' },
    { date: new Date('2026-06-25T17:00:00-03:00'), stadium: 'Lincoln Financial Field', city: 'Filadélfia' },
    { date: new Date('2026-06-25T20:00:00-03:00'), stadium: 'AT&T Stadium', city: 'Dallas' },
    { date: new Date('2026-06-25T20:00:00-03:00'), stadium: 'Arrowhead Stadium', city: 'Kansas City' },
    { date: new Date('2026-06-25T23:00:00-03:00'), stadium: 'SoFi Stadium', city: 'Los Angeles' },
    { date: new Date('2026-06-25T23:00:00-03:00'), stadium: 'Levi Stadium', city: 'Santa Clara' },
    { date: new Date('2026-06-26T16:00:00-03:00'), stadium: 'Gillette Stadium', city: 'Boston' },
    { date: new Date('2026-06-26T16:00:00-03:00'), stadium: 'BMO Field', city: 'Toronto' },
    { date: new Date('2026-06-26T21:00:00-03:00'), stadium: 'NRG Stadium', city: 'Houston' },
    { date: new Date('2026-06-26T21:00:00-03:00'), stadium: 'Estádio de Guadalajara', city: 'Guadalajara' },
    { date: new Date('2026-06-27T00:00:00-03:00'), stadium: 'Lumen Field', city: 'Seattle' },
    { date: new Date('2026-06-27T00:00:00-03:00'), stadium: 'BC Place', city: 'Vancouver' },
    { date: new Date('2026-06-27T18:00:00-03:00'), stadium: 'MetLife Stadium', city: 'Nova York/Nova Jersey' },
    { date: new Date('2026-06-27T18:00:00-03:00'), stadium: 'Lincoln Financial Field', city: 'Filadélfia' },
    { date: new Date('2026-06-27T20:30:00-03:00'), stadium: 'Hard Rock Stadium', city: 'Miami' },
    { date: new Date('2026-06-27T20:30:00-03:00'), stadium: 'Mercedes-Benz Stadium', city: 'Atlanta' },
    { date: new Date('2026-06-27T23:00:00-03:00'), stadium: 'Arrowhead Stadium', city: 'Kansas City' },
    { date: new Date('2026-06-28T23:00:00-03:00'), stadium: 'AT&T Stadium', city: 'Dallas' },
    { date: new Date('2026-06-28T16:00:00-03:00'), stadium: 'SoFi Stadium', city: 'Los Angeles' },
    { date: new Date('2026-06-29T15:00:00-03:00'), stadium: 'Gillette Stadium', city: 'Boston' },
    { date: new Date('2026-06-29T19:00:00-03:00'), stadium: 'Estádio BBVA', city: 'Monterrey' },
    { date: new Date('2026-06-29T22:30:00-03:00'), stadium: 'NRG Stadium', city: 'Houston' },
    { date: new Date('2026-06-30T14:00:00-03:00'), stadium: 'MetLife Stadium', city: 'Nova York/Nova Jersey' },
    { date: new Date('2026-06-30T18:00:00-03:00'), stadium: 'AT&T Stadium', city: 'Dallas' },
    { date: new Date('2026-06-30T22:00:00-03:00'), stadium: 'Estádio Azteca', city: 'Cidade do México' },
    { date: new Date('2026-07-01T13:00:00-03:00'), stadium: 'Mercedes-Benz Stadium', city: 'Atlanta' },
    { date: new Date('2026-07-01T17:00:00-03:00'), stadium: 'Levi Stadium', city: 'Santa Clara' },
    { date: new Date('2026-07-01T21:00:00-03:00'), stadium: 'Lumen Field', city: 'Seattle' },
    { date: new Date('2026-07-02T16:00:00-03:00'), stadium: 'BMO Field', city: 'Toronto' },
    { date: new Date('2026-07-02T20:00:00-03:00'), stadium: 'SoFi Stadium', city: 'Los Angeles' },
    { date: new Date('2026-07-02T23:59:00-03:00'), stadium: 'BC Place', city: 'Vancouver' },
    { date: new Date('2026-07-03T15:00:00-03:00'), stadium: 'Hard Rock Stadium', city: 'Miami' },
    { date: new Date('2026-07-03T19:00:00-03:00'), stadium: 'Arrowhead Stadium', city: 'Kansas City' },
    { date: new Date('2026-07-03T22:30:00-03:00'), stadium: 'AT&T Stadium', city: 'Dallas' },
    { date: new Date('2026-07-04T14:00:00-03:00'), stadium: 'Lincoln Financial Field', city: 'Filadélfia' },
    { date: new Date('2026-07-04T18:00:00-03:00'), stadium: 'NRG Stadium', city: 'Houston' },
    { date: new Date('2026-07-05T17:00:00-03:00'), stadium: 'MetLife Stadium', city: 'Nova York/Nova Jersey' },
    { date: new Date('2026-07-05T21:00:00-03:00'), stadium: 'Estádio Azteca', city: 'Cidade do México' },
    { date: new Date('2026-07-06T16:00:00-03:00'), stadium: 'AT&T Stadium', city: 'Dallas' },
    { date: new Date('2026-07-06T21:00:00-03:00'), stadium: 'Lumen Field', city: 'Seattle' },
    { date: new Date('2026-07-07T13:00:00-03:00'), stadium: 'Mercedes-Benz Stadium', city: 'Atlanta' },
    { date: new Date('2026-07-07T17:00:00-03:00'), stadium: 'BC Place', city: 'Vancouver' },
    { date: new Date('2026-07-09T17:00:00-03:00'), stadium: 'Gillette Stadium', city: 'Boston' },
    { date: new Date('2026-07-10T16:00:00-03:00'), stadium: 'SoFi Stadium', city: 'Los Angeles' },
    { date: new Date('2026-07-11T18:00:00-03:00'), stadium: 'Hard Rock Stadium', city: 'Miami' },
    { date: new Date('2026-07-11T22:00:00-03:00'), stadium: 'Arrowhead Stadium', city: 'Kansas City' },
    { date: new Date('2026-07-14T16:00:00-03:00'), stadium: 'AT&T Stadium', city: 'Dallas' },
    { date: new Date('2026-07-15T16:00:00-03:00'), stadium: 'Mercedes-Benz Stadium', city: 'Atlanta' },
    { date: new Date('2026-07-18T18:00:00-03:00'), stadium: 'Hard Rock Stadium', city: 'Miami' },
    { date: new Date('2026-07-19T16:00:00-03:00'), stadium: 'MetLife Stadium', city: 'Nova York/Nova Jersey' }
  ];

  const dbMatches = await prisma.match.findMany();
  
  for (let i = 0; i < matchesData.length; i++) {
    const fixture = matchesData[i];
    // Find matching match in DB
    const match = dbMatches.find(m => 
      m.date.getTime() === fixture.date.getTime() &&
      m.stadium === fixture.stadium &&
      m.city === fixture.city
    );

    if (match) {
      await prisma.match.update({
        where: { id: match.id },
        data: { apiFixtureId: i + 1 }
      });
      console.log(`Updated match ${i + 1} (${match.stage} - ${match.stadium})`);
    } else {
      console.log(`COULD NOT FIND MATCH ${i + 1}`, fixture);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
