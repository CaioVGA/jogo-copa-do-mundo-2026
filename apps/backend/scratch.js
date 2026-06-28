const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const matches = await prisma.match.findMany({ orderBy: { date: 'asc' } });
  console.log(matches.map((m, i) => `Game ${i + 1}: ${m.stage} - ${m.homeTeamName || m.homeTeamId} vs ${m.awayTeamName || m.awayTeamId} (${m.date})`).slice(70, 80).join('\n'));
}
main();
