const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  try {
    const allTokens = await prisma.verificationToken.findMany({
      orderBy: { expires: 'desc' },
      take: 20
    });
    
    fs.writeFileSync('db-results.json', JSON.stringify(allTokens, null, 2));
    console.log('All tokens written to db-results.json');

  } catch (err) {
    console.error('Error querying DB:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
