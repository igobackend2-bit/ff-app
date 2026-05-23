import { PrismaClient } from '@prisma/client';
import {
  FRUIT_CATEGORY_SLUG,
  FRUIT_PRODUCTS,
  fruitImage,
  fruitSlug,
} from '../lib/fruit-catalog';

const prisma = new PrismaClient();

async function main() {
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
    where: { slug: FRUIT_CATEGORY_SLUG },
    update: {
      name: 'Fresh Fruits',
      imageUrl: fruitImage('apple.jfif'),
      sortOrder: 2,
      isActive: true,
      metaTitle: 'Fresh Fruits - Farmers Factory',
      metaDescription: 'Buy fresh farm fruits online from Farmers Factory.',
      ogImageUrl: fruitImage('apple.jfif'),
    },
    create: {
      name: 'Fresh Fruits',
      slug: FRUIT_CATEGORY_SLUG,
      imageUrl: fruitImage('apple.jfif'),
      sortOrder: 2,
      isActive: true,
      metaTitle: 'Fresh Fruits - Farmers Factory',
      metaDescription: 'Buy fresh farm fruits online from Farmers Factory.',
      ogImageUrl: fruitImage('apple.jfif'),
    },
  });

  const desiredSlugs = FRUIT_PRODUCTS.map((product) =>
    fruitSlug(product.name, product.unit),
  );

  const hidden = await prisma.product.updateMany({
    where: {
      categoryId: category.id,
      slug: { notIn: desiredSlugs },
    },
    data: {
      isActive: false,
      inStock: false,
      isFeatured: false,
    },
  });

  let upserted = 0;
  for (const product of FRUIT_PRODUCTS) {
    const slug = fruitSlug(product.name, product.unit);
    const mrp = Math.round(product.price * 1.2);
    const imageUrls = JSON.stringify([fruitImage(product.imageFile)]);

    await prisma.product.upsert({
      where: { slug },
      update: {
        name: product.name,
        description: `${product.name} (${product.unit}) sourced for the Farmers Factory fresh fruits category.`,
        categoryId: category.id,
        brandId: brand.id,
        mrp,
        price: product.price,
        unit: product.unit,
        imageUrls,
        tags: JSON.stringify(['fruits', 'fresh fruits', 'farm fruits']),
        isFeatured: product.featured,
        isActive: true,
        inStock: true,
      },
      create: {
        name: product.name,
        slug,
        sku: `FF-FR-${slug.toUpperCase()}`.slice(0, 50),
        description: `${product.name} (${product.unit}) sourced for the Farmers Factory fresh fruits category.`,
        imageUrls,
        blurDataUrls: '[]',
        categoryId: category.id,
        brandId: brand.id,
        mrp,
        price: product.price,
        unit: product.unit,
        tags: JSON.stringify(['fruits', 'fresh fruits', 'farm fruits']),
        isFeatured: product.featured,
        isActive: true,
        inStock: true,
        averageRating: 4.6,
        reviewCount: 120,
      },
    });
    upserted++;
  }

  console.log(
    `Seeded ${upserted} fresh fruit products in category: ${category.name}; hidden duplicates: ${hidden.count}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
