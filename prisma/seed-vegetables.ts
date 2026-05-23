// Run: npx ts-node --skip-project prisma/seed-vegetables.ts
// or:  npx tsx prisma/seed-vegetables.ts

import { PrismaClient } from '@prisma/client';
import {
  VEGETABLE_CATEGORY_SLUG,
  VEGETABLE_PRODUCTS,
  vegetableImage,
  vegetableSlug,
} from '../lib/vegetable-catalog';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Fresh Vegetables...');

  const brand = await prisma.brand.upsert({
    where: { slug: 'farmers-factory' },
    update: {},
    create: {
      name: 'Farmers Factory',
      slug: 'farmers-factory',
      logoUrl: '/logo.jpg',
    },
  });

  const category = await prisma.category.upsert({
    where: { slug: VEGETABLE_CATEGORY_SLUG },
    update: {
      name: 'Fresh Vegetables',
      imageUrl: vegetableImage('AshGourd.jfif'),
      sortOrder: 1,
      isActive: true,
      metaTitle: 'Fresh Vegetables - Farmers Factory',
      metaDescription: 'Buy fresh farm vegetables online from Farmers Factory.',
      ogImageUrl: vegetableImage('AshGourd.jfif'),
    },
    create: {
      name: 'Fresh Vegetables',
      slug: VEGETABLE_CATEGORY_SLUG,
      imageUrl: vegetableImage('AshGourd.jfif'),
      sortOrder: 1,
      isActive: true,
      metaTitle: 'Fresh Vegetables - Farmers Factory',
      metaDescription: 'Buy fresh farm vegetables online from Farmers Factory.',
      ogImageUrl: vegetableImage('AshGourd.jfif'),
    },
  });

  const desiredSlugs = VEGETABLE_PRODUCTS.map((product) =>
    vegetableSlug(product.name, product.unit),
  );

  const hidden = await prisma.product.updateMany({
    where: {
      categoryId: category.id,
      slug: { notIn: desiredSlugs },
    },
    data: {
      isActive: false,
      inStock: false,
    },
  });

  let upserted = 0;
  for (const veg of VEGETABLE_PRODUCTS) {
    const slug = vegetableSlug(veg.name, veg.unit);
    const imageUrls = JSON.stringify([vegetableImage(veg.imageFile)]);
    const mrp = Math.round(veg.price * 1.2);

    await prisma.product.upsert({
      where: { slug },
      update: {
        name: veg.name,
        description: `${veg.name} (${veg.unit}) sourced for the Farmers Factory fresh vegetables category.`,
        price: veg.price,
        mrp,
        unit: veg.unit,
        imageUrls,
        categoryId: category.id,
        brandId: brand.id,
        tags: JSON.stringify(['vegetables', 'fresh vegetables', 'farm vegetables']),
        isActive: true,
        inStock: true,
      },
      create: {
        name: veg.name,
        slug,
        price: veg.price,
        mrp,
        unit: veg.unit,
        imageUrls,
        blurDataUrls: '[]',
        categoryId: category.id,
        brandId: brand.id,
        sku: `FF-VG-${slug.toUpperCase()}`.slice(0, 50),
        description: `${veg.name} (${veg.unit}) sourced for the Farmers Factory fresh vegetables category.`,
        tags: JSON.stringify(['vegetables', 'fresh vegetables', 'farm vegetables']),
        isActive: true,
        inStock: true,
        isFeatured: false,
        averageRating: 4.5,
        reviewCount: 50,
      },
    });
    upserted++;
  }

  console.log(`Done. Upserted: ${upserted}; hidden duplicates: ${hidden.count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
