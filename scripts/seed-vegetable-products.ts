import { PrismaClient } from '@prisma/client';
import { VEGETABLE_PRODUCTS } from '../lib/vegetable-catalog';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seeding of vegetable products...');

  // Ensure Farmers Factory brand exists
  const brand = await prisma.brand.upsert({
    where: { slug: 'farmers-factory' },
    update: {},
    create: {
      name: 'Farmers Factory',
      slug: 'farmers-factory',
    },
  });

  // Ensure Farm Fresh Vegetables category exists
  const category = await prisma.category.upsert({
    where: { slug: 'farm-fresh' },
    update: {
      name: 'Farm Fresh Vegetables',
      imageUrl: '/images/categories/vegetables.jfif',
      description: 'Farm fresh vegetables delivered to your doorstep'
    },
    create: {
      name: 'Farm Fresh Vegetables',
      slug: 'farm-fresh',
      imageUrl: '/images/categories/vegetables.jfif',
      description: 'Farm fresh vegetables delivered to your doorstep',
      sortOrder: 1,
      isActive: true,
      metaTitle: 'Farm Fresh Vegetables — Farmers Factory',
      metaDescription: 'Buy fresh vegetables online. Direct from farm to your home.',
    }
  });

  console.log(`Category: ${category.name} (ID: ${category.id})`);

  // Deactivate existing products in this category to ensure no broken links show up
  // We use updateMany instead of deleteMany to avoid foreign key constraint errors
  await prisma.product.updateMany({
    where: { categoryId: category.id },
    data: { isActive: false }
  });
  console.log('Deactivated existing products in category.');

  for (const product of VEGETABLE_PRODUCTS) {
    const slug = product.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    const sku = `FF-VEG-${product.name.replace(/ /g, '').slice(0, 5).toUpperCase()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
    
    // mrp is set slightly higher than price if not specified
    const mrp = Math.ceil(product.price * 1.15);

    await prisma.product.upsert({
      where: { slug: slug },
      update: {
        name: product.name,
        price: product.price,
        mrp: mrp,
        unit: product.unit,
        imageUrls: JSON.stringify([`/images/vegtables/${product.imageFile}`]),
        categoryId: category.id,
        brandId: brand.id,
        isActive: true,
        inStock: true,
      },
      create: {
        name: product.name,
        slug: slug,
        sku: sku,
        price: product.price,
        mrp: mrp,
        unit: product.unit,
        imageUrls: JSON.stringify([`/images/vegtables/${product.imageFile}`]),
        categoryId: category.id,
        brandId: brand.id,
        isActive: true,
        inStock: true,
        tags: JSON.stringify(['vegetables', 'fresh', 'farm']),
        averageRating: 4.5,
        reviewCount: Math.floor(Math.random() * 50) + 10,
      }
    });
  }

  console.log(`Seeded ${VEGETABLE_PRODUCTS.length} vegetable products.`);
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
