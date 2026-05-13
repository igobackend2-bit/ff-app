import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tokens = await prisma.verificationToken.findMany({
    orderBy: { expires: 'desc' },
    take: 5
  });
  console.log('Recent Verification Tokens:', JSON.stringify(tokens, null, 2));

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: 'igoagritech' } },
        { phone: { contains: '9677462150' } }
      ]
    }
  });
  console.log('Relevant Users:', JSON.stringify(users, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
