import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tokens = await prisma.verificationToken.findMany({
    orderBy: { expires: 'desc' },
    take: 20
  });
  
  console.log('Last 20 Tokens in DB:');
  tokens.forEach(t => {
    console.log(`- ID: ${t.id}, Identifier: ${t.identifier}, Token: ${t.token.substring(0, 8)}..., Expires: ${t.expires.toISOString()}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
