import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  VEGETABLE_CATEGORY_SLUG,
  VEGETABLE_PRODUCTS,
  vegetableImage,
  vegetableSlug,
} from '@/lib/vegetable-catalog';

export async function GET() {
  try {
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
    for (const product of VEGETABLE_PRODUCTS) {
      const slug = vegetableSlug(product.name, product.unit);
      const imageUrls = JSON.stringify([vegetableImage(product.imageFile)]);
      const mrp = Math.round(product.price * 1.2);

      await prisma.product.upsert({
        where: { slug },
        update: {
          name: product.name,
          description: `${product.name} (${product.unit}) sourced for the Farmers Factory fresh vegetables category.`,
          price: product.price,
          mrp,
          unit: product.unit,
          imageUrls,
          categoryId: category.id,
          brandId: brand.id,
          tags: JSON.stringify(['vegetables', 'fresh vegetables', 'farm vegetables']),
          isActive: true,
          inStock: true,
        },
        create: {
          name: product.name,
          slug,
          price: product.price,
          mrp,
          unit: product.unit,
          imageUrls,
          blurDataUrls: '[]',
          categoryId: category.id,
          brandId: brand.id,
          sku: `FF-VG-${slug.toUpperCase()}`.slice(0, 50),
          description: `${product.name} (${product.unit}) sourced for the Farmers Factory fresh vegetables category.`,
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

    return NextResponse.json({
      ok: true,
      category: category.slug,
      upserted,
      hiddenDuplicates: hidden.count,
    });
  } catch (err) {
    console.error('[seed-vegetables]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
