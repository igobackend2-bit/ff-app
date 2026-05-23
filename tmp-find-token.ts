import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'igoagritechfarms@gmail.com';
  const token = await prisma.verificationToken.findFirst({
    where: { identifier: email },
    orderBy: { expires: 'desc' },
  });
  console.log('Token for', email, ':', JSON.stringify(token, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
