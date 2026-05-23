import { PrismaClient } from '@prisma/client';
import { VALLUVAM_CATALOG, valluvamSlug, valluvamImage } from '../lib/valluvam-catalog';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting Valluvam products seeding...');

  // 1. Ensure "Valluvam" brand exists
  const brand = await prisma.brand.upsert({
    where: { slug: 'valluvam' },
    update: { name: 'Valluvam Products' },
    create: {
      name: 'Valluvam Products',
      slug: 'valluvam',
      logoUrl: '/images/valluvam/honey.jpeg', // Using honey as a representative logo
    },
  });

  for (const catData of VALLUVAM_CATALOG) {
    console.log(`Processing category: ${catData.name}`);
    
    // 2. Upsert Category
    const category = await prisma.category.upsert({
      where: { slug: catData.slug },
      update: {
        name: catData.name,
        imageUrl: valluvamImage(catData.imageFile),
        sortOrder: catData.sortOrder,
      },
      create: {
        name: catData.name,
        slug: catData.slug,
        imageUrl: valluvamImage(catData.imageFile),
        sortOrder: catData.sortOrder,
        isActive: true,
      },
    });

    // 3. Upsert Products
    for (const prodData of catData.products) {
      const slug = valluvamSlug(prodData.name, prodData.unit);
      const sku = `VL-${slug.toUpperCase()}`;

      console.log(`  - Product: ${prodData.name} (${prodData.unit})`);

      await prisma.product.upsert({
        where: { slug },
        update: {
          name: prodData.name,
          mrp: prodData.price + 20, // Example markup for MRP
          price: prodData.price,
          unit: prodData.unit,
          imageUrls: JSON.stringify([valluvamImage(prodData.imageFile)]),
          isFeatured: prodData.featured,
          categoryId: category.id,
          brandId: brand.id,
        },
        create: {
          name: prodData.name,
          slug: slug,
          sku: sku,
          mrp: prodData.price + 20,
          price: prodData.price,
          unit: prodData.unit,
          imageUrls: JSON.stringify([valluvamImage(prodData.imageFile)]),
          isFeatured: prodData.featured,
          isActive: true,
          inStock: true,
          categoryId: category.id,
          brandId: brand.id,
        },
      });
    }
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
