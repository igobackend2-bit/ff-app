const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    take: 5,
    select: { id: true, status: true }
  });
  console.log(JSON.stringify(orders, null, 2));
  await prisma.$disconnect();
}

main();
