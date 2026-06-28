const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const matches = await prisma.match.findMany({
    where: { stage: 'Dezesseisavos de Final' },
    select: { homeTeamName: true, awayTeamName: true }
  });
  console.log(matches);
}

main().catch(console.error).finally(() => prisma.$disconnect());
