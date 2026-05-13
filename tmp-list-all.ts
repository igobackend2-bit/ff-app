import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ take: 5 });
  console.log('Users:', JSON.stringify(users, null, 2));
  
  const tokens = await prisma.verificationToken.findMany({ take: 5 });
  console.log('Tokens:', JSON.stringify(tokens, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
