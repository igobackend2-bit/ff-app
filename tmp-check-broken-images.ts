import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    where: {
      name: {
        in: [
          'Bitter Gourd (Pavakkai)',
          'Organic Carrot',
          'Drumstick (Murungakkai)',
          'Green Chilli (Nattu)',
          'Country Brinjal',
          'Baby Spinach (Palak)',
          'Organic Tomatoes (Local)'
        ]
      }
    },
    select: {
      id: true,
      name: true,
      imageUrls: true,
      category: {
        select: {
          name: true
        }
      }
    }
  });

  console.log(JSON.stringify(products, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
