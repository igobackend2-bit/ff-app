import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'igoagritechfarms@gmail.com';
  const tokens = await prisma.verificationToken.findMany({
    where: { identifier: email },
    orderBy: { expires: 'desc' },
    take: 5
  });
  console.log('Current UTC Time:', new Date().toISOString());
  console.log('Last 5 tokens for', email, ':');
  tokens.forEach((t, i) => {
    console.log(`${i+1}: Token: ${t.token.substring(0,10)}... Expires: ${t.expires.toISOString()} (Expired: ${new Date() > t.expires})`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
