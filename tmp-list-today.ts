import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tokens = await prisma.verificationToken.findMany({
    where: {
      expires: {
        gte: today
      }
    },
    orderBy: { expires: 'desc' }
  });
  
  console.log('Tokens expiring today:');
  tokens.forEach(t => {
    console.log(`- Identifier: ${t.identifier}, Expires: ${t.expires.toISOString()}, Token Prefix: ${t.token.substring(0, 8)}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
