import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tokens = await prisma.verificationToken.findMany({
    orderBy: { expires: 'desc' },
    take: 5,
  });
  console.log('Last 5 Verification Tokens:', JSON.stringify(tokens, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
